import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSON.Feature[];
}

const GEOJSON_URL =
  'https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson';

/**
 * Location component
 * Renders an SVG map of London boroughs using D3.
 * The map is responsive to its container's width.
 */
const Location = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [geoData, setGeoData] = useState<GeoFeatureCollection | null>(null);

  // Resize handler
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  // Fetch GeoJSON once
  useEffect(() => {
    d3.json<GeoFeatureCollection>(GEOJSON_URL)
      .then((data) => setGeoData(data ?? null))
      .catch((err) => console.error('Error loading GeoJSON:', err));
  }, []);

  // Attach resize listener
  useEffect(() => {
    handleResize();
    let timeoutId: NodeJS.Timeout;
    const debounced = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
    window.addEventListener('resize', debounced);
    return () => window.removeEventListener('resize', debounced);
  }, [handleResize]);

  // Draw map whenever geoData or width changes
  useEffect(() => {
    if (!geoData || !svgRef.current || !containerWidth) return;

    const width = containerWidth;
    const height = Math.min(600, width * 0.8);

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    // Projection that fits to container
    const projection = d3
      .geoMercator()
      .fitExtent(
        [[20, 20], [width - 20, height - 20]],
        geoData as d3.GeoPermissibleObjects
      );

    const pathGenerator = d3.geoPath().projection(projection);

    

    const svg = d3
      .select(svgRef.current)
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Draw boroughs
    const group = svg.append('g');

    // Optional: enable simple pan/zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
          group.attr('transform', event.transform.toString());
        })
    );

    group
      .selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('d', (d) => pathGenerator(d))
      .attr('fill', '#a5b4fc')
      .attr('fill-opacity', 0.8)
      .attr('stroke', '#000000')
      .attr('stroke-width', 1)
      .on('mouseover', function () {
        d3.select(this).attr('fill', '#6366f1');
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#a5b4fc');
      });
  }, [geoData, containerWidth]);

  return (
    <div className="mt-8 w-full" ref={containerRef}>
      <h2 className="text-xl font-semibold mb-4">Stops by Location (London Boroughs)</h2>
      <svg ref={svgRef} className="block w-full" />
      {!geoData && (
        <p className="text-center text-gray-500 mt-4">Loading map...</p>
      )}
    </div>
  );
};

export default Location;
