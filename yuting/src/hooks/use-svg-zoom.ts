'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSvgZoomOptions {
  width: number;
  height: number;
  minZoom?: number;
  maxZoom?: number;
}

interface UseSvgZoomReturn {
  transform: string;
  scale: number;
  translate: { x: number; y: number };
  onMouseDown: React.MouseEventHandler<SVGSVGElement>;
  onMouseMove: React.MouseEventHandler<SVGSVGElement>;
  onWheel: React.WheelEventHandler<SVGSVGElement>;
  onTouchStart: React.TouchEventHandler<SVGSVGElement>;
  onTouchMove: React.TouchEventHandler<SVGSVGElement>;
  onTouchEnd: React.TouchEventHandler<SVGSVGElement>;
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export function useSvgZoom(options: UseSvgZoomOptions): UseSvgZoomReturn {
  const { width: _width, height: _height, minZoom = 0.5, maxZoom = 8 } = options;
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);

  const transform = `translate(${translate.x}, ${translate.y}) scale(${scale})`;

  const reset = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => setScale((s) => Math.min(s * 1.5, maxZoom)), [maxZoom]);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s / 1.5, minZoom)), [minZoom]);

  const handleWheel = useCallback<React.WheelEventHandler<SVGSVGElement>>((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(minZoom, Math.min(maxZoom, scale * delta));
    if (newScale === scale) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    const svgX = (mouseX - translate.x) / scale;
    const svgY = (mouseY - translate.y) / scale;

    setTranslate({ x: mouseX - svgX * newScale, y: mouseY - svgY * newScale });
    setScale(newScale);
  }, [scale, translate, minZoom, maxZoom]);

  const handleMouseDown = useCallback<React.MouseEventHandler<SVGSVGElement>>((e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
    e.currentTarget.style.cursor = 'grabbing';
  }, [translate]);

  const handleMouseMove = useCallback<React.MouseEventHandler<SVGSVGElement>>((e) => {
    if (!isDragging.current) return;
    setTranslate({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback<React.TouchEventHandler<SVGSVGElement>>((e) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      dragStart.current = { x: e.touches[0].clientX - translate.x, y: e.touches[0].clientY - translate.y };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      lastPinchDist.current = getTouchDistance(e.touches);
    }
  }, [translate]);

  const handleTouchMove = useCallback<React.TouchEventHandler<SVGSVGElement>>((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging.current) {
      setTranslate({ x: e.touches[0].clientX - dragStart.current.x, y: e.touches[0].clientY - dragStart.current.y });
    } else if (e.touches.length === 2 && lastPinchDist.current > 0) {
      const dist = getTouchDistance(e.touches);
      const ratio = dist / lastPinchDist.current;
      const newScale = Math.max(minZoom, Math.min(maxZoom, scale * ratio));
      const svgRect = e.currentTarget.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - svgRect.left;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - svgRect.top;
      const svgX = (cx - translate.x) / scale;
      const svgY = (cy - translate.y) / scale;
      setTranslate({ x: cx - svgX * newScale, y: cy - svgY * newScale });
      setScale(newScale);
      lastPinchDist.current = dist;
    }
  }, [scale, translate, minZoom, maxZoom]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastPinchDist.current = 0;
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  return {
    transform,
    scale,
    translate,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onWheel: handleWheel,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    reset,
    zoomIn,
    zoomOut,
  };
}
