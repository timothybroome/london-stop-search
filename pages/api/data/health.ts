import { NextApiRequest, NextApiResponse } from "next";
import { getAvailableDataFiles, getTotalRecords } from "../../../lib/dataUtils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const availableFiles = getAvailableDataFiles();
    const totalRecords = await getTotalRecords();

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      dataFiles: {
        count: availableFiles.length,
        files: availableFiles,
      },
      totalRecords,
      endpoints: {
        total: "/api/data/total",
        stats: "/api/data/stats",
        health: "/api/data/health",
      },
    });
  } catch (error) {
    console.error("Error in /api/data/health:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
