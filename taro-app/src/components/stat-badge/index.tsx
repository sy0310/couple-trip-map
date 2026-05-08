import { View, Text } from '@tarojs/components'
import { useTheme } from '../theme/ThemeProvider'

interface StatBadgeProps {
  value: string | number
  label: string
  accent?: boolean
}

export function StatBadge({ value, label, accent }: StatBadgeProps) {
  const { tokens: T } = useTheme()

  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Text
        style={{
          fontWeight: 700,
          fontSize: 22,
          color: accent ? T.accent : T.ink,
          lineHeight: 1,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: T.inkFaint,
          fontWeight: 400,
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </Text>
    </View>
  )
}
