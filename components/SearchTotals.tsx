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

    // Load initial data if needed
    useEffect(() => {
      if (!appLayoutStore.isDataLoaded && !appLayoutStore.isLoading) {
        appLayoutStore.loadData();
      }
    }, [appLayoutStore]);

    // Generate aggregated data when date range changes
    useEffect(() => {
      const generateData = () => {
        if (!appLayoutStore.dateRange.start || !appLayoutStore.dateRange.end || !appLayoutStore.isDataLoaded) {
          return;
        }

        setLoading(true);
        setError(null);

        try {
          // Use the intelligent aggregation from AppLayoutStore
          const aggregated = appLayoutStore.aggregatedTotals;
          
          // Convert data to the expected format
          const dataPoints = Object.entries(aggregated.data).map(([key, count]) => {
            let label = key;
            let date: string | undefined;
            
            switch (aggregated.aggregationType) {
              case 'year':
                label = key; // Already a year like "2023"
                date = `${key}-01-01`;
                break;
              case 'month':
                // Convert "2023-06" to "Jun"
                const [year, monthNum] = key.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                label = monthNames[parseInt(monthNum) - 1] || key;
                date = `${key}-01`;
                break;
              case 'day':
                // Convert "2023-06-15" to "15"
                const dayParts = key.split('-');
                label = dayParts[2] || key; // Extract day number
                date = key;
                break;
              case 'total':
                label = key; // "Total"
                date = undefined;
                break;
            }
            
            return {
              label,
              value: count,
              date
            };
          }).sort((a, b) => {
            // Sort by date if available, otherwise by label
            if (a.date && b.date) {
              return a.date.localeCompare(b.date);
            }
            return a.label.localeCompare(b.label);
          });
          
          const result: AggregatedResponse = {
            aggregationType: aggregated.aggregationType,
            data: dataPoints,
            totalRecords: appLayoutStore.totalRecords,
            dateRange: {
              start: appLayoutStore.dateRange.start || '',
              end: appLayoutStore.dateRange.end || ''
            }
          };
          
          setData(result);
        } catch (err) {
          console.error("Error generating aggregated data:", err);
          setError(err instanceof Error ? err.message : "Failed to generate data");
        } finally {
          setLoading(false);
        }
      };

      generateData();
    }, [appLayoutStore.dateRange.start, appLayoutStore.dateRange.end, appLayoutStore.filtersKey(), appLayoutStore.isDataLoaded]);

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
      const margin = { top: 10, right: 10, bottom: 30, left: 50 };
      const width = Math.max(containerWidth - margin.left - margin.right, 200);
      const height = 250 - margin.top - margin.bottom;

      // Set SVG dimensions
      svg.attr("width", containerWidth).attr("height", 250);

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Scales
      const xScale = d3
        .scalePoint<string>()
        .domain(data.data.map((d) => d.label))
        .range([0, width])
        .padding(0.5);

      const yScale = d3
        .scaleLinear<number, number>()
        .domain([0, d3.max(data.data, (d) => d.value) || 0])
        .nice()
        .range([height, 0]);

      const colorScale = d3
        .scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(data.data, (d) => d.value) || 0]);

      // Line path
      const line = d3.line<AggregatedDataPoint>()
        .x(d => (xScale(d.label) ?? 0))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data.data)
        .attr('fill', 'none')
        .attr('stroke', 'var(--accent-primary)')
        .attr('stroke-width', 2)
        .attr('d', line);

      // Circles
      g.selectAll('circle')
        .data(data.data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.label) ?? 0)
        .attr('cy', d => yScale(d.value))
        .attr('r', 4)
        .attr('fill', 'var(--accent-primary)')
        .style('cursor', 'pointer')
        .on('click', (_, d) => handleBarClick(d))
        .on('mouseover', function(event, d) {
          const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', 'var(--widget-bg)')
            .style('color', 'var(--text-primary)')
            .style('border', '1px solid var(--border-primary)')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)')
            .html(`<strong>${d.label}</strong><br/>Records: ${d.value.toLocaleString()}`)
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px');
          d3.select(this).attr('r', 6).attr('fill', 'var(--chart-1)');
        })
        .on('mouseout', function() {
          d3.select('.tooltip').remove();
          d3.select(this).attr('r', 4).attr('fill', 'var(--accent-primary)');
        });

      // X-axis
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "var(--text-secondary)");
      
      // Y-axis
      g.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "var(--text-secondary)");
      
      // Style axis lines and ticks
      g.selectAll(".domain")
        .style("stroke", "var(--border-primary)");
      g.selectAll(".tick line")
        .style("stroke", "var(--border-primary)");
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
        <div className={`${className}`}>
          <div className="flex items-center justify-center h-64">
            <div className="text-[var(--text-secondary)]">Loading chart data...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`${className}`}>
          <div className="flex items-center justify-center h-64">
            <div className="text-[var(--error)]">Error: {error}</div>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className={`${className}`}>
          <div className="flex items-center justify-center h-64">
            <div className="text-[var(--text-secondary)]">No data available</div>
          </div>
        </div>
      );
    }

    // For single day, show total instead of chart
    if (data.aggregationType === "total") {
      return (
        <div className={`${className}`}>
          <div className="text-center">
            <div className="text-4xl font-bold text-[var(--accent-primary)]">
              {data.totalRecords.toLocaleString()}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-2">
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
      <div className={`${className}`}>
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
