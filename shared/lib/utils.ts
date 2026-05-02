/**
 * Generate a UUID v4 equivalent using Math.random.
 * crypto.randomUUID() is not available in WeChat mini programs.
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Platform-agnostic file type for photo uploads.
 * Replaces browser File API with a shape compatible with both
 * wx.chooseImage results and browser File objects.
 */
export interface UploadFile {
  name: string
  type: string
  size: number
  arrayBuffer: ArrayBuffer
  /** WeChat mini program temp file path */
  tempFilePath?: string
}
