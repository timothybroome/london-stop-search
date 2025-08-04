import { NextApiRequest, NextApiResponse } from "next";
import { getAgeRangeData, parseFilters, loadAllData, StopSearchRecord, FilterMap } from "../../../lib/dataUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { dateStart, dateEnd } = req.query;
    const filters = parseFilters(req.query);
    const allowedRange = filters.age_range;
    const otherKeys = Object.keys(filters).filter(k => k !== 'age_range');

    const startDate = typeof dateStart === "string" ? dateStart : undefined;
    const endDate = typeof dateEnd === "string" ? dateEnd : undefined;

    let ageRangeData: Record<string, number> = {};

    if (otherKeys.length) {
      const all = await loadAllData();
      all.forEach((rec: StopSearchRecord) => {
        if (startDate && rec.datetime < startDate) return;
        if (endDate && rec.datetime > endDate) return;
        const range = String(rec.age_range || '');
        if (allowedRange && !allowedRange.includes(range)) return;
        for (const k of otherKeys) {
          const arr = (filters as FilterMap)[k];
          const val = String((rec as any)[k] ?? '');
          if (arr && !arr.includes(val)) return;
        }
        ageRangeData[range] = (ageRangeData[range] || 0) + 1;
      });
    } else {
      const ageRangeDataRaw = await getAgeRangeData(startDate, endDate);
      ageRangeData = allowedRange ? Object.fromEntries(Object.entries(ageRangeDataRaw).filter(([range])=>allowedRange.includes(range))) : ageRangeDataRaw;
    }

    res.status(200).json({
      data: ageRangeData,
      dateStart: startDate,
      dateEnd: endDate,
    });
  } catch (error) {
    console.error("Error in /api/data/age-ranges:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
