import fs from 'fs';
import path from 'path';

/**
 * Build monthly totals across all data files.
 * Output: data-aggregation/total/monthly-totals.json { "YYYY-MM": number }
 */
export async function buildMonthlyTotals() {
  const DATA_DIR = path.join(process.cwd(), 'data');
  const OUT_DIR = path.join(process.cwd(), 'data-aggregation', 'total');
  const OUT_FILE = path.join(OUT_DIR, 'monthly-totals.json');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const monthly: Record<string, number> = {};
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    let records: any[];
    try {
      records = JSON.parse(content);
    } catch {
      console.warn(`invalid JSON ${file}`);
      continue;
    }
    for (const rec of records) {
      const dt: string | undefined = rec.datetime;
      if (!dt) continue;
      const month = dt.slice(0, 7); // YYYY-MM
      monthly[month] = (monthly[month] || 0) + 1;
    }
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(monthly, null, 2));
  console.log(`✓ Wrote ${OUT_FILE}`);
}

if (typeof require === 'undefined' || (typeof require !== 'undefined' && require.main === module)) {
  buildMonthlyTotals().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
