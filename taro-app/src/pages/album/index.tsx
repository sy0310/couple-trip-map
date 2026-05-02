import { useContext, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { AppContext } from '../../app'
import { getAllPhotosForCouple, getCoupleId } from '@shared/lib/trips'
import { compressImage } from '../../services/storage'
import styles from './index.module.css'

interface PhotoItem {
  id: string
  file_url: string
  created_at: string
  visitDate?: string
  tripLocation?: string
}

interface YearGroup {
  year: string
  photos: PhotoItem[]
}

export default function AlbumPage() {
  const { adapter, userId } = useContext(AppContext)
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([])
  const [allPhotos, setAllPhotos] = useState<PhotoItem[]>([])
  const [uploading, setUploading] = useState(false)

  const loadPhotos = async () => {
    if (!userId) return
    const cid = await getCoupleId(adapter, userId)
    if (!cid) return

    const photos = await getAllPhotosForCouple(adapter, cid)
    setAllPhotos(photos)

    const groups = new Map<string, PhotoItem[]>()
    for (const photo of photos) {
      const dateStr = photo.visitDate || photo.created_at
      const year = new Date(dateStr).getFullYear().toString()
      if (!groups.has(year)) groups.set(year, [])
      groups.get(year)!.push(photo)
    }

    const sorted: YearGroup[] = [...groups.entries()]
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([year, photos]) => ({ year, photos }))

    setYearGroups(sorted)
  }

  useDidShow(() => {
    loadPhotos()
  })

  usePullDownRefresh(async () => {
    await loadPhotos()
    Taro.stopPullDownRefresh()
  })

  const handleUpload = async () => {
    try {
      const res = await wx.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      setUploading(true)

      for (const tempPath of res.tempFilePaths) {
        const compressed = await compressImage(tempPath)
        const fileName = compressed.split('/').pop() || 'photo.jpg'
        await adapter.storage
          .from('photos')
          .upload(
            `${userId}/${Date.now()}-${fileName}`,
            { tempFilePath: compressed } as never,
            { contentType: 'image/jpeg' }
          )
      }

      Taro.showToast({ title: '上传成功', icon: 'success' })
      await loadPhotos()
    } catch (err) {
      console.error('Upload failed:', err)
      Taro.showToast({ title: '上传失败', icon: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const handlePhotoTap = (urls: string[], current: string) => {
    wx.previewImage({ urls, current })
  }

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>旅行相册</Text>
        <View className={styles.uploadBtn} onTap={handleUpload}>
          <Text className={styles.uploadText}>
            {uploading ? '上传中...' : '上传照片'}
          </Text>
        </View>
      </View>

      {yearGroups.map((group) => (
        <View key={group.year} className={styles.yearSection}>
          <Text className={styles.yearTitle}>{group.year}年</Text>
          <View className={styles.photoGrid}>
            {group.photos.map((photo) => (
              <View
                key={photo.id}
                className={styles.photoCard}
                onTap={() =>
                  handlePhotoTap(
                    allPhotos.map((p) => p.file_url),
                    photo.file_url
                  )
                }
              >
                <Image
                  src={photo.file_url}
                  mode="aspectFill"
                  className={styles.photoImage}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      {yearGroups.length === 0 && (
        <View className={styles.empty}>
          <Text className={styles.emptyText}>还没有照片</Text>
          <Text className={styles.emptyHint}>点击上传按钮添加旅行照片</Text>
        </View>
      )}
    </View>
  )
}
