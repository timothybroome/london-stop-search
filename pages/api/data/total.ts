import { NextApiRequest, NextApiResponse } from "next";
import { getTotal, StopSearchRecord } from "../../../lib/dataUtils";

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

    const total = await getTotal(startDate, endDate, field, value);

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
