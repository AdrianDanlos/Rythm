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

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export const exportFile = async ({
  filename,
  mimeType,
  data,
  encoding,
}: ExportFileOptions) => {
  if (!Capacitor.isNativePlatform()) {
    const blob = data instanceof ArrayBuffer
      ? new Blob([data], { type: mimeType })
      : new Blob([data], { type: mimeType })
    downloadBlob(blob, filename)
    return
  }

  const writeData = typeof data === 'string'
    ? data
    : arrayBufferToBase64(data)

  await Filesystem.writeFile({
    path: filename,
    data: writeData,
    directory: Directory.Documents,
    encoding: typeof data === 'string' ? encoding : undefined,
  })

  const { uri } = await Filesystem.getUri({
    directory: Directory.Documents,
    path: filename,
  })

  await Share.share({
    title: filename,
    text: 'Rythm export',
    url: uri,
    files: [uri],
    dialogTitle: 'Share export',
  })
}
