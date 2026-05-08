import { useEffect, useRef, useCallback } from 'react'
import { Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import * as echarts from 'echarts'

interface EcCanvasProps {
  ec: {
    onInit?: (chart: echarts.ECharts) => void
    option?: Record<string, unknown>
  }
  canvasId?: string
  style?: React.CSSProperties
}

class WxCanvas {
  ctx: any
  canvasNode: any
  chart: any = null
  id: string

  constructor(ctx: any, canvasNode: any, canvasId: string) {
    this.ctx = ctx
    this.canvasNode = canvasNode
    this.id = canvasId
    this._initEvent()
  }

  getContext(_type: string) {
    return this.ctx
  }

  // Taro simulates browser env, echarts checks window.addEventListener → must be noop
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {}
  attachEvent() {}
  detachEvent() {}

  set width(w: number) { if (this.canvasNode) this.canvasNode.width = w }
  set height(h: number) { if (this.canvasNode) this.canvasNode.height = h }
  get width() { return this.canvasNode ? this.canvasNode.width : 0 }
  get height() { return this.canvasNode ? this.canvasNode.height : 0 }

  _initEvent() {
    this.ctx.onTouchStart = (e: any) => this._dispatch('mousedown', e)
    this.ctx.onTouchMove = (e: any) => this._dispatch('mousemove', e)
    this.ctx.onTouchEnd = (e: any) => this._dispatch('mouseup', e)
  }

  _dispatch(type: string, e: any) {
    if (!this.chart) return
    const touch = e.touches?.[0] || e.changedTouches?.[0]
    if (!touch) return
    const handler = (this.chart.getZr() as any).handler
    if (!handler) return
    handler.dispatch(type, {
      target: this,
      zrX: touch.x,
      zrY: touch.y,
      offsetX: touch.x,
      offsetY: touch.y,
    })
    handler.dispatch('mousemove', {
      target: this,
      zrX: touch.x,
      zrY: touch.y,
      offsetX: touch.x,
      offsetY: touch.y,
    })
  }
}

export default function EcCanvas({
  ec,
  canvasId = 'ec-canvas',
  style,
}: EcCanvasProps) {
  const chartRef = useRef<echarts.ECharts | null>(null)
  const onInitRef = useRef(ec.onInit)

  useEffect(() => {
    onInitRef.current = ec.onInit
  })

  const initChart = useCallback(() => {
    if (chartRef.current) return

    const query = Taro.createSelectorQuery()
    query
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.error('ec-canvas: Failed to get canvas node')
          return
        }

        const canvasNode = res[0].node as any
        const dpr = Taro.getSystemInfoSync().pixelRatio
        canvasNode.width = res[0].width * dpr
        canvasNode.height = res[0].height * dpr

        const ctx = canvasNode.getContext('2d')
        const wxCanvas = new WxCanvas(ctx, canvasNode, canvasId)

        echarts.setPlatformAPI({
          createCanvas() {
            return wxCanvas
          },
        })

        const chart = echarts.init(wxCanvas, undefined, {
          width: res[0].width,
          height: res[0].height,
          devicePixelRatio: dpr,
        })

        wxCanvas.chart = chart
        chartRef.current = chart

        if (onInitRef.current) {
          onInitRef.current(chart)
        }

        if (ec.option) {
          chart.setOption(ec.option)
        }
      })
  }, [canvasId])

  useEffect(() => {
    setTimeout(initChart, 300)
    return () => {
      if (chartRef.current) {
        chartRef.current.dispose()
        chartRef.current = null
      }
    }
  }, [initChart])

  useEffect(() => {
    if (chartRef.current && ec.option) {
      chartRef.current.setOption(ec.option)
    }
  }, [ec.option])

  useEffect(() => {
    if (chartRef.current && ec.onInit) {
      chartRef.current.off('click')
      ec.onInit(chartRef.current)
    }
  }, [ec.onInit])

  return (
    <Canvas
      id={canvasId}
      canvasId={canvasId}
      type="2d"
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  )
}
