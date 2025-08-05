import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { loadAllData, StopSearchRecord, FilterMap } from '@/lib/dataUtils';
import { parseFilters } from '@/lib/dataUtils';
import path from 'path';

let cache: Record<string, Record<string, number>> | null = null;

function load() {
  if (cache) return cache;
  const file = path.join(process.cwd(), 'data-aggregation', 'ethnicity', 'daily-ethnicity-totals.json');
  cache = JSON.parse(fs.readFileSync(file, 'utf8'));
  return cache;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { dateStart, dateEnd } = req.query;
    const filters = parseFilters(req.query);
    const allowedEth = filters.officer_defined_ethnicity;
    const otherFilterKeys = Object.keys(filters).filter(k => k !== 'officer_defined_ethnicity');
    const start = typeof dateStart === 'string' ? dateStart : undefined;
    const end = typeof dateEnd === 'string' ? dateEnd : undefined;

    let totals: Record<string, number> = {};

    // If other cross-filters present, fall back to scanning raw records
    if (otherFilterKeys.length > 0) {
      const all = await loadAllData();
      all.forEach((rec: StopSearchRecord) => {
        if (start && rec.datetime < start) return;
        if (end && rec.datetime > end) return;
        if (allowedEth && !allowedEth.includes(rec.officer_defined_ethnicity || '')) return;
        for (const key of otherFilterKeys) {
          const arr = (filters as FilterMap)[key];
          if (!arr) continue;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const val = (rec as any)[key];
          if (!arr.includes(String(val))) return;
        }
        const eth = String(rec.officer_defined_ethnicity || 'Unknown');
        totals[eth] = (totals[eth] || 0) + 1;
      });
    } else {
      const daily = load() as Record<string, Record<string, number>>;
      totals = {};
      Object.entries(daily).forEach(([date, obj]) => {
        if (start && date < start) return;
        if (end && date > end) return;
        Object.entries(obj as Record<string, number>).forEach(([eth, cnt]) => {
          if (allowedEth && !allowedEth.includes(eth)) return;
          totals[eth] = (totals[eth] || 0) + cnt;
        });
      });
    }
    res.status(200).json({ totals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
}
