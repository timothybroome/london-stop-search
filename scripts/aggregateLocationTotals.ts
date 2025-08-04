import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { FeatureCollection, Feature, Polygon } from 'geojson';

/**
 * Aggregates stop-and-search records into a daily count per London borough.
 *
 * Source records:   ./data/<YYYY-MM>.json  (downloaded via downloadData.ts)
 * Output file:      ./data-aggregation/location/daily-borough-totals.json
 */
export async function buildDailyBoroughTotals() {
  const DATA_DIR = path.join(process.cwd(), 'data');
  const OUT_DIR = path.join(process.cwd(), 'data-aggregation', 'location');
  const OUT_FILE = path.join(OUT_DIR, 'daily-borough-totals.json');

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. Load borough polygons --------------------------------------------------
  const geoUrl =
    'https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson';
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok)
    throw new Error(`Failed to fetch borough geojson – HTTP ${geoRes.status}`);
  const geo: FeatureCollection<Polygon> = (await geoRes.json()) as any;

  // Pre-compute bbox for each borough to speed up point-in-poly tests
  const boroughPolys = geo.features.map((f: Feature<Polygon>) => ({
    name: f.properties?.name as string,
    poly: f,
    box: bbox(f), // [minX, minY, maxX, maxY]
  }));

  // 2. Iterate all monthly files --------------------------------------------
  const daily: Record<string, Record<string, number>> = {};

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  console.log(`Processing ${files.length} data files…`);

  for (const file of files) {
    const full = path.join(DATA_DIR, file);
    const content = fs.readFileSync(full, 'utf8');
    let records: any[];
    try {
      records = JSON.parse(content);
    } catch (err) {
      console.warn(`✖︎ Skip ${file} – invalid JSON`);
      continue;
    }

    for (const rec of records) {
      const dt: string | undefined = rec.datetime;
      const lat = parseFloat(rec.location?.latitude as string);
      const lon = parseFloat(rec.location?.longitude as string);
      if (!dt || Number.isNaN(lat) || Number.isNaN(lon)) continue;
      const date = dt.slice(0, 10); // YYYY-MM-DD

      // point-in-polygon lookup
      let boroughName: string | undefined;
      for (const b of boroughPolys) {
        const [minX, minY, maxX, maxY] = b.box;
        if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
        if (booleanPointInPolygon(point([lon, lat]), b.poly)) {
          boroughName = b.name;
          break;
        }
      }
      if (!boroughName) continue; // outside London

      daily[date] ??= {};
      daily[date][boroughName] = (daily[date][boroughName] || 0) + 1;
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(daily, null, 2));
  console.log(`✓ Wrote ${OUT_FILE}`);
}

// Execute when run directly (works in both CommonJS & ESM)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - `require` may be undefined in ESM, but `typeof` protects us
// prettier-ignore
if (typeof require === 'undefined' || (typeof require !== 'undefined' && require.main === module)) {
  buildDailyBoroughTotals().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
