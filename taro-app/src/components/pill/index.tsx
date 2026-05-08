import { View, Text } from '@tarojs/components'
import { useTheme } from '../theme/ThemeProvider'

interface PillProps {
  children: React.ReactNode
  accent?: boolean
  small?: boolean
  onTap?: () => void
}

export function Pill({ children, accent, small, onTap }: PillProps) {
  const { tokens: T } = useTheme()

  return (
    <View
      onTap={onTap}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: small ? '2px 8px' : '4px 12px',
        borderRadius: 100,
        background: accent ? T.accentFaint : T.bgCardAlt,
        border: `1px solid ${accent ? T.accentLight + '40' : T.border}`,
      }}
    >
      <Text
        style={{
          fontSize: small ? 10 : 11,
          fontWeight: 500,
          color: accent ? T.accent : T.inkMid,
          letterSpacing: '0.02em',
        }}
      >
        {children}
      </Text>
    </View>
  )
}
