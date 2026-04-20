'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  center: [number, number];
  spots: { name: string; lat: number; lng: number; visited: boolean }[];
  onSpotClick?: (name: string) => void;
  geoJson?: Record<string, unknown> | null;
}

function FitBounds({ geoJson }: { geoJson?: Record<string, unknown> | null }) {
  const map = useMap();
  useEffect(() => {
    if (geoJson) {
      const layer = L.geoJSON(geoJson as never);
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    }
  }, [geoJson, map]);
  return null;
}

// Golden pin marker with pill label
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

// Create an inverted mask: dark overlay covering everything except the province area
function createInvertedGeoJson(geoJson: Record<string, unknown>): Record<string, unknown>[] | null {
  try {
    const features = (geoJson as { features?: Array<{ geometry?: { type: string; coordinates?: number[][][][] } }> }).features;
    if (!features?.length) return null;

    // World bounding box
    const worldBox: number[][] = [[-180, 90], [180, 90], [180, -90], [-180, -90], [-180, 90]];

    const maskFeatures: Record<string, unknown>[] = [];

    for (const feature of features) {
      const geom = feature.geometry;
      if (!geom?.coordinates) continue;

      // GeoJSON province files use MultiPolygon: coordinates is number[][][][]
      const multiCoords = geom.coordinates as number[][][][];

      for (const polygonCoords of multiCoords) {
        // First ring is the outer boundary of the province
        const hole = polygonCoords[0];
        if (!hole?.length) continue;

        maskFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [worldBox, hole],
          },
          properties: {},
        });
      }
    }

    return maskFeatures.length > 0 ? maskFeatures : null;
  } catch {
    return null;
  }
}

export default function LeafletMap({ center, spots, onSpotClick, geoJson }: LeafletMapProps) {
  const maskFeatures = geoJson ? createInvertedGeoJson(geoJson) : null;
  const markers = useMemo(() => {
    const sorted = [...spots].sort((a, b) => (b.visited ? 1 : 0) - (a.visited ? 1 : 0));
    return sorted.map((spot, idx) => (
      <Marker
        key={`${spot.name}-${idx}`}
        position={[spot.lat, spot.lng]}
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
  }, [spots, onSpotClick]);

  const initialCenter: [number, number] = useMemo(() => {
    if (geoJson) {
      const layer = L.geoJSON(geoJson as never);
      const bounds = layer.getBounds();
      const c = bounds.getCenter();
      return [c.lat, c.lng];
    }
    return center;
  }, [geoJson, center]);

  return (
    <>
      <style>{`
        .leaflet-control-attribution { display: none !important; }
        .leaflet-control-zoom { display: none !important; }

        /* Dark OSM tiles */
        .leaflet-tile-pane {
          filter: invert(1) hue-rotate(180deg) brightness(0.75) saturate(0.6) contrast(1.1);
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
        center={initialCenter}
        zoom={geoJson ? 8 : 13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />
        {geoJson && (
          <>
            <FitBounds geoJson={geoJson} />
            <GeoJSON
              data={geoJson as never}
              style={() => ({
                fillColor: 'rgba(201,154,108,0.15)',
                fillOpacity: 0.8,
                color: '#c99a6c',
                weight: 2,
                opacity: 0.6,
              })}
            />
            {/* Dark mask covering everything outside the province */}
            {maskFeatures?.map((f, i) => (
              <GeoJSON
                key={i}
                data={f as never}
                style={() => ({
                  fillColor: '#1a130c',
                  fillOpacity: 0.92,
                  color: '#1a130c',
                  weight: 0,
                })}
                interactive={false}
              />
            ))}
          </>
        )}
        {markers}
      </MapContainer>
    </>
  );
}
