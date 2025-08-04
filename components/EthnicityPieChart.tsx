import { observer } from 'mobx-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

const ETHNICITY_COLOR_MAP: Record<string, string> = {
  White: '#66c2a5',
  Black: '#fc8d62',
  Asian: '#8da0cb',
  Other: '#e78ac3',
  Mixed: '#a6d854',
  Unknown: '#ffd92f',
};
const fallbackColors = d3.schemeSet2;
import { useRootStore } from '@/stores';

const margin = 20;
const height = 400;

const EthnicityPieChart = observer(() => {
  const { appLayoutStore, dataStore } = useRootStore();
  const { dateRange } = appLayoutStore;
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    setWidth(containerRef.current.offsetWidth);
  }, []);

  // initial fetch + resize observer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    handleResize();
    window.addEventListener('resize', handleResize);
    // initial fetch
    dataStore.fetchEthnicityTotals(dateRange.start, dateRange.end);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch when date range changes
  useEffect(() => {
    dataStore.fetchEthnicityTotals(dateRange.start, dateRange.end);
  }, [dataStore, dateRange.start, dateRange.end]);

  // draw chart whenever data or width changes
  useEffect(() => {
    const dataObj = dataStore.ethnicityTotals as Record<string, number>;
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

    const data = Object.entries(dataObj).map(([eth, count]) => ({ eth, count }));
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
      .attr('d', arcGen as any)
      .attr('fill', d => color(d.data.eth))
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

    // legend
    const legend = svg.append('g').attr('transform', `translate(${margin},${margin})`);
    const legendItems = legend.selectAll('g').data(data).enter().append('g').attr('transform', (_, i) => `translate(0,${i * 20})`);
    legendItems.append('rect').attr('width', 12).attr('height', 12).attr('fill', d => color(d.eth));
    legendItems.append('text').attr('x', 18).attr('y', 10).text(d => d.eth);
  }, [dataStore.ethnicityTotals, width]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} />
      <div ref={tooltipRef} />
    </div>
  );
});

export default EthnicityPieChart;
