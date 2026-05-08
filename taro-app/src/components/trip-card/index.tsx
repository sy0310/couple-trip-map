import { View, Text, Image } from '@tarojs/components'
import { useTheme } from '../theme/ThemeProvider'

interface TripCardProps {
  location: string
  province: string
  city: string
  date: string
  notes?: string
  mood?: string
  coverUrl?: string | null
  photoColors?: string[]
  onTap?: () => void
  cardRadius?: number
}

export function TripCard({
  location,
  province,
  city,
  date,
  notes,
  mood,
  coverUrl,
  photoColors = ['#A0A0A0', '#808080'],
  onTap,
  cardRadius = 14,
}: TripCardProps) {
  const { tokens: T } = useTheme()

  return (
    <View
      onTap={onTap}
      style={{
        background: T.bgCard,
        borderRadius: cardRadius,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
        boxShadow: T.shadow,
      }}
    >
      <View style={{ position: 'relative', height: 360, overflow: 'hidden' }}>
        {coverUrl ? (
          <Image
            src={coverUrl}
            mode="aspectFill"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${photoColors[0]} 0%, ${photoColors[1]} 100%)`,
            }}
          />
        )}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
          }}
        />
        <View style={{ position: 'absolute', bottom: 8, left: 10 }}>
          <Text style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
            {date}
          </Text>
        </View>
        {mood && (
          <View style={{ position: 'absolute', top: 8, right: 10 }}>
            <Text style={{ fontSize: 16 }}>{mood}</Text>
          </View>
        )}
      </View>
      <View style={{ padding: '10px 12px 12px' }}>
        <Text
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: T.ink,
            marginBottom: 3,
            display: 'block',
          }}
        >
          {location}
        </Text>
        <Text style={{ fontSize: 11, color: T.inkFaint, display: 'block', marginBottom: notes ? 6 : 0 }}>
          {province} · {city}
        </Text>
        {notes && (
          <Text
            style={{
              fontSize: 11,
              color: T.inkMid,
              lineHeight: 1.5,
              overflow: 'hidden',
              fontStyle: 'italic',
            }}
          >
            {notes}
          </Text>
        )}
      </View>
    </View>
  )
}
