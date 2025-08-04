import { NextApiRequest, NextApiResponse } from "next";
import { getTotal, StopSearchRecord } from "../../../lib/dataUtils";
import fs from 'fs';
import path from 'path';

let dailyCache: Record<string, number> | undefined;
function loadDaily() {
  if (dailyCache) return dailyCache;
  const file = path.join(process.cwd(), 'data-aggregation', 'total', 'daily-totals.json');
  if (!fs.existsSync(file)) {
    dailyCache = {};
    return dailyCache;
  }
  dailyCache = JSON.parse(fs.readFileSync(file, 'utf8'));
  return dailyCache;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { dateStart, dateEnd, filterField, filterValue } = req.query;

    const startDate = typeof dateStart === "string" ? dateStart : undefined;
    const endDate = typeof dateEnd === "string" ? dateEnd : undefined;
    const field =
      typeof filterField === "string"
        ? (filterField as keyof StopSearchRecord)
        : undefined;
    const value = typeof filterValue === "string" ? filterValue : undefined;

    let total: number;
    if (!field && !value) {
      // use aggregated file for speed
      const daily = loadDaily() as Record<string, number>;
      if (!startDate && !endDate) {
        total = Object.values(daily).reduce((a, b) => a + b, 0);
      } else {
        total = Object.entries(daily).reduce((sum, [date, cnt]) => {
          if (startDate && date < startDate) return sum;
          if (endDate && date > endDate) return sum;
          return sum + cnt;
        }, 0);
      }
    } else {
      total = await getTotal(startDate, endDate, field, value);
    }

    res.status(200).json({
      total,
      dateStart: startDate,
      dateEnd: endDate,
      filterField: field,
      filterValue: value,
    });
  } catch (error) {
    console.error("Error in /api/data/total:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
