import { NextApiRequest, NextApiResponse } from "next";
import { getAgeRangeData } from "../../../lib/dataUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { dateStart, dateEnd } = req.query;

    const startDate = typeof dateStart === "string" ? dateStart : undefined;
    const endDate = typeof dateEnd === "string" ? dateEnd : undefined;

    const ageRangeData = await getAgeRangeData(startDate, endDate);

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
