import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

let cache: Record<string, Record<string, number>> | null = null;

function load() {
  if (cache) return cache;
  const file = path.join(process.cwd(), 'data-aggregation', 'ethnicity', 'daily-ethnicity-totals.json');
  cache = JSON.parse(fs.readFileSync(file, 'utf8'));
  return cache;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { dateStart, dateEnd } = req.query;
    const start = typeof dateStart === 'string' ? dateStart : undefined;
    const end = typeof dateEnd === 'string' ? dateEnd : undefined;

    const daily = load();
    const totals: Record<string, number> = {};
    Object.entries(daily).forEach(([date, obj]) => {
      if (start && date < start) return;
      if (end && date > end) return;
      Object.entries(obj as Record<string, number>).forEach(([eth, cnt]) => {
        totals[eth] = (totals[eth] || 0) + cnt;
      });
    });
    res.status(200).json({ totals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
}
