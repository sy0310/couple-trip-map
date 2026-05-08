import { View, Text } from '@tarojs/components'
import { useTheme } from '../theme/ThemeProvider'

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  rightEl?: React.ReactNode
  transparent?: boolean
}

export function PageHeader({ title, subtitle, onBack, rightEl, transparent }: PageHeaderProps) {
  const { tokens: T } = useTheme()

  return (
    <View
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px 10px',
        background: transparent ? 'transparent' : T.bg,
        borderBottom: transparent ? 'none' : `1px solid ${T.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {onBack && (
        <View
          onTap={onBack}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            border: `1px solid ${T.border}`,
            background: T.bgCard,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 16, color: T.inkMid }}>{'<'}</Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontWeight: 600,
            fontSize: 16,
            color: T.ink,
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 11, color: T.inkFaint, marginTop: 1 }}>{subtitle}</Text>
        )}
      </View>
      {rightEl}
    </View>
  )
}
