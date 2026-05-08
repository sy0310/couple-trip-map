import { View, Text } from '@tarojs/components'
import { useTheme } from '../theme/ThemeProvider'

interface SectionLabelProps {
  children: React.ReactNode
  action?: string
  onAction?: () => void
}

export function SectionLabel({ children, action, onAction }: SectionLabelProps) {
  const { tokens: T } = useTheme()

  return (
    <View
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <View style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 3,
            height: 14,
            background: T.accent,
            borderRadius: 2,
          }}
        />
        <Text
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: T.ink,
            letterSpacing: '0.02em',
          }}
        >
          {children}
        </Text>
      </View>
      {action && (
        <Text
          onTap={onAction}
          style={{
            fontSize: 11,
            color: T.accent,
            fontWeight: 500,
          }}
        >
          {action} →
        </Text>
      )}
    </View>
  )
}
