'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getProvinceByName, getGeoJsonFileName } from '@/lib/provinces';

interface WoodReliefMapProps {
  provinceName: string;
  visitedCities: string[];
  cityCoords: { name: string; lat: number; lng: number; photoCount: number }[];
  onCityClick?: (name: string) => void;
  onBack?: () => void;
}

function FitBounds({ geoJson }: { geoJson: Record<string, unknown> }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.geoJSON(geoJson as never);
    const bounds = layer.getBounds();
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 8 });
  }, [geoJson, map]);
  return null;
}

function createPinIcon(visited: boolean, name: string) {
  const pinColor = visited ? '#c99a6c' : '#6B5438';
  const pinGlow = visited ? 'rgba(255,222,165,0.5)' : 'rgba(141,107,42,0.3)';
  const pillBg = visited ? 'rgba(255,250,240,0.95)' : 'rgba(250,245,239,0.92)';
  const pillColor = visited ? '#563a31' : '#8d6b2a';
  const pillBorder = visited ? '#c99a6c' : '#dac2b6';
  const pinSize = visited ? 36 : 30;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <svg width="${pinSize}" height="${pinSize * 1.25}" viewBox="0 0 36 45" fill="none">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 27 18 27s18-13.5 18-27C36 8.06 27.94 0 18 0z" fill="${pinColor}" opacity="0.9"/>
          <circle cx="18" cy="18" r="8" fill="${pillBg}" opacity="0.3"/>
          <circle cx="18" cy="18" r="5" fill="${pillBg}"/>
          ${visited ? `<circle cx="18" cy="18" r="14" fill="none" stroke="${pinGlow}" stroke-width="1.5" opacity="0.6">
            <animate attributeName="r" values="14;18;14" dur="2.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite"/>
          </circle>` : ''}
        </svg>
        <div style="
          margin-top:-4px;
          background:${pillBg};color:${pillColor};
          font-size:${visited ? 12 : 11}px;
          font-weight:${visited ? 700 : 500};
          padding:3px 12px;border-radius:999px;
          border:1px solid ${pillBorder};
          white-space:nowrap;
          font-family:var(--font-manrope,sans-serif);
          box-shadow:0 2px 8px rgba(0,0,0,0.15);
          letter-spacing:0.03em;
        ">${name}</div>
      </div>
    `,
    iconSize: [pinSize, pinSize * 1.25 + 32],
    iconAnchor: [pinSize / 2, 0],
    popupAnchor: [0, -8],
  });
}

export function WoodReliefMap({ provinceName, visitedCities, cityCoords, onCityClick }: WoodReliefMapProps) {
  const [geoJson, setGeoJson] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

  const visitedSet = new Set(visitedCities);

  useEffect(() => {
    const fileName = getGeoJsonFileName(provinceName);
    if (!fileName) { setError(true); setLoading(false); return; }

    fetch(`/geojson/${fileName}`)
      .then((r) => {
        if (!r.ok) throw new Error('GeoJSON not found');
        return r.json();
      })
      .then((data) => {
        setGeoJson(data);
        const layer = L.geoJSON(data as never);
        const bounds = layer.getBounds();
        setMapBounds(bounds);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [provinceName]);

  const markers = useMemo(() => {
    const prov = getProvinceByName(provinceName);
    if (!prov) return null;

    const allCities = prov.cities.map((c) => ({
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      visited: visitedSet.has(c.name),
    }));

    const sorted = [...allCities].sort((a, b) => (b.visited ? 1 : 0) - (a.visited ? 1 : 0));
    return sorted.map((city) => (
      <Marker
        key={city.name}
        position={[city.lat, city.lng] as [number, number]}
        icon={createPinIcon(city.visited, city.name)}
        eventHandlers={{ click: () => onCityClick?.(city.name) }}
      >
        <Popup>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-manrope, sans-serif)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: city.visited ? '#c99a6c' : '#8d6b2a', marginBottom: 2 }}>
              {city.visited ? '★ ' : ''}{city.name}
            </div>
            <div style={{ fontSize: 11, color: '#9A8B7A' }}>
              {city.visited ? '已访问' : '未访问'}
            </div>
          </div>
        </Popup>
      </Marker>
    ));
  }, [provinceName, visitedCities, onCityClick]);

  if (error) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        <p>地图加载失败</p>
      </div>
    );
  }

  if (loading || !mapBounds) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        加载地图中...
      </div>
    );
  }

  const center = mapBounds.getCenter();

  return (
    <>
      <style>{`
        .leaflet-control-attribution { display: none !important; }
        .leaflet-control-zoom { display: none !important; }
        .leaflet-tile-pane {
          filter: brightness(0.95) saturate(0.85);
        }
        .leaflet-tile {
          background: #3a2f25;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(255,250,240,0.97) !important;
          border: 1px solid rgba(201,154,108,0.4) !important;
          border-radius: 16px !important;
          box-shadow: 0 8px 32px rgba(86,58,49,0.2) !important;
        }
        .leaflet-popup-tip {
          background: rgba(255,250,240,0.97) !important;
          box-shadow: none !important;
        }
        .leaflet-popup-content {
          margin: 12px 18px !important;
          line-height: 1.4 !important;
        }
        .leaflet-popup-close-button {
          color: #9A8B7A !important;
          font-size: 20px !important;
        }
        .leaflet-container {
          border-radius: 8px;
          background: #1a130c;
        }
      `}</style>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={10}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
        maxBounds={mapBounds}
        minZoom={mapBounds ? undefined : 4}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
          maxZoom={18}
          errorTileUrl="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          subdomains={["a", "b", "c"]}
        />
        {geoJson && (
          <>
            <FitBounds geoJson={geoJson} />
            <GeoJSON
              data={geoJson as never}
              style={() => ({
                fillColor: 'transparent',
                fillOpacity: 0,
                color: '#c99a6c',
                weight: 2,
                opacity: 0.6,
              })}
            />
          </>
        )}
        {markers}
      </MapContainer>
    </>
  );
}
