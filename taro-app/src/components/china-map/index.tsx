import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState } from 'react'
import { Canvas, View } from '@tarojs/components'
import Taro, { useDidHide, useDidShow } from '@tarojs/taro'
import type { ThemeTokens } from '../../pages/index/map'

interface CityData {
  name: string
  province: string
  lat: number
  lng: number
  photoCount: number
}

interface ChinaMapProps {
  geoJson: Record<string, unknown>
  visitedProvinces: string[]
  visitedCities: CityData[]
  theme: ThemeTokens
  canvasId?: string
  style?: React.CSSProperties
  onProvinceClick?: (name: string) => void
  onCityClick?: (cityName: string) => void
}

interface PixelPolygon { rings: number[][][]; name: string }

// Extract bounds from all features
function extractBounds(features: any[]): { minLng: number; maxLng: number; minLat: number; maxLat: number } {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const feature of features) {
    traverseCoords(feature.geometry.coordinates, (lng, lat) => {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    })
  }
  return { minLng, maxLng, minLat, maxLat }
}

function traverseCoords(coords: any, fn: (lng: number, lat: number) => void) {
  if (typeof coords[0] === 'number') { fn(coords[0], coords[1]); return }
  for (const item of coords) traverseCoords(item, fn)
}

// Extract polygons from MultiPolygon/Polygon geometry
// Each polygon = [outerRing, ...holes]
function extractPolygons(geometry: any): number[][][][] {
  const polygons: number[][][][] = []
  if (geometry.type === 'Polygon') {
    polygons.push(geometry.coordinates as number[][][])
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      polygons.push(poly as number[][][])
    }
  }
  return polygons
}

function geoToPixel(lng: number, lat: number, bounds: any, scale: number, offset: { x: number; y: number }) {
  return {
    x: (lng - bounds.minLng) * scale + offset.x,
    y: (bounds.maxLat - lat) * scale + offset.y,
  }
}

