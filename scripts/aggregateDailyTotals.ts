import fs from 'fs';
import path from 'path';

/**
 * Aggregate total stop-and-search records per day across all data files.
 * Produces data-aggregation/total/daily-totals.json with shape { "YYYY-MM-DD": number }
 */
export async function buildDailyTotals() {
  const DATA_DIR = path.join(process.cwd(), 'data');
  const OUT_DIR = path.join(process.cwd(), 'data-aggregation', 'total');
  const OUT_FILE = path.join(OUT_DIR, 'daily-totals.json');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const daily: Record<string, number> = {};
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  console.log(`Processing ${files.length} files…`);

  for (const file of files) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    let records: any[];
    try {
      records = JSON.parse(content);
    } catch {
      console.warn(`Skip invalid JSON ${file}`);
      continue;
    }
    for (const rec of records) {
      const dt: string | undefined = rec.datetime;
      if (!dt) continue;
      const date = dt.slice(0, 10);
      daily[date] = (daily[date] || 0) + 1;
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(daily, null, 2));
  console.log(`✓ Wrote ${OUT_FILE}`);
}

if (typeof require === 'undefined' || (typeof require !== 'undefined' && require.main === module)) {
  buildDailyTotals().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
