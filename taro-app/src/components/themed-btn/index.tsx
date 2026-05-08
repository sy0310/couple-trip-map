import { View, Text } from '@tarojs/components'
import { useTheme } from '../theme/ThemeProvider'

interface ThemedBtnProps {
  children: React.ReactNode
  onTap?: () => void
  variant?: 'primary' | 'outline' | 'ghost'
  full?: boolean
  disabled?: boolean
  small?: boolean
}

export function ThemedBtn({
  children,
  onTap,
  variant = 'primary',
  full,
  disabled,
  small,
}: ThemedBtnProps) {
  const { tokens: T } = useTheme()
  const isPrimary = variant === 'primary'

  return (
    <View
      onTap={disabled ? undefined : onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // alignSelf:stretch fills the parent's content width without the
        // percentage-box ambiguity that causes overflow in WeChat's webview.
        // alignSelf:flex-start keeps non-full buttons at content width.
        alignSelf: full ? 'stretch' : 'flex-start',
        flexShrink: full ? undefined : 0,
        flexGrow: full ? undefined : 0,
        paddingTop: small ? 7 : 11,
        paddingBottom: small ? 7 : 11,
        paddingLeft: small ? 16 : 20,
        paddingRight: small ? 16 : 20,
        borderRadius: 10,
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderStyle: variant === 'outline' ? 'solid' : undefined,
        borderColor: variant === 'outline' ? T.border : undefined,
        background: isPrimary ? T.accent : variant === 'ghost' ? 'transparent' : T.bgCardAlt,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text
        style={{
          color: isPrimary ? '#FFFFFF' : variant === 'ghost' ? T.accent : T.inkMid,
          fontSize: small ? 12 : 14,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        {children}
      </Text>
    </View>
  )
}
