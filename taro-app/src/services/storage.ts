import type { StorageClient, BucketClient, Result } from '@shared/lib/adapter'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase'

/**
 * Compress a WeChat temp image file before upload.
 * Returns the path to the compressed temp file.
 */
export function compressImage(tempFilePath: string, quality: number = 80): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: tempFilePath,
      quality,
      success: (res) => resolve(res.tempFilePath),
      fail: reject,
    })
  })
}

class MiniBucketClient implements BucketClient {
  constructor(
    private bucket: string,
    private getToken: () => string
  ) {}

  private headers(contentType?: string): Record<string, string> {
    const h: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${this.getToken()}`,
    }
    if (contentType) h['Content-Type'] = contentType
    return h
  }

  async upload(path: string, file: unknown, opts?: { contentType?: string }): Promise<Result> {
    const url = `${SUPABASE_URL}/storage/v1/object/${this.bucket}/${path}`
    const contentType = opts?.contentType || 'application/octet-stream'

    // Strategy 1: wx.uploadFile (preferred -- supports binary upload)
    try {
      const result = await new Promise<{ statusCode: number; data: unknown }>((resolve, reject) => {
        const tempPath = (file as { tempFilePath?: string }).tempFilePath
        if (!tempPath) throw new Error('No tempFilePath on file object')

        wx.uploadFile({
          url,
          filePath: tempPath,
          name: 'file',
          header: this.headers(contentType),
          success: (res) =>
            resolve({
              statusCode: res.statusCode,
              data: JSON.parse(res.data || '{}'),
            }),
          fail: reject,
        })
      })

      if (result.statusCode >= 200 && result.statusCode < 300) {
        return { data: result.data, error: null }
      }
      // Fall through to strategy 2 on failure
    } catch {
      // wx.uploadFile failed, try strategy 2
    }

    // Strategy 2: wx.request + base64 (fallback)
    const fs = wx.getFileSystemManager()
    const base64 = fs.readFileSync(
      (file as { tempFilePath: string }).tempFilePath,
      'base64'
    )

    const resp = await new Promise<{ statusCode: number; data: unknown }>((resolve, reject) => {
      wx.request({
        url,
        method: 'POST',
        header: {
          ...this.headers(contentType + '; base64'),
          'Content-Type': contentType,
        },
        data: wx.base64ToArrayBuffer(base64),
        success: (res) => resolve({ statusCode: res.statusCode, data: res.data }),
        fail: reject,
      })
    })

    if (resp.statusCode >= 200 && resp.statusCode < 300) {
      return { data: resp.data, error: null }
    }
    return { data: null, error: { message: `Upload failed: ${resp.statusCode}` } }
  }

  getPublicUrl(internalPath: string): { data: { publicUrl: string } } {
    return {
      data: {
        publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${this.bucket}/${internalPath}`,
      },
    }
  }

  async remove(paths: string[]): Promise<Result> {
    const url = `${SUPABASE_URL}/storage/v1/object/${this.bucket}`
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method: 'DELETE',
        header: this.headers('application/json'),
        data: { prefixes: paths },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ data: res.data, error: null })
          } else {
            resolve({ data: null, error: { message: `Delete failed: ${res.statusCode}` } })
          }
        },
        fail: reject,
      })
    })
  }
}

export class MiniStorageClient implements StorageClient {
  constructor(private getToken: () => string) {}

  from(bucket: string): BucketClient {
    return new MiniBucketClient(bucket, this.getToken)
  }
}
