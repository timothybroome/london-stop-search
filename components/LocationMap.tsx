import React from 'react';
import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import 'leaflet/dist/leaflet.css';
import { useRootStore } from '@/stores';

// Lazy-load react-leaflet only on the client to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const GeoJSONLayer = dynamic(() => import('react-leaflet').then(m => m.GeoJSON), { ssr: false });
// leaflet types only used client-side

interface Props {
  height?: number;
  // key = Borough name, value = metric (for heat-map colouring)
  values?: Record<string, number>;
}

const GEOJSON_URL = 'https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson';

export default function LocationMap({ height = 500, values = {} }: Props) {
  const { appLayoutStore } = useRootStore();
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then(r => r.json())
      .then(setGeo)
      .catch(err => console.error('Error loading GeoJSON', err));
  }, []);

  // colour scale recomputed when values change - using blues to fluorescent greens
  const colourScale = useMemo(() => {
    const max = Math.max(...Object.values(values), 1);
    // Create custom color scale from dark blue to bright fluorescent green
    const customInterpolator = d3.interpolateRgb('#2A3B5C', '#CDFF0C'); // widget-bg to accent-primary
    return d3.scaleSequential(customInterpolator).domain([0, max]);
  }, [values]);

  // force GeoJSON layer re-mount when values change so tooltips refresh
  const layerKey = useMemo(() => JSON.stringify(values), [values]);

  if (typeof window === 'undefined') return null; // Don’t render during SSR

  // Prepare data for the table, sorted by total descending
  const tableData = Object.entries(values)
    .map(([borough, total]) => ({
      borough,
      total,
      color: total > 0 ? colourScale(total) as string : '#1E2A4A'
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-4">
      <div style={{ height }}>
        <MapContainer
          style={{ height: '100%', width: '100%' }}
          center={[51.505, -0.09]}
          zoom={10}
          scrollWheelZoom
        >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {geo && (
            <GeoJSONLayer key={layerKey}
              data={geo}
              style={(feature?: GeoJSON.Feature) => {
                const name: string = feature?.properties?.name || '';
                const v = values[name] || 0;
                // Use darker blue for areas with no data, color scale for areas with data
                const fillColor = v > 0 ? colourScale(v) as string : '#1E2A4A'; // dashboard-bg for no data
                return {
                  fillColor,
                  fillOpacity: 0.8,
                  weight: 1,
                  color: '#3A4B6B', // border-primary
                  dashArray: '',
                };
              }}
              onEachFeature={(feature: GeoJSON.Feature, layer: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const name: string = feature?.properties?.name || '';
                const v = values[name] || 0;
                layer.bindTooltip(`<strong>${name}</strong><br/>Records: ${v.toLocaleString()}`);
                layer.on('mouseover', () => {
                  layer.setStyle({ weight: 2, color: '#CDFF0C' }); // accent-primary for hover
                });
                layer.on('click', () => {
                   appLayoutStore.addFilter('borough', name);
                 });
                  layer.on('mouseout', () => {
                  layer.setStyle({ weight: 1, color: '#3A4B6B' }); // border-primary
                });
              }}
            />
          )}
        </MapContainer>
      </div>
      
      {/* Compact Data Table */}
      <div className="w-fit max-w-full">
        <div className="max-h-80 overflow-y-auto">
          <table className="text-xs">
            <tbody>
              {tableData.map(({ borough, total, color }) => (
                <tr key={borough} className="hover:bg-[var(--dashboard-bg)] hover:bg-opacity-50 transition-colors">
                  <td className="pr-3 py-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                  </td>
                  <td className="pr-6 py-1">
                    <button 
                      className="text-[var(--text-primary)] text-left hover:text-[var(--accent-primary)] transition-colors whitespace-nowrap"
                      onClick={() => appLayoutStore.addFilter('borough', borough)}
                      title={`Filter by ${borough}`}
                    >
                      {borough}
                    </button>
                  </td>
                  <td className="text-[var(--text-primary)] text-right font-mono py-1">
                    {total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
