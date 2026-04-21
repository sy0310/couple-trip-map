'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletProvinceMapProps {
  center: [number, number];
  citiesWithCoords: { name: string; lat: number; lng: number; visited: boolean }[];
  geoJson: Record<string, unknown> | null;
  onCityClick?: (name: string) => void;
}

function FitBounds({ geoJson }: { geoJson: Record<string, unknown> | null }) {
  const map = useMap();
  useEffect(() => {
    if (geoJson) {
      const layer = L.geoJSON(geoJson as never);
      map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 8 });
    }
  }, [geoJson, map]);
  return null;
}

function createCityIcon(visited: boolean, name: string) {
  const pinColor = visited ? '#c99a6c' : '#6B5438';
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

function ProvinceGeoJson({ geoJson }: { geoJson: Record<string, unknown> | null }) {
  if (!geoJson) return null;
  return (
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
  );
}

export function LeafletProvinceMap({ center, citiesWithCoords, geoJson, onCityClick }: LeafletProvinceMapProps) {
  return (
    <>
      <style>{`
        .leaflet-control-attribution { display: none !important; }
        .leaflet-control-zoom { display: none !important; }

        .leaflet-tile-pane {
          filter: brightness(0.95) saturate(0.85);
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
        center={center}
        zoom={7}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=2&style=8&x={x}&y={y}&z={z}"
          attribution=""
          maxZoom={18}
          minZoom={4}
          noWrap={true}
          bounds={[[-55, -180], [85, 180]]}
          subdomains={["0", "1", "2", "3"]}
        />
        <FitBounds geoJson={geoJson} />
        <ProvinceGeoJson geoJson={geoJson} />
        {citiesWithCoords.map((city) => (
          <Marker
            key={city.name}
            position={[city.lat, city.lng]}
            icon={createCityIcon(city.visited, city.name)}
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
        ))}
      </MapContainer>
    </>
  );
}
