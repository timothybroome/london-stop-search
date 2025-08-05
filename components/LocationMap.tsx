import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import 'leaflet/dist/leaflet.css';
import { useRootStore } from '@/stores';

// Lazy-load react-leaflet only on the client to avoid SSR issues
const MapContainer: any = dynamic(() => import('react-leaflet').then(m => m.MapContainer as any), { ssr: false });
const TileLayer: any = dynamic(() => import('react-leaflet').then(m => m.TileLayer as any), { ssr: false });
const GeoJSONLayer: any = dynamic(() => import('react-leaflet').then(m => m.GeoJSON as any), { ssr: false });
// leaflet types only used client-side
import type { Path, LeafletMouseEvent } from 'leaflet';

interface Props {
  height?: number;
  // key = Borough name, value = metric (for heat-map colouring)
  values?: Record<string, number>;
}

const GEOJSON_URL = 'https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson';

export default function LocationMap({ height = 500, values = {} }: Props) {
  const { appLayoutStore } = useRootStore();
  const [geo, setGeo] = useState<any | null>(null);

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

  return (
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
            style={(feature: any) => {
              const name: string = feature?.properties?.name || '';
              const v = values[name] || 0;
              // Use darker blue for areas with no data, color scale for areas with data
              const fillColor = v > 0 ? colourScale(v) as string : '#1E2A4A'; // dashboard-bg for no data
              return {
                fillColor,
                fillOpacity: 0.8,
                weight: 1,
                color: '#3A4B6B', // border-primary
              };
            }}
            onEachFeature={(feature: any, layer: Path) => {
              const name: string = feature?.properties?.name || '';
              const v = values[name] || 0;
              layer.bindTooltip(`${name}: ${v.toLocaleString()}`);

              // simple hover highlight
              const defaultStyle = layer.options as any;
              layer.on('mouseover', (e: LeafletMouseEvent) => {
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
  );
}
