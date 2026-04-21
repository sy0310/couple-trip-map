'use client';

import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CityLeafletMapProps {
  cityName: string;
  geoJson: Record<string, unknown> | null;
  allSpots: { name: string; lat: number; lng: number; visited: boolean }[];
  passedSpots: { name: string; lat: number; lng: number; visited: boolean }[];
  onSpotClick?: (name: string) => void;
}

function calcMinZoom(bounds: L.LatLngBounds): number {
  const containerW = 800;
  const containerH = 380;
  const tileSize = 256;

  const lngRange = bounds.getEast() - bounds.getWest();
  const latRange = bounds.getNorth() - bounds.getSouth();

  const zLng = Math.ceil(Math.log2((containerW / tileSize) * 360 / lngRange));
  const zLat = Math.ceil(Math.log2((containerH / tileSize) * 170 / latRange));

  return Math.max(zLng, zLat, 9);
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
  const mapInfo = useMemo(() => {
    if (!geoJson) return null;
    const layer = L.geoJSON(geoJson as never);
    const bounds = layer.getBounds();
    return { bounds, center: bounds.getCenter(), minZoom: calcMinZoom(bounds) };
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

  if (!mapInfo) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        地图加载中...
      </div>
    );
  }

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
        .leaflet-pane { z-index: 1; }
        .leaflet-overlay-pane svg { z-index: 1; }
      `}</style>
      <MapContainer
        center={[mapInfo.center.lat, mapInfo.center.lng]}
        zoom={mapInfo.minZoom}
        style={{ width: '100%', height: '100%', background: '#1a130c' }}
        scrollWheelZoom={true}
        zoomControl={false}
        maxBounds={mapInfo.bounds}
        maxBoundsViscosity={1.0}
        minZoom={mapInfo.minZoom}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
          maxZoom={18}
          errorTileUrl="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
          subdomains={["a", "b", "c"]}
        />
        {geoJson && (
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
        )}
        {markers}
      </MapContainer>
    </>
  );
}
