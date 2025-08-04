#!/usr/bin/env ts-node
/*
  One-off script to enrich each monthly JSON in ./data with a derived `borough` field.
  It loads the London borough GeoJSON, performs point-in-polygon lookup for every
  record using latitude / longitude, and writes the augmented arrays to ./data-enriched.

  Usage (from repo root):
      npx ts-node scripts/enrich-add-borough.ts

  Requirements: install dev dependency `@turf/turf`
      npm i --save-dev @turf/turf
*/
import fs from 'fs';
import path from 'path';
import { booleanPointInPolygon, point } from '@turf/turf';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

const DATA_DIR = path.join(process.cwd(), 'data');
const OUT_DIR = path.join(process.cwd(), 'data-enriched');
const GEOJSON_URL = 'https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson';

interface StopSearchRecord {
  location: {
    latitude: string;
    longitude: string;
    street?: { id: number; name: string };
  } | null;
  // Allow unknown extra properties
  [key: string]: any;
}

async function loadGeoJSON() {
  const res = await fetch(GEOJSON_URL);
  if (!res.ok) throw new Error(`Failed to download GeoJSON: ${res.status}`);
  const gj = (await res.json()) as {
    features: Feature<Polygon | MultiPolygon, { name: string }>[];
  };
  return gj.features.map((f) => ({ name: f.properties?.name ?? '', geom: f }));
}

function guessBoroughFromStreet(streetName?: string): string | null {
  if (!streetName) return null;
  const parts = streetName.split(' - ');
  return parts.length > 1 ? parts[0].trim() : null;
}

async function run() {
  if (!fs.existsSync(DATA_DIR)) throw new Error('data directory not found');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  const boroughPolys = await loadGeoJSON();
  console.log(`Loaded ${boroughPolys.length} borough polygons`);

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const srcPath = path.join(DATA_DIR, file);
    const dstPath = path.join(OUT_DIR, file);
    const raw = fs.readFileSync(srcPath, 'utf8');
    const records: StopSearchRecord[] = JSON.parse(raw);

    let matched = 0;
    let guessed = 0;
    records.forEach((rec) => {
      if (rec.borough) return; // already enriched
      let borough: string | null = null;
      if (rec.location?.latitude && rec.location.longitude) {
        const lat = parseFloat(rec.location.latitude);
        const lon = parseFloat(rec.location.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          const pt = point([lon, lat]);
          const feature = boroughPolys.find(({ geom }) => booleanPointInPolygon(pt, geom));
          if (feature) borough = feature.name;
        }
      }
      if (!borough) {
        borough = guessBoroughFromStreet(rec.location?.street?.name);
        if (borough) guessed += 1;
      } else {
        matched += 1;
      }
      (rec as any).borough = borough ?? '';
    });

    fs.writeFileSync(dstPath, JSON.stringify(records));
    console.log(`${file}: ${matched} geo matches, ${guessed} guessed, total ${records.length}`);
  }

  console.log('Enrichment complete. Output written to ./data-enriched');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
