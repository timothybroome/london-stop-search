"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useRootStore } from "../stores";
import * as d3 from "d3";
import { 
  startOfYear, 
  endOfYear, 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay 
} from 'date-fns';

interface SearchTotalsProps {
  className?: string;
}

interface AggregatedDataPoint {
  label: string;
  value: number;
  date?: string;
}

interface AggregatedResponse {
  aggregationType: "year" | "month" | "day" | "total";
  data: AggregatedDataPoint[];
  totalRecords: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export const SearchTotals: React.FC<SearchTotalsProps> = observer(
  ({ className = "" }) => {
    const { appLayoutStore } = useRootStore();
    const svgRef = useRef<SVGSVGElement>(null);
    const [data, setData] = useState<AggregatedResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Fetch aggregated data when date range changes
    useEffect(() => {
      const fetchData = async () => {
        if (!appLayoutStore.dateRange.start || !appLayoutStore.dateRange.end) {
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const params = new URLSearchParams();
          params.append('dateStart', appLayoutStore.dateRange.start);
          params.append('dateEnd', appLayoutStore.dateRange.end);
          const filters = appLayoutStore.activeFilters();
          Object.entries(filters).forEach(([field, arr]) => {
            if (arr.length) params.append(`filters[${field}]`, arr.join(','));
          });

          const response = await fetch(`/api/data/aggregated?${params.toString()}`, { cache: 'no-store' });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result: AggregatedResponse = await response.json();
          setData(result);
        } catch (err) {
          console.error("Error fetching aggregated data:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch data");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [appLayoutStore.dateRange.start, appLayoutStore.dateRange.end, appLayoutStore.filtersKey()]);

    // Handle mounting
    useEffect(() => {
      setMounted(true);
    }, []);

    const handleBarClick = (d: AggregatedDataPoint) => {
      if (!d.date) return;
      
      const date = new Date(d.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      let startDate: Date, endDate: Date;
      
      if (data?.aggregationType === 'year') {
        startDate = startOfYear(new Date(year, 0, 1));
        endDate = endOfYear(new Date(year, 0, 1));
      } else if (data?.aggregationType === 'month') {
        startDate = startOfMonth(new Date(year, month, 1));
        endDate = endOfMonth(new Date(year, month, 1));
      } else {
        startDate = startOfDay(new Date(year, month, day));
        endDate = endOfDay(new Date(year, month, day));
      }
      
      appLayoutStore.setDateRange({
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });
    };

    // Create D3 chart
    const createChart = useCallback(() => {
      if (
        !data ||
        !svgRef.current ||
        data.aggregationType === "total" ||
        !mounted
      ) {
        return;
      }

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove(); // Clear previous chart

      // Get container dimensions - use the parent container's width
      const container = svgRef.current.parentElement;
      const containerWidth = container ? container.clientWidth : 400;
      const margin = { top: 10, right: 10, bottom: 30, left: 10 };
      const width = Math.max(containerWidth - margin.left - margin.right, 200);
      const height = 250 - margin.top - margin.bottom;

      // Set SVG dimensions
      svg.attr("width", containerWidth).attr("height", 250);

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Scales
      const xScale = d3
        .scaleBand()
        .domain(data.data.map((d) => d.label))
        .range([0, width])
        .padding(0.1);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data.data, (d) => d.value) || 0])
        .nice()
        .range([height, 0]);

      // Color scale
      const colorScale = d3
        .scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data.data, (d) => d.value) || 0]);

      // Bars
      g.selectAll(".bar")
        .data(data.data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => xScale(d.label) || 0)
        .attr("y", (d) => yScale(d.value))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => height - yScale(d.value))
        .attr("fill", (d) => colorScale(d.value))
        .style("cursor", "pointer")
        .on("click", (event, d) => handleBarClick(d as AggregatedDataPoint))
        .on("mouseover", function (event, d) {
          // Tooltip
          const tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", "1000");

          tooltip
            .html(
              `<strong>${d.label}</strong><br/>Records: ${d.value.toLocaleString()}`,
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 10 + "px");

          // Highlight bar
          d3.select(this).style("opacity", 0.8);
        })
        .on("mouseout", function () {
          // Remove tooltip
          d3.selectAll(".tooltip").remove();

          // Reset bar
          d3.select(this).style("opacity", 1);
        });

      // X-axis
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "#374151");
    }, [data, mounted]);

    useEffect(() => {
      createChart();
    }, [createChart]);

    // Handle resize
    useEffect(() => {
      if (!mounted) return;

      const handleResize = () => {
        setTimeout(() => createChart(), 100); // Small delay to ensure container has resized
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [createChart, mounted]);

    if (loading) {
      return (
        <div className={`p-4 bg-white rounded-lg shadow-sm ${className}`}>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading chart data...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`p-4 bg-white rounded-lg shadow-sm ${className}`}>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">Error: {error}</div>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className={`p-4 bg-white rounded-lg shadow-sm ${className}`}>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">No data available</div>
          </div>
        </div>
      );
    }

    // For single day, show total instead of chart
    if (data.aggregationType === "total") {
      return (
        <div className={`p-4 bg-white rounded-lg shadow-sm ${className}`}>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Records
            </h3>
            <div className="text-4xl font-bold text-blue-600">
              {data.totalRecords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {new Date(data.dateRange.start).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`p-3 bg-white rounded-lg shadow-sm ${className}`}>
        <div className="mb-4">
          <div className="text-sm text-gray-600">
            Total Records:{" "}
            <span className="font-semibold">
              {data.totalRecords.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <svg  
            ref={svgRef}
            className="w-full max-w-full"
            style={{ height: "250px" }}
          />
        </div>
      </div>
    );
  },
);

export default SearchTotals;
