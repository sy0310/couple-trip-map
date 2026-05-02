import { useContext, useState } from 'react'
import { View, Text, Input, Textarea, Picker, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { AppContext } from '../../app'
import { getUser } from '../../services/auth'
import { updateUserProfile } from '../../../../shared/lib/trips'
import { compressImage } from '../../services/storage'
import { generateId } from '../../../../shared/lib/utils'
import styles from './index.module.css'

interface ProfileForm {
  nickname: string
  avatar_url: string | null
  bio: string
  city: string
  birthday: string
}

const EMPTY_FORM: ProfileForm = {
  nickname: '',
  avatar_url: null,
  bio: '',
  city: '',
  birthday: '',
}

export default function ProfileEditPage() {
  const { adapter, userId } = useContext(AppContext)
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    if (!adapter) return
    const user = await getUser(adapter)
    if (user) {
      const fullUser = user as {
        nickname: string
        avatar_url: string | null
        bio: string | null
        city: string | null
        birthday: string | null
      }
      setForm({
        nickname: fullUser.nickname || '',
        avatar_url: fullUser.avatar_url,
        bio: fullUser.bio ?? '',
        city: fullUser.city ?? '',
        birthday: fullUser.birthday ?? '',
      })
    }
  }

  useDidShow(() => {
    load()
  })

  const handleAvatarChange = () => {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFilePaths[0]
        if (!tempPath || !userId) return

        setUploading(true)
        try {
          const compressed = await compressImage(tempPath)
          const fileName = `${userId}/${generateId()}.jpg`
          const fileObj = { tempFilePath: compressed }

          const uploadResult = await adapter.storage
            .from('avatars')
            .upload(fileName, fileObj, { contentType: 'image/jpeg' })

          if (uploadResult.error) {
            Taro.showToast({ title: '上传失败', icon: 'error' })
            return
          }

          const { data } = adapter.storage.from('avatars').getPublicUrl(fileName)
          setForm((prev) => ({ ...prev, avatar_url: data.publicUrl }))
          Taro.showToast({ title: '头像已更新', icon: 'success' })
        } catch {
          Taro.showToast({ title: '上传失败', icon: 'error' })
        } finally {
          setUploading(false)
        }
      },
    })
  }

  const handleBirthdayChange = (e: { detail: { value: string } }) => {
    setForm((prev) => ({ ...prev, birthday: e.detail.value }))
  }

  const handleSubmit = async () => {
    if (!form.nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'error' })
      return
    }

    setSaving(true)
    try {
      const ok = await updateUserProfile(adapter, userId!, {
        nickname: form.nickname.trim(),
        avatar_url: form.avatar_url,
        bio: form.bio.trim() || null,
        city: form.city.trim() || null,
        birthday: form.birthday || null,
      })

      if (ok) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 800)
      } else {
        Taro.showToast({ title: '保存失败', icon: 'error' })
      }
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className={styles.form}>
      <Text className={styles.pageTitle}>编辑资料</Text>

      {/* Avatar */}
      <View className={styles.avatarSection}>
        {form.avatar_url ? (
          <Image className={styles.avatar} src={form.avatar_url} mode="aspectFill" />
        ) : (
          <View className={styles.avatarPlaceholder}>
            <Text className={styles.avatarInitial}>
              {form.nickname ? form.nickname[0] : '?'}
            </Text>
          </View>
        )}
        <View className={styles.avatarBtn} onTap={handleAvatarChange}>
          <Text className={styles.avatarBtnText}>
            {uploading ? '上传中...' : '更换头像'}
          </Text>
        </View>
      </View>

      {/* Nickname */}
      <View className={styles.field}>
        <Text className={styles.label}>昵称 *</Text>
        <Input
          className={styles.input}
          placeholder="输入昵称"
          value={form.nickname}
          onInput={(e) =>
            setForm((prev) => ({ ...prev, nickname: e.detail.value }))
          }
        />
      </View>

      {/* Bio */}
      <View className={styles.field}>
        <Text className={styles.label}>个人简介</Text>
        <Textarea
          className={`${styles.input} ${styles.textarea}`}
          placeholder="介绍一下自己..."
          value={form.bio}
          onInput={(e) =>
            setForm((prev) => ({ ...prev, bio: e.detail.value }))
          }
        />
      </View>

      {/* City */}
      <View className={styles.field}>
        <Text className={styles.label}>所在城市</Text>
        <Input
          className={styles.input}
          placeholder="如：杭州"
          value={form.city}
          onInput={(e) =>
            setForm((prev) => ({ ...prev, city: e.detail.value }))
          }
        />
      </View>

      {/* Birthday */}
      <View className={styles.field}>
        <Text className={styles.label}>生日</Text>
        <Picker mode="date" onChange={handleBirthdayChange}>
          <View className={styles.picker}>
            <Text className={form.birthday ? styles.pickerText : styles.pickerPlaceholder}>
              {form.birthday || '请选择生日'}
            </Text>
          </View>
        </Picker>
      </View>

      {/* Submit */}
      <View className={styles.submitBtn} onTap={handleSubmit}>
        <Text className={styles.submitText}>
          {saving ? '保存中...' : '保存'}
        </Text>
      </View>
    </View>
  )
}
