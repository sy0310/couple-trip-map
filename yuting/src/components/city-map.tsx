'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CityMapProps {
  cityName: string;
  spots: { name: string; lat: number; lng: number; visited: boolean }[];
  onSpotClick?: (name: string) => void;
}

// Custom marker icons
function createMarkerIcon(visited: boolean) {
  const color = visited ? '#c99a6c' : '#6B5438';
  const borderColor = visited ? '#ffdea5' : '#C9A882';
  const size = visited ? 20 : 14;

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid ${borderColor};
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
        ${visited ? 'animation: pulse 2s infinite;' : ''}
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Label marker — shows the scenic spot name
function createLabelIcon(visited: boolean, name: string) {
  const color = visited ? '#ffdea5' : '#9A8B7A';
  const bg = visited ? 'rgba(53,33,24,0.9)' : 'rgba(53,33,24,0.7)';
  const borderColor = visited ? '#c99a6c' : 'rgba(141,107,42,0.4)';
  const fontSize = visited ? 12 : 10;
  const fontWeight = visited ? 700 : 400;

  return L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          background: ${bg};
          color: ${color};
          font-size: ${fontSize}px;
          font-weight: ${fontWeight};
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid ${borderColor};
          white-space: nowrap;
          font-family: var(--font-manrope, sans-serif);
          line-height: 1.3;
        ">${name}</div>
        <div style="
          width: ${visited ? 14 : 10}px;
          height: ${visited ? 14 : 10}px;
          background: ${visited ? '#c99a6c' : '#6B5438'};
          border: ${visited ? '2px solid #ffdea5' : '1px solid #C9A882'};
          border-radius: 50%;
          margin-top: -2px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, -16],
    popupAnchor: [0, -16],
  });
}

export function CityMap({ cityName, spots, onSpotClick }: CityMapProps) {
  const center = useMemo(() => {
    if (spots.length === 0) return [39.9042, 116.4074];
    const avgLat = spots.reduce((s, sp) => s + sp.lat, 0) / spots.length;
    const avgLng = spots.reduce((s, sp) => s + sp.lng, 0) / spots.length;
    return [avgLat, avgLng];
  }, [spots]);

  const markers = useMemo(() => {
    return spots.map((spot, idx) => {
      const icon = createLabelIcon(spot.visited, spot.name);
      return (
        <Marker
          key={`${spot.name}-${idx}`}
          position={[spot.lat, spot.lng]}
          icon={icon}
          eventHandlers={{
            click: () => onSpotClick?.(spot.name),
          }}
        >
          <Popup>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-manrope, sans-serif)' }}>
              <strong style={{ color: spot.visited ? '#c99a6c' : '#6B5438' }}>
                {spot.visited ? '★ ' : ''}{spot.name}
              </strong>
              <br />
              <span style={{ fontSize: 11, color: '#9A8B7A' }}>
                {spot.visited ? '已访问' : '未访问'}
              </span>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [spots, onSpotClick]);

  if (spots.length === 0) {
    return (
      <div className="w-full py-4 text-center text-sm" style={{ color: '#9A8B7A' }}>
        暂无景点数据
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ zIndex: 1 }}>
      <style>{`
        .leaflet-control-attribution { display: none !important; }
        .leaflet-popup-content-wrapper {
          background: rgba(53,33,24,0.95) !important;
          border: 1px solid rgba(201,154,108,0.5) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
        }
        .leaflet-popup-tip { background: rgba(53,33,24,0.95) !important; }
        .leaflet-popup-content { margin: 10px 12px !important; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(201,154,108,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(201,154,108,0); }
          100% { box-shadow: 0 0 0 0 rgba(201,154,108,0); }
        }
      `}</style>
      <MapContainer
        center={center as [number, number]}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
        />
        {markers}
      </MapContainer>
    </div>
  );
}
