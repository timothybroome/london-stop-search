"use client";

import React from "react";
import { observer } from "mobx-react";
import { useRootStore } from "../stores";
import {
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  getDaysInMonth,
  isSameYear,
  isSameMonth,
  isSameDay,
  parseISO,
  isAfter,
  isBefore,
  isWithinInterval,
} from "date-fns";

interface DateRangeExplorerProps {
  className?: string;
}

// YEARS will be dynamically calculated based on maxDateRange
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const DateRangeExplorer: React.FC<DateRangeExplorerProps> = observer(
  ({ className = "" }) => {
    const { appLayoutStore } = useRootStore();

    // Parse current date range
    const currentStart = appLayoutStore.dateRange.start
      ? parseISO(appLayoutStore.dateRange.start)
      : null;
    const currentEnd = appLayoutStore.dateRange.end
      ? parseISO(appLayoutStore.dateRange.end)
      : null;

    // Parse max date range
    const maxStart = appLayoutStore.maxDateRange.start
      ? parseISO(appLayoutStore.maxDateRange.start)
      : null;
    const maxEnd = appLayoutStore.maxDateRange.end
      ? parseISO(appLayoutStore.maxDateRange.end)
      : null;

    // Calculate available years based on maxDateRange
    const getAvailableYears = () => {
      if (!maxStart || !maxEnd) return [2023, 2024, 2025];
      const startYear = maxStart.getFullYear();
      const endYear = maxEnd.getFullYear();
      const years = [];
      for (let year = startYear; year <= endYear; year++) {
        years.push(year);
      }
      return years;
    };

    const availableYears = getAvailableYears();

    // Determine current selection state
    const getSelectionState = () => {
      // Check if it matches maxDateRange (All time)
      if (currentStart && currentEnd && maxStart && maxEnd) {
        const isMaxRange =
          isSameDay(currentStart, maxStart) && isSameDay(currentEnd, maxEnd);
        if (isMaxRange) return { type: "all-time" };
      }

      if (!currentStart || !currentEnd) return { type: "all-time" };

      // Check if it's a single day
      if (isSameDay(currentStart, currentEnd)) {
        return {
          type: "day",
          year: currentStart.getFullYear(),
          month: currentStart.getMonth(),
          day: currentStart.getDate(),
        };
      }

      // Check if it's a single month
      const monthStart = startOfMonth(currentStart);
      const monthEnd = endOfMonth(currentStart);
      if (
        isSameMonth(currentStart, monthStart) &&
        isSameMonth(currentEnd, monthEnd) &&
        isSameDay(currentStart, monthStart) &&
        isSameDay(currentEnd, monthEnd)
      ) {
        return {
          type: "month",
          year: currentStart.getFullYear(),
          month: currentStart.getMonth(),
        };
      }

      // Check if it's a single year
      const yearStart = startOfYear(currentStart);
      const yearEnd = endOfYear(currentStart);
      if (
        isSameYear(currentStart, yearStart) &&
        isSameYear(currentEnd, yearEnd) &&
        isSameDay(currentStart, yearStart) &&
        isSameDay(currentEnd, yearEnd)
      ) {
        return {
          type: "year",
          year: currentStart.getFullYear(),
        };
      }

      return { type: "custom" };
    };

    const selectionState = getSelectionState();

    const handleAllTimeClick = () => {
      if (selectionState.type === "all-time") {
        // Already selected, do nothing
        return;
      }
      // Set to maxDateRange when "All time" is selected
      appLayoutStore.setDateRange({
        start: appLayoutStore.maxDateRange.start,
        end: appLayoutStore.maxDateRange.end,
      });
    };

    const handleYearClick = (year: number) => {
      if (selectionState.type === "year" && selectionState.year === year) {
        // Deselect year, go back to all time
        handleAllTimeClick();
        return;
      }

      const start = startOfYear(new Date(year, 0, 1));
      const end = endOfYear(new Date(year, 0, 1));
      appLayoutStore.setDateRange({
        start: start.toISOString(),
        end: end.toISOString(),
      });
    };

    const handleMonthClick = (monthIndex: number) => {
      const currentYear =
        selectionState.type === "year"
          ? selectionState.year!
          : selectionState.type === "month"
            ? selectionState.year!
            : selectionState.type === "day"
              ? selectionState.year!
              : new Date().getFullYear();

      if (
        selectionState.type === "month" &&
        selectionState.month! === monthIndex
      ) {
        // Deselect month, go back to year
        handleYearClick(currentYear);
        return;
      }

      const start = startOfMonth(new Date(currentYear, monthIndex, 1));
      const end = endOfMonth(new Date(currentYear, monthIndex, 1));
      appLayoutStore.setDateRange({
        start: start.toISOString(),
        end: end.toISOString(),
      });
    };

    const handleDayClick = (day: number) => {
      const currentYear =
        selectionState.type === "year"
          ? selectionState.year!
          : selectionState.type === "month"
            ? selectionState.year!
            : selectionState.type === "day"
              ? selectionState.year!
              : new Date().getFullYear();

      const currentMonth =
        selectionState.type === "month"
          ? selectionState.month!
          : selectionState.type === "day"
            ? selectionState.month!
            : new Date().getMonth();

      if (selectionState.type === "day" && selectionState.day! === day) {
        // Deselect day, go back to month
        handleMonthClick(currentMonth);
        return;
      }

      const start = startOfDay(new Date(currentYear, currentMonth, day));
      const end = endOfDay(new Date(currentYear, currentMonth, day));
      appLayoutStore.setDateRange({
        start: start.toISOString(),
        end: end.toISOString(),
      });
    };

    const getDaysForCurrentMonth = () => {
      const currentYear =
        selectionState.type === "year"
          ? selectionState.year!
          : selectionState.type === "month"
            ? selectionState.year!
            : selectionState.type === "day"
              ? selectionState.year!
              : new Date().getFullYear();

      const currentMonth =
        selectionState.type === "month"
          ? selectionState.month!
          : selectionState.type === "day"
            ? selectionState.month!
            : new Date().getMonth();

      return getDaysInMonth(new Date(currentYear, currentMonth, 1));
    };

    // Check if a year is available based on maxDateRange
    const isYearAvailable = (year: number) => {
      if (!maxStart || !maxEnd) return true;
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 0, 1));
      return (
        isWithinInterval(yearStart, { start: maxStart, end: maxEnd }) ||
        isWithinInterval(yearEnd, { start: maxStart, end: maxEnd }) ||
        (isBefore(yearStart, maxStart) && isAfter(yearEnd, maxEnd))
      );
    };

    // Check if a month is available based on maxDateRange and selected year
    const isMonthAvailable = (monthIndex: number) => {
      if (!maxStart || !maxEnd) return true;
      const currentYear =
        selectionState.type === "year"
          ? selectionState.year!
          : selectionState.type === "month"
            ? selectionState.year!
            : selectionState.type === "day"
              ? selectionState.year!
              : new Date().getFullYear();

      const monthStart = startOfMonth(new Date(currentYear, monthIndex, 1));
      const monthEnd = endOfMonth(new Date(currentYear, monthIndex, 1));
      return (
        isWithinInterval(monthStart, { start: maxStart, end: maxEnd }) ||
        isWithinInterval(monthEnd, { start: maxStart, end: maxEnd }) ||
        (isBefore(monthStart, maxStart) && isAfter(monthEnd, maxEnd))
      );
    };

    // Check if a day is available based on maxDateRange and selected year/month
    const isDayAvailable = (day: number) => {
      if (!maxStart || !maxEnd) return true;
      const currentYear =
        selectionState.type === "year"
          ? selectionState.year!
          : selectionState.type === "month"
            ? selectionState.year!
            : selectionState.type === "day"
              ? selectionState.year!
              : new Date().getFullYear();

      const currentMonth =
        selectionState.type === "month"
          ? selectionState.month!
          : selectionState.type === "day"
            ? selectionState.month!
            : new Date().getMonth();

      const dayDate = new Date(currentYear, currentMonth, day);
      return isWithinInterval(dayDate, { start: maxStart, end: maxEnd });
    };

    const shouldShowMonths =
      selectionState.type === "year" ||
      selectionState.type === "month" ||
      selectionState.type === "day";
    const shouldShowDays =
      selectionState.type === "month" || selectionState.type === "day";

    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm ${className}`}>
        {/* Time Period Selection */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handleAllTimeClick}
              className={`px-4 py-2 rounded-md border-2 transition-colors ${
                selectionState.type === "all-time"
                  ? "border-pink-500 bg-pink-50 text-pink-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-700"
              }`}
            >
              All time
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => handleYearClick(year)}
                disabled={!isYearAvailable(year)}
                className={`px-4 py-2 rounded-md border-2 transition-colors ${
                  !isYearAvailable(year)
                    ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                    : (selectionState.type === "year" ||
                          selectionState.type === "month" ||
                          selectionState.type === "day") &&
                        selectionState.year! === year
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Month Selection */}
        {shouldShowMonths && (
          <div className="mb-6">
            <div className="grid grid-cols-6 gap-3">
              {MONTHS.map((month, index) => (
                <button
                  key={month}
                  onClick={() => handleMonthClick(index)}
                  disabled={!isMonthAvailable(index)}
                  className={`px-3 py-2 rounded-md border-2 transition-colors text-sm ${
                    !isMonthAvailable(index)
                      ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : (selectionState.type === "month" ||
                            selectionState.type === "day") &&
                          selectionState.month! === index
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Day Selection */}
        {shouldShowDays && (
          <div>
            <div className="grid grid-cols-16 gap-2">
              {Array.from(
                { length: getDaysForCurrentMonth() },
                (_, i) => i + 1,
              ).map((day) => (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  disabled={!isDayAvailable(day)}
                  className={`w-8 h-8 rounded-md border-2 transition-colors text-sm flex items-center justify-center ${
                    !isDayAvailable(day)
                      ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : selectionState.type === "day" &&
                          selectionState.day! === day
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default DateRangeExplorer;
