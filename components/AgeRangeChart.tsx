import { observer } from 'mobx-react';
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRootStore } from '@/stores';
import * as d3 from 'd3';

declare global {
  interface Window {
    __ageRangeChartInitialized?: boolean;
  }
}

interface AgeRangeDataPoint {
  ageRange: string;
  count: number;
}

const margin = { top: 10, right: 20, bottom: 60, left: 60 };  
const height = 500;  

const AgeRangeChart = observer(() => {
  const { dataStore, appLayoutStore } = useRootStore();
  const { dateRange } = appLayoutStore;
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const ageRangeData = dataStore.ageRangeData as Record<string, number>;
  const chartHeight = height - margin.top - margin.bottom;
  const [chartWidth, setChartWidth] = useState(0);

  // Handle window resize with debounce
  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.offsetWidth);
  }, []);
  
  // Set up resize observer and initial data fetch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initial width
    handleResize();
    
    // Set up debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    // Initial data fetch
    if (!isMounted) {
      setIsMounted(true);
      dataStore.fetchAgeRangeData(dateRange.start, dateRange.end);
    }
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
    };
  }, [handleResize, isMounted, dateRange.start, dateRange.end, dataStore]);
  
  // Fetch data when date range changes
  useEffect(() => {
    if (!isMounted) return;
    const fetchData = async () => {
      try {
        await dataStore.fetchAgeRangeData(dateRange.start, dateRange.end);
      } catch (error) {
        console.error('Error fetching age range data:', error);
      }
    };
    fetchData();
  }, [dateRange.start, dateRange.end, appLayoutStore.filtersKey(), dataStore, isMounted]);

  // Update chart when data or container width changes
  useEffect(() => {
    if (!isMounted || !svgRef.current || !containerWidth || Object.keys(ageRangeData).length === 0) return;
    
    // Calculate chart dimensions
    const newChartWidth = Math.max(containerWidth - margin.left - margin.right, 300);
    setChartWidth(newChartWidth);
    
    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up the SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`);
      
    // Create a group for the chart content
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    // Prepare the data with proper age range ordering
    const ageRangeOrder = ['under 10', '10-17', '18-24', '25-34', 'over 34'];
    const data = Object.entries(ageRangeData)
      .map(([ageRange, count]) => ({
        ageRange,
        count: Number(count)
      }))
      .sort((a, b) => {
        const indexA = ageRangeOrder.indexOf(a.ageRange);
        const indexB = ageRangeOrder.indexOf(b.ageRange);
        return indexA - indexB;
      });
      
    if (data.length === 0) return;
    
    // Set up scales
    const x = d3.scaleBand()
      .range([0, newChartWidth])
      .domain(data.map(d => d.ageRange))
      .padding(0.2);
      
    const y = d3.scaleLinear()
      .range([chartHeight, 0])
      .domain([0, d3.max(data, d => d.count) || 0])
      .nice();
      
    // Set up tooltip
    const tooltip = d3.select(tooltipRef.current)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "var(--widget-bg)")
      .style("color", "var(--text-primary)")
      .style("padding", "8px 12px")
      .style("border-radius", "4px")
      .style("border", "1px solid var(--border-primary)")
      .style("font-size", "14px")
      .style("pointer-events", "none")
      .style("z-index", "10")
      .style("transition", "opacity 0.2s")
      .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.3)");

    // Add X axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .style("fill", "var(--text-secondary)")
      .style("font-size", "12px")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Style X axis line and ticks
    g.select(".domain")
      .style("stroke", "var(--border-primary)");
    g.selectAll(".tick line")
      .style("stroke", "var(--border-primary)");

    // Add Y axis
    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "var(--text-secondary)")
      .style("font-size", "12px");

    // Style Y axis line and ticks
    g.selectAll(".domain")
      .style("stroke", "var(--border-primary)");
    g.selectAll(".tick line")
      .style("stroke", "var(--border-primary)");

    // Define color palette for age ranges
    const colorPalette = [
      'var(--chart-1)', // #CDFF0C - bright lime green
      'var(--chart-2)', // #A8DD06 - medium lime green  
      'var(--chart-3)', // #86A305 - darker lime green
      'var(--chart-4)', // #5572AF - medium blue
      'var(--chart-5)', // #7094C5 - light blue
      'var(--chart-6)'  // #B8C5D6 - lightest blue
    ];

    // Add bars with hover effects
    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.ageRange) || 0)
      .attr("y", (d) => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", (d) => chartHeight - y(d.count))  
      .attr("fill", (d, i) => colorPalette[i % colorPalette.length])
      .attr("rx", 2)
      .attr("ry", 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 0.8);
        tooltip
          .style("visibility", "visible")
          .style("opacity", 1)
          .html(`<div><strong>${d.ageRange}</strong><br/>Count: ${d.count.toLocaleString()}</div>`);
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
      })
      .on("click", (_, d) => {
         appLayoutStore.addFilter('age_range', d.ageRange);
       })
       .on("mouseout", function() {
        d3.select(this).attr("opacity", 1);
        tooltip.style("visibility", "hidden");
      });

    // Add X axis label


  }, [ageRangeData]);

  return (
    <div>
      <div ref={containerRef} className="relative w-full">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          className="block"
          style={{ minHeight: height }}
        >
          {dataStore.isLoading && (
            <text
              x="50%"
              y={height / 2}
              textAnchor="middle"
              fontSize="16px"
              fill="var(--text-secondary)"
            >
              Loading...
            </text>
          )}
        </svg>
        <div
          ref={tooltipRef}
          className="absolute bg-gray-800 text-white p-3 rounded shadow-lg text-sm pointer-events-none transition-opacity duration-200"
          style={{
            visibility: 'hidden',
            opacity: 0,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: '200px',
            lineHeight: '1.4'
          }}
        />
      </div>
    </div>
  );
});

export default AgeRangeChart;
