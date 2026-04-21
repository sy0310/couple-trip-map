/**
 * Douglas-Peucker line simplification.
 */
function douglasPeucker(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function perpendicularDistance(point: [number, number], lineStart: [number, number], lineEnd: [number, number]): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return Math.sqrt((point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2);
  const cross = Math.abs(dx * (lineStart[1] - point[1]) - dy * (lineStart[0] - point[0]));
  return cross / length;
}

export interface BoundingBox {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

export interface SvgPathResult {
  /** Array of SVG path `d` strings */
  paths: string[];
  boundingBox: BoundingBox;
}

export interface GeojsonToSvgOptions {
  width: number;
  height: number;
  padding?: number;
  /** Douglas-Peucker tolerance in SVG pixel space. Default 1.5 */
  tolerance?: number;
}

/**
 * Convert a GeoJSON FeatureCollection to SVG path strings.
 * Handles Polygon and MultiPolygon.
 */
export function geojsonToSvgPaths(
  geojson: { type: string; features: Array<{ geometry: { type: string; coordinates: number[][][] | number[][][][] } }> },
  options: GeojsonToSvgOptions
): SvgPathResult {
  const padding = options.padding ?? 10;
  const tolerance = options.tolerance ?? 1.5;

  // 1. Compute bounding box
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const feature of geojson.features) {
    const coords = feature.geometry.coordinates;
    if (feature.geometry.type === 'Polygon') {
      for (const ring of coords as number[][][]) {
        for (const [lng, lat] of ring) {
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      }
    } else if (feature.geometry.type === 'MultiPolygon') {
      for (const polygon of coords as number[][][][]) {
        for (const ring of polygon) {
          for (const [lng, lat] of ring) {
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          }
        }
      }
    }
  }

  // 2. Projection
  const lngRange = maxLng - minLng || 1;
  const latRange = maxLat - minLat || 1;
  const scaleX = (options.width - padding * 2) / lngRange;
  const scaleY = (options.height - padding * 2) / latRange;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = padding + ((options.width - padding * 2) - lngRange * scale) / 2;
  const offsetY = padding + ((options.height - padding * 2) - latRange * scale) / 2;

  const project = (lng: number, lat: number): [number, number] => [
    (lng - minLng) * scale + offsetX,
    (maxLat - lat) * scale + offsetY,
  ];

  // 3. Convert to SVG paths
  const paths: string[] = [];

  for (const feature of geojson.features) {
    const featurePaths = coordsToSvgPaths(feature.geometry.type, feature.geometry.coordinates, project, tolerance);
    paths.push(...featurePaths);
  }

  return { paths, boundingBox: { minLng, maxLng, minLat, maxLat } };
}

function coordsToSvgPaths(
  type: string,
  coords: number[][][] | number[][][][],
  project: (lng: number, lat: number) => [number, number],
  tolerance: number
): string[] {
  const paths: string[] = [];

  if (type === 'Polygon') {
    for (const ring of coords as number[][][]) {
      const pts: [number, number][] = ring.map(([lng, lat]) => project(lng, lat));
      const simplified = douglasPeucker(pts, tolerance);
      const d = ptsToPath(simplified);
      if (d) paths.push(d);
    }
  } else if (type === 'MultiPolygon') {
    for (const polygon of coords as number[][][][]) {
      const outerRing = polygon[0];
      const pts: [number, number][] = outerRing.map(([lng, lat]) => project(lng, lat));
      const simplified = douglasPeucker(pts, tolerance);
      const d = ptsToPath(simplified);
      if (d) paths.push(d);
    }
  }

  return paths;
}

function ptsToPath(pts: [number, number][]): string | null {
  if (pts.length < 3) return null;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += `L${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
  }
  d += 'Z';
  return d;
}
