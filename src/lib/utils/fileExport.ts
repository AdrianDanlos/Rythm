// Mobile-first export helper.
// Uses Capacitor Filesystem + Share on native platforms, falls back to
// browser downloads when running on the web.
import { Capacitor } from '@capacitor/core'
import {
  Directory,
  Encoding,
  Filesystem,
} from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

type ExportFileOptions = {
  filename: string
  mimeType: string
  data: string | ArrayBuffer
  encoding?: Encoding
  /**
   * When true, `data` is base64-encoded binary (e.g. from jsPDF data URI).
   * Avoids huge ArrayBuffer→base64 conversion in JS (Android WebView can stack-overflow on spread).
   */
  dataIsBase64?: boolean
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Chunked conversion — never use spread on large subarrays (breaks Android WebView stack). */
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x2000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    const end = Math.min(i + chunk, bytes.length)
    let part = ''
    for (let j = i; j < end; j++) part += String.fromCharCode(bytes[j])
    binary += part
  }
  return btoa(binary)
}

const base64ToBlob = (base64: string, mimeType: string) => {
  const bin = atob(base64)
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

export const exportFile = async ({
  filename,
  mimeType,
  data,
  encoding,
  dataIsBase64,
}: ExportFileOptions) => {
  if (!Capacitor.isNativePlatform()) {
    const blob = dataIsBase64 && typeof data === 'string'
      ? base64ToBlob(data, mimeType)
      : data instanceof ArrayBuffer
        ? new Blob([data], { type: mimeType })
        : new Blob([data], { type: mimeType })
    downloadBlob(blob, filename)
    return
  }

  const writeData = typeof data === 'string'
    ? data
    : arrayBufferToBase64(data)

  const isUtf8Text = typeof data === 'string' && !dataIsBase64

  await Filesystem.writeFile({
    path: filename,
    data: writeData,
    directory: Directory.Documents,
    encoding: isUtf8Text ? encoding : undefined,
  })

  const { uri } = await Filesystem.getUri({
    directory: Directory.Documents,
    path: filename,
  })

  // File-only share: mixing EXTRA_TEXT + PDF breaks some Android share targets.
  await Share.share({
    title: filename,
    files: [uri],
    dialogTitle: 'Share export',
  })
}
