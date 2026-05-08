import { View, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useTheme } from '../theme/ThemeProvider'

interface ModalSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

const { windowHeight } = Taro.getSystemInfoSync()
const SHEET_MAX = Math.round(windowHeight * 0.85)
const CONTENT_MAX = Math.round(windowHeight * 0.65)

export function ModalSheet({ open, onClose, title, children }: ModalSheetProps) {
  const { tokens: T } = useTheme()

  if (!open) return null

  return (
    <View
      onTap={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: windowHeight,
        zIndex: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      <View
        catchMove
        style={{
          width: '100%',
          maxHeight: SHEET_MAX,
          background: T.bgCard,
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <View style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 12,
          paddingBottom: 8,
          flexShrink: 0,
        }}>
          <View style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: T.border,
          }} />
        </View>

        {/* Title */}
        {title && (
          <View style={{
            padding: '0 20px 14px',
            fontWeight: 600,
            fontSize: 16,
            color: T.ink,
            borderBottom: `1px solid ${T.border}`,
            flexShrink: 0,
          }}>
            {title}
          </View>
        )}

        {/* Content */}
        <ScrollView
          scrollY
          style={{
            flex: 1,
            maxHeight: CONTENT_MAX,
          }}
        >
          <View style={{ padding: 20 }}>
            {children}
          </View>
        </ScrollView>
      </View>
    </View>
  )
}
