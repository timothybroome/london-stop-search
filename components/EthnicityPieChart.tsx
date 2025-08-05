import { observer } from 'mobx-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

const ETHNICITY_COLOR_MAP: Record<string, string> = {
  White: '#CDFF0C',    // Bright fluorescent green
  Black: '#A8DD06',    // Medium fluorescent green
  Asian: '#7094C5',    // Light blue
  Other: '#5572AF',    // Medium blue
  Mixed: '#86A305',    // Dark fluorescent green
  Unknown: '#B8C5D6',  // Light blue-gray
};
const fallbackColors = d3.schemeSet2;
import { useRootStore } from '@/stores';

const margin = 20;
const height = 400;

const EthnicityPieChart = observer(() => {
  const { appLayoutStore } = useRootStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    setWidth(containerRef.current.offsetWidth);
  }, []);

  // initial data load + resize observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    handleResize();
    window.addEventListener('resize', handleResize);
    // initial data load
    if (!appLayoutStore.isDataLoaded && !appLayoutStore.isLoading) {
      appLayoutStore.loadData();
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [appLayoutStore]);

  // Prepare data from store - automatically filtered by AppLayoutStore
  const dataObj = appLayoutStore.ethnicityTotals;
  const data = Object.entries(dataObj).map(([eth, count]) => ({ eth, count }));

  // draw chart whenever data or width changes
  useEffect(() => {
    if (!svgRef.current || !width || Object.keys(dataObj).length === 0) return;

    const radius = Math.min(width, height) / 2 - margin;
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    svg.selectAll('*').remove();
    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
    const total = d3.sum(data, d => d.count);

    const dynamicKeys = data.filter(d => !(d.eth in ETHNICITY_COLOR_MAP)).map(d=>d.eth);
    const colorScale = d3.scaleOrdinal<string>()
      .domain(dynamicKeys)
      .range(fallbackColors);
    const color = (eth: string) => ETHNICITY_COLOR_MAP[eth] ?? (colorScale(eth) as string);

    const pieGen = d3
      .pie<{ eth: string; count: number }>()
      .sort(null)
      .value(d => d.count);

    const arcGen = d3.arc<d3.PieArcDatum<{ eth: string; count: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    const tooltip = d3.select(tooltipRef.current)
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', '#fff')
      .style('padding', '6px 10px')
      .style('border-radius', '4px')
      .style('font-size', '14px')
      .style('pointer-events', 'none');

    g.selectAll('path')
      .data(pieGen(data))
      .enter()
      .append('path')
      .attr('d', (d) => arcGen(d))
      .attr('fill', d => color(d.data.eth))
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        appLayoutStore.addFilter('officer_defined_ethnicity', d.data.eth);
      })
      .on('mouseover', (event, d) => {
        const percent = ((d.data.count / total) * 100).toFixed(1);
        tooltip.html(`${d.data.eth}: ${d.data.count.toLocaleString()} (${percent}%)`).style('visibility', 'visible');
      })
      .on('mousemove', event => {
        tooltip.style('top', event.pageY + 10 + 'px').style('left', event.pageX + 10 + 'px');
      })
      .on('mouseout', () => tooltip.style('visibility', 'hidden'));


  }, [appLayoutStore.ethnicityTotals, width]);

  // Prepare data for the table, sorted by count descending
  const tableData = data
    .map((d: { eth: string; count: number }) => ({
      ethnicity: d.eth,
      count: d.count,
      color: ETHNICITY_COLOR_MAP[d.eth] || '#B8C5D6'
    }))
    .sort((a: { count: number }, b: { count: number }) => b.count - a.count);

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} />
        <div ref={tooltipRef} />
      </div>
      
      {/* Compact Data Table */}
      <div className="w-fit max-w-full">
        <div className="max-h-48 overflow-y-auto">
          <table className="text-xs">
            <tbody>
              {tableData.map(({ ethnicity, count, color }) => (
                <tr key={ethnicity} className="hover:bg-[var(--dashboard-bg)] hover:bg-opacity-50 transition-colors">
                  <td className="pr-3 py-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                  </td>
                  <td className="pr-6 py-1">
                    <button 
                      className="text-[var(--text-primary)] text-left hover:text-[var(--accent-primary)] transition-colors whitespace-nowrap"
                      onClick={() => appLayoutStore.addFilter('officer_defined_ethnicity', ethnicity)}
                      title={`Filter by ${ethnicity}`}
                    >
                      {ethnicity}
                    </button>
                  </td>
                  <td className="text-[var(--text-primary)] text-right font-mono py-1">
                    {count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default EthnicityPieChart;
