import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

// memoised data in module scope
let cached: Record<string, Record<string, number>> | null = null;

function loadDaily() {
  if (cached) return cached;
  const file = path.join(process.cwd(), "data-aggregation", "location", "daily-borough-totals.json");
  const raw = fs.readFileSync(file, "utf8");
  cached = JSON.parse(raw);
  return cached;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { dateStart, dateEnd } = req.query;
    const start = typeof dateStart === "string" ? dateStart : undefined;
    const end = typeof dateEnd === "string" ? dateEnd : undefined;

    const daily = loadDaily();

    const totals: Record<string, number> = {};

    Object.entries(daily).forEach(([date, boroughObj]) => {
      if (start && date < start) return;
      if (end && date > end) return;
      Object.entries(boroughObj).forEach(([borough, count]) => {
        totals[borough] = (totals[borough] || 0) + (count as number);
      });
    });

    res.status(200).json({ totals });
  } catch (err) {
    console.error("borough-totals api error", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
