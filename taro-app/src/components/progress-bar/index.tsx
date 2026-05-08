import { View, Text } from '@tarojs/components'
import { useTheme } from '../theme/ThemeProvider'

interface ProgressBarProps {
  value: number
  max: number
  height?: number
  showLabel?: boolean
}

export function ProgressBar({ value, max, height = 6, showLabel }: ProgressBarProps) {
  const { tokens: T } = useTheme()
  const pct = Math.min(Math.round((value / max) * 100), 100)

  return (
    <View>
      {showLabel && (
        <View
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 11, color: T.inkFaint }}>
            {value} / {max}
          </Text>
          <Text style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>{pct}%</Text>
        </View>
      )}
      <View
        style={{
          height,
          borderRadius: height / 2,
          background: T.border,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: height / 2,
            background: `linear-gradient(90deg, ${T.accent}, ${T.accentLight})`,
          }}
        />
      </View>
    </View>
  )
}