// Point-in-polygon via ray casting
function pointInPolygon(px: number, py: number, polygon: number[][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export interface ChinaMapHandle { redraw: () => void }

const ChinaMap = forwardRef<ChinaMapHandle, ChinaMapProps>((
  { geoJson, visitedProvinces, visitedCities, theme, canvasId = 'china-map-canvas', style, onProvinceClick, onCityClick },
  ref
) => {
  const canvasNodeRef = useRef<any>(null)
  const ctxRef = useRef<any>(null)
  const polygonsRef = useRef<PixelPolygon[]>([])
  const cityPixelsRef = useRef<{ x: number; y: number; name: string; r: number }[]>([])
  const boundsRef = useRef<any>(null)
  const baseScaleRef = useRef(1)
  const offsetRef = useRef({ x: 0, y: 0 })
  const canvasSizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const animFrameRef = useRef(0)
  const animStartRef = useRef(0)
  const [isVisible, setIsVisible] = useState(true)

  // View transform state
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const lastTapRef = useRef(0)
  const touchState = useRef<{
    type: 'none' | 'pan' | 'pinch'
    startPan: { x: number; y: number }
    lastPos: { x: number; y: number }
    pinchDist: number
    pinchZoom: number
    pinchCenter: { x: number; y: number }
  }>({ type: 'none', startPan: { x: 0, y: 0 }, lastPos: { x: 0, y: 0 }, pinchDist: 0, pinchZoom: 1, pinchCenter: { x: 0, y: 0 } })

  const buildPixelData = useCallback(() => {
    const features = (geoJson as any).features as any[]
    if (!features || !canvasSizeRef.current.w) return

    const bounds = extractBounds(features)
    boundsRef.current = bounds
    const { w, h } = canvasSizeRef.current
    const xScale = (w - 40) / (bounds.maxLng - bounds.minLng)
    const yScale = (h - 40) / (bounds.maxLat - bounds.minLat)
    const scale = Math.min(xScale, yScale)
    baseScaleRef.current = scale
    const mapW = (bounds.maxLng - bounds.minLng) * scale
    const mapH = (bounds.maxLat - bounds.minLat) * scale
    offsetRef.current = { x: (w - mapW) / 2, y: (h - mapH) / 2 }

    // Build polygon data — each polygon drawn separately
    const polys: PixelPolygon[] = []
    for (const feature of features) {
      const name = feature.properties.name
      const geoPolys = extractPolygons(feature.geometry)
      const pixelPolys: number[][][] = []
      for (const poly of geoPolys) {
        const pixelRings: number[][] = []
        for (const ring of poly) {
          const pixelRing: number[][] = []
          for (let i = 0; i < ring.length; i++) {
            const { x, y } = geoToPixel(ring[i][0], ring[i][1], bounds, scale, offsetRef.current)
            pixelRing.push([x, y])
          }
          pixelRings.push(pixelRing)
        }
        pixelPolys.push(pixelRings)
      }
      for (const rings of pixelPolys) {
        polys.push({ rings, name })
      }
    }
    polygonsRef.current = polys

    const cityPixels = visitedCities.map((c) => {
      const { x, y } = geoToPixel(c.lng, c.lat, bounds, scale, offsetRef.current)
      return { x, y, name: c.name, r: 4 + Math.min(4, Math.floor(c.photoCount / 20)) }
    })
    cityPixelsRef.current = cityPixels
  }, [geoJson, visitedCities])

  const draw = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    const { w, h, dpr } = canvasSizeRef.current

    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // Apply view transform
    const zoom = zoomRef.current
    const pan = panRef.current
    const cx = w / 2
    const cy = h / 2
    ctx.translate(cx, cy)
    ctx.scale(zoom, zoom)
    ctx.translate(-cx + pan.x / zoom, -cy + pan.y / zoom)

    const polys = polygonsRef.current
    const visitedSet = new Set(visitedProvinces)

    // Group polygons by style to minimize ctx state changes and fill calls
    const visitedPolys: PixelPolygon[] = []
    const normalPolys: PixelPolygon[] = []

    for (const p of polys) {
      if (visitedSet.has(p.name)) visitedPolys.push(p)
      else normalPolys.push(p)
    }

    // Draw normal provinces
    ctx.fillStyle = theme.bgCardAlt
    ctx.strokeStyle = theme.border
    ctx.lineWidth = 1
    ctx.beginPath()
    for (const p of normalPolys) {
      for (const ring of p.rings) {
        for (let i = 0; i < ring.length; i++) {
          if (i === 0) ctx.moveTo(ring[i][0], ring[i][1])
          else ctx.lineTo(ring[i][0], ring[i][1])
        }
      }
    }
    ctx.fill()
    ctx.stroke()

    // Draw visited provinces
    ctx.fillStyle = theme.accent
    ctx.strokeStyle = theme.gold
    ctx.lineWidth = 2
    ctx.beginPath()
    for (const p of visitedPolys) {
      for (const ring of p.rings) {
        for (let i = 0; i < ring.length; i++) {
          if (i === 0) ctx.moveTo(ring[i][0], ring[i][1])
          else ctx.lineTo(ring[i][0], ring[i][1])
        }
      }
    }
    ctx.fill()
    ctx.stroke()

    // City connecting lines
    const cityPixels = cityPixelsRef.current
    if (cityPixels.length >= 2) {
      ctx.strokeStyle = theme.gold
      ctx.globalAlpha = 0.25
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < cityPixels.length - 1; i++) {
        ctx.moveTo(cityPixels[i].x, cityPixels[i].y)
        const mx = (cityPixels[i].x + cityPixels[i + 1].x) / 2
        const my = (cityPixels[i].y + cityPixels[i + 1].y) / 2 - 30
        ctx.quadraticCurveTo(mx, my, cityPixels[i + 1].x, cityPixels[i + 1].y)
      }
      ctx.stroke()
    }

    // Animated route effects
    if (cityPixels.length >= 2 && animStartRef.current > 0) {
      const elapsed = Date.now() - animStartRef.current
      ctx.globalAlpha = 0.8
      for (let i = 0; i < cityPixels.length - 1; i++) {
        const period = 5000 + i * 2500
        const t = (elapsed % period) / period
        const from = cityPixels[i]
        const to = cityPixels[i + 1]
        const mx = (from.x + to.x) / 2
        const my = (from.y + to.y) / 2 - 30
        const bx = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * mx + t * t * to.x
        const by = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * my + t * t * to.y
        ctx.fillStyle = theme.gold
        ctx.beginPath()
        ctx.arc(bx, by, 4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    // City markers
    for (const cp of cityPixels) {
      ctx.beginPath()
      ctx.arc(cp.x, cp.y, cp.r + 6, 0, Math.PI * 2)
      ctx.strokeStyle = theme.gold
      ctx.globalAlpha = 0.35
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.globalAlpha = 1

      ctx.beginPath()
      ctx.arc(cp.x, cp.y, cp.r, 0, Math.PI * 2)
      ctx.fillStyle = theme.gold
      ctx.fill()
      ctx.strokeStyle = theme.bgCard
      ctx.lineWidth = 3
      ctx.stroke()
    }

    ctx.restore()
    
    // Only continue animation if there are dynamic elements or interaction
    const shouldAnimate = cityPixels.length >= 2 || touchState.current.type !== 'none'
    if (shouldAnimate) {
      animFrameRef.current = requestAnimationFrame(draw)
    } else {
      animFrameRef.current = 0
    }
  }, [visitedProvinces, theme, visitedCities])

  const initCanvas = useCallback(() => {
    const query = Taro.createSelectorQuery()
    query.select(`#${canvasId}`).fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) return
      const node = res[0].node as any
      const dpr = Taro.getSystemInfoSync().pixelRatio
      node.width = res[0].width * dpr
      node.height = res[0].height * dpr
      canvasSizeRef.current = { w: res[0].width, h: res[0].height, dpr }
      canvasNodeRef.current = node
      ctxRef.current = node.getContext('2d')
      buildPixelData()
      animStartRef.current = Date.now()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = requestAnimationFrame(draw)
    })
  }, [canvasId, draw, buildPixelData])

  useImperativeHandle(ref, () => ({ redraw: () => { buildPixelData() } }))

  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure Canvas node is ready in mini-program
      const timer = setTimeout(() => {
        initCanvas()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, initCanvas])

  useEffect(() => { 
    if (ctxRef.current) {
      buildPixelData() 
    }
  }, [visitedProvinces, visitedCities, buildPixelData])
  useEffect(() => () => { 
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) 
  }, [])
  useDidHide(() => { 
    setIsVisible(false)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) 
  })
  useDidShow(() => {
    setIsVisible(true)
    buildPixelData()
    animStartRef.current = Date.now()
    animFrameRef.current = requestAnimationFrame(draw)
  })

  // Touch helpers for view transform
  const reverseTransformPoint = (sx: number, sy: number) => {
    const zoom = zoomRef.current
    const pan = panRef.current
    const cx = canvasSizeRef.current.w / 2
    const cy = canvasSizeRef.current.h / 2
    return {
      x: (sx - cx - pan.x) / zoom + cx,
      y: (sy - cy - pan.y) / zoom + cy,
    }
  }

  const dist = (t1: any, t2: any) => Math.sqrt((t1.x - t2.x) ** 2 + (t1.y - t2.y) ** 2)

  const handleTouchStart = (e: any) => {
    const touches = e.touches
    if (touches.length === 2) {
      const dx = touches[0].x - touches[1].x
      const dy = touches[0].y - touches[1].y
      touchState.current = {
        type: 'pinch',
        startPan: { x: panRef.current.x, y: panRef.current.y },
        lastPos: { x: 0, y: 0 },
        pinchDist: Math.sqrt(dx * dx + dy * dy),
        pinchZoom: zoomRef.current,
        pinchCenter: {
          x: (touches[0].x + touches[1].x) / 2,
          y: (touches[0].y + touches[1].y) / 2,
        },
      }
    } else if (touches.length === 1) {
      const t = touches[0]
      touchState.current = {
        type: 'pan',
        startPan: { x: panRef.current.x, y: panRef.current.y },
        lastPos: { x: t.x, y: t.y },
        pinchDist: 0,
        pinchZoom: 1,
        pinchCenter: { x: 0, y: 0 },
      }
    }
  }

  const handleTouchMove = (e: any) => {
    const touches = e.touches
    if (touchState.current.type === 'pinch' && touches.length >= 2) {
      const dx = touches[0].x - touches[1].x
      const dy = touches[0].y - touches[1].y
      const currentDist = Math.sqrt(dx * dx + dy * dy)
      const ratio = currentDist / touchState.current.pinchDist
      const newZoom = Math.max(0.8, Math.min(6, touchState.current.pinchZoom * ratio))
      // Adjust pan to keep pinch center stationary
      const pc = touchState.current.pinchCenter
      const oldZoom = zoomRef.current
      zoomRef.current = newZoom
      panRef.current = {
        x: pc.x - (pc.x - panRef.current.x) * (newZoom / oldZoom),
        y: pc.y - (pc.y - panRef.current.y) * (newZoom / oldZoom),
      }
    } else if (touchState.current.type === 'pan' && touches.length === 1) {
      const t = touches[0]
      panRef.current = {
        x: panRef.current.x + t.x - touchState.current.lastPos.x,
        y: panRef.current.y + t.y - touchState.current.lastPos.y,
      }
      touchState.current.lastPos = { x: t.x, y: t.y }
    }
    
    // Ensure we redraw during interaction
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(draw)
    }
  }

  const handleTouchEnd = (e: any) => {
    const touches = e.touches
    const isMultiTouch = touchState.current.type === 'pinch'

    if (touchState.current.type === 'pan') {
      const dx = panRef.current.x - touchState.current.startPan.x
      const dy = panRef.current.y - touchState.current.startPan.y
      if (Math.abs(dx) + Math.abs(dy) < 10) {
        const touch = e.changedTouches?.[0]
        if (touch) {
          const pos = reverseTransformPoint(touch.x, touch.y)
          for (const cp of cityPixelsRef.current) {
            const ddx = pos.x - cp.x, ddy = pos.y - cp.y
            if (ddx * ddx + ddy * ddy < (cp.r + 15) * (cp.r + 15)) {
              onCityClick?.(cp.name)
              touchState.current.type = 'none'
              return
            }
          }
          for (const { rings, name } of polygonsRef.current) {
            for (const ring of rings) {
              if (pointInPolygon(pos.x, pos.y, ring)) {
                onProvinceClick?.(name)
                touchState.current.type = 'none'
                return
              }
            }
          }
        }
      }
    }

    // Handle double-tap reset, but ONLY for single finger tap
    const now = Date.now()
    if (!isMultiTouch && touches.length === 0) {
      const gap = now - lastTapRef.current
      if (gap > 40 && gap < 300) {
        zoomRef.current = 1
        panRef.current = { x: 0, y: 0 }
      }
      lastTapRef.current = now
    } else if (isMultiTouch) {
      // If was pinching, set lastTap to future to block immediate double tap detection
      lastTapRef.current = now + 1000
    }
    
    touchState.current.type = 'none'
    
    // Ensure one last draw to settle state
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(draw)
    }
  }

    if (!isVisible) return <View style={{ width: '100%', height: '100%', ...style, background: theme.bgCard }} />

    return (
      <Canvas
        id={canvasId}
        canvasId={canvasId}
        type="2d"
        disableScroll
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ width: '100%', height: '100%', ...style }}
      />
    )
})

export default ChinaMap
