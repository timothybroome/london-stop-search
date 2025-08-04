import fs from 'fs';
import path from 'path';

/**
 * Aggregates stop-and-search records into a daily count per ethnicity.
 * Output written to data-aggregation/ethnicity/daily-ethnicity-totals.json
 */
export async function buildDailyEthnicityTotals() {
  const DATA_DIR = path.join(process.cwd(), 'data');
  const OUT_DIR = path.join(process.cwd(), 'data-aggregation', 'ethnicity');
  const OUT_FILE = path.join(OUT_DIR, 'daily-ethnicity-totals.json');

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const daily: Record<string, Record<string, number>> = {};
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  console.log(`Processing ${files.length} data files…`);

  for (const file of files) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    let records: any[];
    try {
      records = JSON.parse(content);
    } catch {
      console.warn(`Skip ${file}, invalid JSON`);
      continue;
    }

    for (const rec of records) {
      const dt: string | undefined = rec.datetime;
      const eth: string = rec.officer_defined_ethnicity || 'Unknown';
      if (!dt) continue;
      const date = dt.slice(0, 10);
      daily[date] ??= {};
      daily[date][eth] = (daily[date][eth] || 0) + 1;
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(daily, null, 2));
  console.log(`✓ Wrote ${OUT_FILE}`);
}

// Execute when run directly (works for ESM as well)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof require === 'undefined' || (typeof require !== 'undefined' && require.main === module)) {
  buildDailyEthnicityTotals().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
