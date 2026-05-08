import { useContext, useState } from 'react'
import { View, Text, Canvas, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { AppContext } from '../../context'
import { getUser } from '../../services/auth'
import { getCoupleInfo } from '@shared/lib/couples'
import { getVisitedProvinces } from '@shared/lib/trips'
import { TOTAL_PROVINCES } from '@shared/lib/provinces'
import { useTheme } from '../../components/theme/ThemeProvider'
import { PageHeader } from '../../components/page-header'

interface PosterData {
  nickname: string
  partnerNickname: string
  sinceDate: string | null
  provinceCount: number
  tripCount: number
  progressPercent: number
}

const CANVAS_WIDTH = 750
const CANVAS_HEIGHT = 1332

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  } catch {
    return dateStr
  }
}

function drawBackground(ctx: any, w: number, h: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#4A7C59')
  gradient.addColorStop(0.4, '#7AAD8A')
  gradient.addColorStop(1, '#F5EFE4')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

function drawFrame(ctx: any, w: number, h: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 6
  ctx.strokeRect(40, 40, w - 80, h - 80)
}

function drawDecorations(ctx: any, w: number) {
  ctx.font = '48px sans-serif'
  ctx.textAlign = 'center'
  ctx.globalAlpha = 0.12
  ctx.fillText('💕', w / 2 - 80, 120)
  ctx.fillText('🗺', w / 2 + 80, 120)
  ctx.globalAlpha = 1
}

function drawHeader(ctx: any, w: number) {
  ctx.font = 'bold 40px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText('遇 亭', w / 2, 220)

  ctx.font = '14px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fillText('珍藏每一段旅程', w / 2, 260)
}

function drawCoupleNames(ctx: any, w: number, data: PosterData) {
  const partnerLabel = data.partnerNickname || '另一半'
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(`${data.nickname}  ❤  ${partnerLabel}`, w / 2, 340)

  if (data.sinceDate) {
    ctx.font = '18px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText(`在一起 · ${formatDate(data.sinceDate)}`, w / 2, 385)
  }
}

function drawStats(ctx: any, w: number, data: PosterData) {
  const y = 480
  const boxW = 170
  const gap = 30
  const boxH = 110
  const totalW = boxW * 3 + gap * 2
  const startX = (w - totalW) / 2

  const stats = [
    { label: '已探索省份', value: `${data.provinceCount}/${TOTAL_PROVINCES}` },
    { label: '旅行次数', value: `${data.tripCount} 次` },
    { label: '完成度', value: `${data.progressPercent}%` },
  ]

  stats.forEach((stat, i) => {
    const x = startX + i * (boxW + gap)

    ctx.fillStyle = 'rgba(255,255,255,0.13)'
    ctx.beginPath()
    ctx.moveTo(x + 16, y)
    ctx.lineTo(x + boxW - 16, y)
    ctx.arcTo(x + boxW, y, x + boxW, y + 16, 16)
    ctx.lineTo(x + boxW, y + boxH - 16)
    ctx.arcTo(x + boxW, y + boxH, x + boxW - 16, y + boxH, 16)
    ctx.lineTo(x + 16, y + boxH)
    ctx.arcTo(x, y + boxH, x, y + boxH - 16, 16)
    ctx.lineTo(x, y + 16)
    ctx.arcTo(x, y, x + 16, y, 16)
    ctx.closePath()
    ctx.fill()

    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(stat.value, x + boxW / 2, y + 46)

    ctx.font = '14px sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.fillText(stat.label, x + boxW / 2, y + 78)
  })
}

function drawMapHint(ctx: any, w: number) {
  const y = 660
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText('在中国地图上，点亮每一段旅程 ✨', w / 2, y)
}

function drawFooter(ctx: any, w: number, h: number) {
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText('遇亭 — 记录属于两个人的旅行记忆', w / 2, h - 80)
}

export default function PosterPage() {
  const { adapter, userId } = useContext(AppContext)
  const { tokens: T } = useTheme()
  const [drawing, setDrawing] = useState(true)
  const [canvasErr, setCanvasErr] = useState(false)

  useDidShow(() => {
    loadAndDraw()
  })

  const loadAndDraw = async () => {
    if (!userId) {
      setDrawing(false)
      return
    }
    try {
      const user = await getUser(adapter)
      const coupleInfo = await getCoupleInfo(adapter, userId)
      let provinceCount = 0
      let tripCount = 0

      if (coupleInfo) {
        const [provinces, trips] = await Promise.all([
          getVisitedProvinces(adapter, coupleInfo.id),
          adapter.from('trips').select('id').eq('couple_id', coupleInfo.id),
        ])
        provinceCount = provinces.length
        const { data: tripRows } = trips as { data: { id: string }[] | null }
        tripCount = tripRows?.length || 0
      }

      const posterData: PosterData = {
        nickname: user?.nickname || '旅行者',
        partnerNickname: coupleInfo?.partnerNickname || '',
        sinceDate: coupleInfo?.sinceDate || null,
        provinceCount,
        tripCount,
        progressPercent: provinceCount > 0 ? Math.round((provinceCount / TOTAL_PROVINCES) * 100) : 0,
      }

      drawToCanvas(posterData)
    } catch {
      setDrawing(false)
      setCanvasErr(true)
    }
  }

  const drawToCanvas = (posterData: PosterData) => {
    const query = Taro.createSelectorQuery()
    query.select('#poster-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          setCanvasErr(true)
          setDrawing(false)
          return
        }

        try {
          const canvas = res[0].node as any
          const ctx = canvas.getContext('2d')
          const dpr = Taro.getSystemInfoSync().pixelRatio

          canvas.width = CANVAS_WIDTH
          canvas.height = CANVAS_HEIGHT

          ctx.scale(dpr, dpr)

          const W = CANVAS_WIDTH / dpr
          const H = CANVAS_HEIGHT / dpr

          drawBackground(ctx, W, H)
          drawFrame(ctx, W, H)
          drawDecorations(ctx, W)
          drawHeader(ctx, W)
          drawCoupleNames(ctx, W, posterData)
          drawStats(ctx, W, posterData)
          drawMapHint(ctx, W)
          drawFooter(ctx, W, H)

          setDrawing(false)
        } catch {
          setCanvasErr(true)
          setDrawing(false)
        }
      })
  }

  const saveToAlbum = () => {
    const query = Taro.createSelectorQuery()
    query.select('#poster-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          Taro.showToast({ title: '画布未就绪', icon: 'error' })
          return
        }
        const canvas = res[0].node as any
        Taro.canvasToTempFilePath({
          canvas,
          x: 0, y: 0,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          destWidth: CANVAS_WIDTH,
          destHeight: CANVAS_HEIGHT,
          fileType: 'jpg',
          quality: 0.95,
          success: (result) => {
            wx.saveImageToPhotosAlbum({
              filePath: result.tempFilePath,
              success: () => Taro.showToast({ title: '已保存到相册', icon: 'success' }),
              fail: (err: any) => {
                if (err.errMsg.includes('auth deny')) {
                  Taro.showModal({
                    title: '需要相册权限',
                    content: '请在设置中开启相册权限',
                    confirmText: '去设置',
                    success: (modalRes) => {
                      if (modalRes.confirm) wx.openSetting({})
                    },
                  })
                } else {
                  Taro.showToast({ title: '保存失败', icon: 'error' })
                }
              },
            })
          },
          fail: () => Taro.showToast({ title: '导出失败', icon: 'error' }),
        })
      })
  }

  if (canvasErr) {
    return (
      <View style={{ flex: 1, background: T.bg }}>
        <PageHeader title="旅行海报" />
        <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: T.inkFaint, fontSize: 14 }}>海报生成失败，请重试</Text>
        </View>
      </View>
    )
  }

  if (!userId) {
    return (
      <View style={{ flex: 1, background: T.bg }}>
        <PageHeader title="旅行海报" />
        <View style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: T.inkFaint, fontSize: 14 }}>请先登录</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="旅行海报" />

      <View style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}>
        {/* Canvas preview */}
        <View style={{
          flex: 1,
          borderRadius: 16,
          overflow: 'hidden',
          border: `1px solid ${T.border}`,
          background: '#F5EFE4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Canvas
            id="poster-canvas"
            canvasId="poster-canvas"
            type="2d"
            style={{
              width: '100%',
              height: '100%',
            }}
          />
          {drawing && (
            <View style={{ position: 'absolute' }}>
              <Text style={{ color: T.inkFaint, fontSize: 13 }}>生成中...</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 12,
          padding: '16px 0',
          paddingBottom: 32,
        }}>
          <Button
            onTap={saveToAlbum}
            disabled={drawing}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 12,
              background: T.accent,
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: drawing ? 0.5 : 1,
            }}
          >
            保存到相册
          </Button>
          <Button
            openType="share"
            disabled={drawing}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 12,
              background: T.bgCardAlt,
              color: T.inkMid,
              fontSize: 15,
              fontWeight: 600,
              border: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: drawing ? 0.5 : 1,
            }}
          >
            分享给朋友
          </Button>
        </View>
      </View>
    </View>
  )
}
