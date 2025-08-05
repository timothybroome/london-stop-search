import { NextApiRequest, NextApiResponse } from "next";
import { loadAllData, parseFilters, FilterMap } from "../../../lib/dataUtils";
import { parseISO, format, startOfYear, endOfYear, startOfMonth, endOfMonth, isWithinInterval, isSameYear, isSameMonth, isSameDay } from "date-fns";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { dateStart, dateEnd } = req.query;

    if (!dateStart || !dateEnd) {
      return res.status(400).json({ error: "dateStart and dateEnd are required" });
    }

    const startDate = parseISO(dateStart as string);
    const endDate = parseISO(dateEnd as string);

    // Load all data
    const allRecords = await loadAllData();

    // Apply date and additional filters
    const filters = parseFilters(req.query);
    const filterKeys = Object.keys(filters);
    const filteredRecords = allRecords.filter(record => {
      const recordDate = parseISO(record.datetime);
      if (!isWithinInterval(recordDate, { start: startDate, end: endDate })) return false;
      for (const key of filterKeys) {
        const allowed = (filters as FilterMap)[key];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = String((record as any)[key] ?? '');
        if (allowed && !allowed.includes(val)) return false;
      }
      return true;
    });

    // Determine aggregation level based on date range
    let aggregationType: 'year' | 'month' | 'day' | 'total';
    let aggregatedData: { label: string; value: number; date?: string }[] = [];

    // Check if it's a single day
    if (isSameDay(startDate, endDate)) {
      aggregationType = 'total';
      aggregatedData = [{ label: 'Total', value: filteredRecords.length }];
    }
    // Check if it's a single month
    else if (isSameMonth(startDate, endDate) &&
             isSameDay(startDate, startOfMonth(startDate)) &&
             isSameDay(endDate, endOfMonth(startDate))) {
      aggregationType = 'day';
      const daysInMonth = endOfMonth(startDate).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
        const dayRecords = filteredRecords.filter(record => {
          const recordDate = parseISO(record.datetime);
          return isSameDay(recordDate, dayDate);
        });

        aggregatedData.push({
          label: day.toString(),
          value: dayRecords.length,
          date: format(dayDate, 'yyyy-MM-dd')
        });
      }
    }
    // Check if it's a single year
    else if (isSameYear(startDate, endDate) &&
             isSameDay(startDate, startOfYear(startDate)) &&
             isSameDay(endDate, endOfYear(startDate))) {
      aggregationType = 'month';
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(startDate.getFullYear(), month, 1);
        const monthEnd = endOfMonth(monthStart);

        const monthRecords = filteredRecords.filter(record => {
          const recordDate = parseISO(record.datetime);
          return isWithinInterval(recordDate, { start: monthStart, end: monthEnd });
        });

        aggregatedData.push({
          label: months[month],
          value: monthRecords.length,
          date: format(monthStart, 'yyyy-MM')
        });
      }
    }
    // Multi-year range or custom range - aggregate by year
    else {
      aggregationType = 'year';
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      for (let year = startYear; year <= endYear; year++) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31, 23, 59, 59);

        // Adjust for actual date range boundaries
        const effectiveStart = year === startYear ? startDate : yearStart;
        const effectiveEnd = year === endYear ? endDate : yearEnd;

        const yearRecords = filteredRecords.filter(record => {
          const recordDate = parseISO(record.datetime);
          return isWithinInterval(recordDate, { start: effectiveStart, end: effectiveEnd });
        });

        aggregatedData.push({
          label: year.toString(),
          value: yearRecords.length,
          date: year.toString()
        });
      }
    }

    res.status(200).json({
      aggregationType,
      data: aggregatedData,
      totalRecords: filteredRecords.length,
      dateRange: {
        start: dateStart,
        end: dateEnd
      }
    });

  } catch (error) {
    console.error("Error in /api/data/aggregated:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
