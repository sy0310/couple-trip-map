'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  center: [number, number];
  spots: { name: string; lat: number; lng: number; visited: boolean }[];
  onSpotClick?: (name: string) => void;
}

// Pin-style marker icon with label
function createSpotIcon(visited: boolean, name: string) {
  const dotColor = visited ? '#c99a6c' : '#6B5438';
  const ringColor = visited ? '#ffdea5' : '#C9A882';
  const labelColor = visited ? '#ffdea5' : '#9A8B7A';
  const labelBg = visited ? 'rgba(53,33,24,0.92)' : 'rgba(53,33,24,0.75)';
  const dotSize = visited ? 16 : 12;

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          position:absolute;bottom:100%;margin-bottom:6px;
          background:${labelBg};color:${labelColor};
          font-size:12px;font-weight:${visited ? 700 : 500};
          padding:3px 10px;border-radius:6px;
          border:1px solid ${visited ? 'rgba(201,154,108,0.5)' : 'rgba(141,107,42,0.3)'};
          white-space:nowrap;
          font-family:var(--font-manrope,sans-serif);
          box-shadow:0 2px 12px rgba(0,0,0,0.4);
          letter-spacing:0.02em;
        ">${name}</div>
        <div style="
          width:${dotSize}px;height:${dotSize}px;
          background:${dotColor};
          border:2px solid ${ringColor};
          border-radius:50%;
          box-shadow:0 0 10px ${visited ? 'rgba(255,222,165,0.35)' : 'rgba(0,0,0,0.3)'},
                     0 2px 4px rgba(0,0,0,0.3);
          ${visited ? 'animation:citymap-pulse 2.5s ease-in-out infinite' : ''}
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -14],
  });
}

export default function LeafletMap({ center, spots, onSpotClick }: LeafletMapProps) {
  const markers = useMemo(() => {
    return spots.map((spot, idx) => (
      <Marker
        key={`${spot.name}-${idx}`}
        position={[spot.lat, spot.lng]}
        icon={createSpotIcon(spot.visited, spot.name)}
        eventHandlers={{ click: () => onSpotClick?.(spot.name) }}
      >
        <Popup>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-manrope, sans-serif)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: spot.visited ? '#c99a6c' : '#8d6b2a', marginBottom: 2 }}>
              {spot.name}
            </div>
            <div style={{ fontSize: 11, color: '#9A8B7A' }}>
              {spot.visited ? '已访问' : '未访问'}
            </div>
          </div>
        </Popup>
      </Marker>
    ));
  }, [spots, onSpotClick]);

  return (
    <>
      <style>{`
        /* Hide default attribution */
        .leaflet-control-attribution { display: none !important; }

        /* Hide default zoom controls — we provide custom ones if needed */
        .leaflet-control-zoom { display: none !important; }

        /* Popup styling */
        .leaflet-popup-content-wrapper {
          background: rgba(53,33,24,0.96) !important;
          border: 1px solid rgba(201,154,108,0.5) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
          backdrop-filter: blur(8px);
        }
        .leaflet-popup-tip {
          background: rgba(53,33,24,0.96) !important;
          box-shadow: none !important;
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
          line-height: 1.4 !important;
        }
        .leaflet-popup-close-button {
          color: #9A8B7A !important;
          font-size: 20px !important;
        }

        /* Pulse animation for visited spots */
        @keyframes citymap-pulse {
          0% { box-shadow: 0 0 0 0 rgba(201,154,108,0.5), 0 0 10px rgba(255,222,165,0.35); }
          60% { box-shadow: 0 0 0 10px rgba(201,154,108,0), 0 0 10px rgba(255,222,165,0.1); }
          100% { box-shadow: 0 0 0 0 rgba(201,154,108,0), 0 0 10px rgba(255,222,165,0.35); }
        }

        /* Subtle map container border */
        .leaflet-container {
          border-radius: 12px;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
        />
        {markers}
      </MapContainer>
    </>
  );
}
