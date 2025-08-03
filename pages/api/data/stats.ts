import { NextApiRequest, NextApiResponse } from "next";
import { getTotalRecords, getRecordsByMonth } from "../../../lib/dataUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type } = req.query;

    if (type === "total") {
      const totalRecords = await getTotalRecords();
      return res.status(200).json({
        totalRecords,
      });
    }

    if (type === "by-month") {
      const recordsByMonth = await getRecordsByMonth();
      return res.status(200).json({
        recordsByMonth,
      });
    }

    const [totalRecords, recordsByMonth] = await Promise.all([
      getTotalRecords(),
      getRecordsByMonth(),
    ]);

    res.status(200).json({
      totalRecords,
      recordsByMonth,
    });
  } catch (error) {
    console.error("Error in /api/data/stats:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
