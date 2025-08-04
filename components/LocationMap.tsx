import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import 'leaflet/dist/leaflet.css';

// Lazy-load react-leaflet only on the client to avoid SSR issues
const MapContainer: any = dynamic(() => import('react-leaflet').then(m => m.MapContainer as any), { ssr: false });
const TileLayer: any = dynamic(() => import('react-leaflet').then(m => m.TileLayer as any), { ssr: false });
const GeoJSONLayer: any = dynamic(() => import('react-leaflet').then(m => m.GeoJSON as any), { ssr: false });

interface Props {
  height?: number;
  // key = Borough name, value = metric (for heat-map colouring)
  values?: Record<string, number>;
}

const GEOJSON_URL = 'https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson';

export default function LocationMap({ height = 500, values = {} }: Props) {
  const [geo, setGeo] = useState<any | null>(null);

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then(r => r.json())
      .then(setGeo)
      .catch(err => console.error('Error loading GeoJSON', err));
  }, []);

  // colour scale recomputed when values change
  const colourScale = useMemo(() => {
    const max = Math.max(...Object.values(values), 1);
    return d3.scaleSequential(d3.interpolateReds).domain([0, max]);
  }, [values]);

  if (typeof window === 'undefined') return null; // Don’t render during SSR

  return (
    <div style={{ height }}>
      <MapContainer
        style={{ height: '100%', width: '100%' }}
        center={[51.505, -0.09]}
        zoom={10}
        scrollWheelZoom
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {geo && (
          <GeoJSONLayer
            data={geo}
            style={(feature: any) => {
              const name: string = feature?.properties?.name || '';
              const v = values[name] || 0;
              return {
                fillColor: colourScale(v) as string,
                fillOpacity: 0.8,
                weight: 1,
                color: '#333',
              };
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
