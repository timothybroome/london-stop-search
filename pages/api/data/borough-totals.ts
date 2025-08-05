import { NextApiRequest, NextApiResponse } from "next";
import { parseFilters, loadAllData, StopSearchRecord, FilterMap, recordBorough } from "../../../lib/dataUtils";
import path from "path";
import fs from "fs";

// memoised data in module scope
let cached: Record<string, Record<string, number>> | null = null;

function loadDaily() {
  if (cached) return cached;
  const file = path.join(process.cwd(), "data-aggregation", "location", "daily-borough-totals.json");
  const raw = fs.readFileSync(file, "utf8");
  cached = JSON.parse(raw);
  return cached;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { dateStart, dateEnd } = req.query;
    const filters = parseFilters(req.query);
    const allowedBorough = filters.borough;
    const otherKeys = Object.keys(filters).filter(k => k !== 'borough');
    const start = typeof dateStart === "string" ? dateStart : undefined;
    const end = typeof dateEnd === "string" ? dateEnd : undefined;

    const totals: Record<string, number> = {};

    if (otherKeys.length) {
      const all = await loadAllData();
      all.forEach((rec: StopSearchRecord) => {
        if (start && rec.datetime < start) return;
        if (end && rec.datetime > end) return;
        const borough = recordBorough(rec);
        if (allowedBorough && !allowedBorough.includes(borough)) return;
        for (const k of otherKeys) {
          const allowedArr = (filters as FilterMap)[k];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const val = String((rec as any)[k] ?? '');
          if (allowedArr && !allowedArr.includes(val)) return;
        }
        totals[borough] = (totals[borough] || 0) + 1;
      });
      if (Object.keys(totals).length === 0) {
        const daily = loadDaily();
        if (daily) {
          Object.values(daily).forEach((boroughObj: Record<string, number>) => {
          Object.entries(boroughObj).forEach(([borough, count]) => {
            totals[borough] = (totals[borough] || 0) + (count as number);
          });
          });
        }
      }
    } else {
      const daily = loadDaily();
      Object.entries(daily as Record<string, Record<string, number>>).forEach(([date, boroughObj]) => {
        if (start && date < start) return;
        if (end && date > end) return;
        Object.entries(boroughObj).forEach(([borough, count]) => {
          if (allowedBorough && !allowedBorough.includes(borough)) return;
          totals[borough] = (totals[borough] || 0) + (count as number);
        });
      });
    }

    res.status(200).json({ totals });
  } catch (err) {
    console.error("borough-totals api error", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
