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

/**
 * ECharts canvas component for Taro mini programs.
 * Uses Canvas 2D API to initialize echarts.
 */
export default function EcCanvas({
  ec,
  canvasId = 'ec-canvas',
  style,
}: EcCanvasProps) {
  const chartRef = useRef<echarts.ECharts | null>(null)

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

        const canvas = res[0].node as unknown as HTMLCanvasElement

        const dpr = Taro.getSystemInfoSync().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr

        const chart = echarts.init(canvas as never, undefined, {
          width: res[0].width,
          height: res[0].height,
          devicePixelRatio: dpr,
        })

        chartRef.current = chart

        if (ec.onInit) {
          ec.onInit(chart)
        }

        if (ec.option) {
          chart.setOption(ec.option)
        }
      })
  }, [canvasId, ec])

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
