'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CityLeafletMapProps {
  cityName: string;
  geoJson: Record<string, unknown> | null;
  allSpots: { name: string; lat: number; lng: number; visited: boolean }[];
  passedSpots: { name: string; lat: number; lng: number; visited: boolean }[];
  onSpotClick?: (name: string) => void;
}

function FitBounds({ geoJson, onMinZoomReady }: { geoJson: Record<string, unknown>; onMinZoomReady?: (zoom: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.geoJSON(geoJson as never);
    const bounds = layer.getBounds();
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    const zoom = map.getZoom();
    onMinZoomReady?.(zoom);
  }, [geoJson, map, onMinZoomReady]);
  return null;
}

function createInvertedMask(geoJson: Record<string, unknown>): Record<string, unknown> | null {
  const layer = L.geoJSON(geoJson as never);
  const bounds = layer.getBounds();
  const pad = 5;
  const outer = [
    [-180 + bounds.getWest() - pad, -180 + bounds.getSouth() - pad],
    [180 + bounds.getEast() + pad, -180 + bounds.getSouth() - pad],
    [180 + bounds.getEast() + pad, 180 + bounds.getNorth() + pad],
    [-180 + bounds.getWest() - pad, 180 + bounds.getNorth() + pad],
    [-180 + bounds.getWest() - pad, -180 + bounds.getSouth() - pad],
  ];

  const innerRings: number[][][] = [];
  const features = (geoJson as { features?: { geometry?: { coordinates?: number[][][][] | number[][][] } }[] }).features || [];
  for (const feature of features) {
    const coords = feature.geometry?.coordinates;
    if (!coords) continue;
    if (Array.isArray(coords[0]?.[0]?.[0]) && Array.isArray(coords[0][0][0][0])) {
      for (const polygon of coords as number[][][][]) {
        for (let i = 1; i < polygon.length; i++) {
          innerRings.push(polygon[i]);
        }
      }
    } else if (Array.isArray(coords[0]?.[0]) && Array.isArray(coords[0][0][0])) {
      // Polygon: [[...], [...]]
      for (let i = 1; i < (coords as number[][][]).length; i++) {
        innerRings.push((coords as number[][][])[i] as number[][]);
      }
    }
  }

  if (innerRings.length === 0) {
    const features2 = (geoJson as { features?: { geometry?: { coordinates?: number[][][] } }[] }).features || [];
    for (const feature of features2) {
      const coords = feature.geometry?.coordinates;
      if (coords && Array.isArray(coords[0])) {
        innerRings.push(coords[0]);
      }
    }
  }

  const coordinates = [outer, ...innerRings];

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates,
    },
    properties: {},
  };
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

export function CityLeafletMap({ geoJson, allSpots, passedSpots, onSpotClick }: CityLeafletMapProps) {
  const [minZoom, setMinZoom] = useState<number>(8);
  const [maskGeoJson, setMaskGeoJson] = useState<Record<string, unknown> | null>(null);

  const mapBounds = useMemo(() => {
    if (geoJson) {
      const layer = L.geoJSON(geoJson as never);
      return layer.getBounds();
    }
    return null;
  }, [geoJson]);

  useEffect(() => {
    if (geoJson) {
      const mask = createInvertedMask(geoJson);
      setMaskGeoJson(mask);
    }
  }, [geoJson]);

  const markers = useMemo(() => {
    const spotsToRender = allSpots.length > 0 ? allSpots : passedSpots;
    const sorted = [...spotsToRender].sort((a, b) => (b.visited ? 1 : 0) - (a.visited ? 1 : 0));
    return sorted.map((spot) => (
      <Marker
        key={spot.name}
        position={[spot.lat, spot.lng] as [number, number]}
        icon={createPinIcon(spot.visited, spot.name)}
        eventHandlers={{ click: () => onSpotClick?.(spot.name) }}
      >
        <Popup>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-manrope, sans-serif)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: spot.visited ? '#c99a6c' : '#8d6b2a', marginBottom: 2 }}>
              {spot.visited ? '★ ' : ''}{spot.name}
            </div>
            <div style={{ fontSize: 11, color: '#9A8B7A' }}>
              {spot.visited ? '已访问' : '未访问'}
            </div>
          </div>
        </Popup>
      </Marker>
    ));
  }, [allSpots, passedSpots, onSpotClick]);

  if (!mapBounds) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        地图加载中...
      </div>
    );
  }

  const center = mapBounds.getCenter();

  return (
    <>
      <style>{`
        .leaflet-control-attribution { display: none !important; }
        .leaflet-control-zoom { display: none !important; }
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
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
        maxBounds={mapBounds}
        maxBoundsViscosity={1.0}
        minZoom={minZoom}
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
            <FitBounds geoJson={geoJson} onMinZoomReady={setMinZoom} />
            {/* Dark mask over tiles outside city */}
            {maskGeoJson && (
              <GeoJSON
                data={maskGeoJson as never}
                style={() => ({
                  fillColor: '#1a130c',
                  fillOpacity: 0.95,
                  color: 'transparent',
                  weight: 0,
                  opacity: 0,
                })}
                interactive={false}
              />
            )}
            {/* Gold city boundary */}
            <GeoJSON
              data={geoJson as never}
              style={() => ({
                fillColor: '#c99a6c',
                fillOpacity: 0.15,
                color: '#c99a6c',
                weight: 3,
                opacity: 0.9,
              })}
            />
          </>
        )}
        {markers}
      </MapContainer>
    </>
  );
}
