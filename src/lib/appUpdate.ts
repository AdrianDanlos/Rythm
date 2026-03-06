import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { t } from 'i18next'
import { toast } from 'sonner'
import { PLAY_STORE_APP_URL } from './constants'

type UpdateManifest = {
  androidLatestVersion?: string
  androidLatest?: string
}

const SHOULD_FORCE_SHOW_UPDATE_PROMPT = import.meta.env.VITE_FORCE_UPDATE_TOAST === 'true'

function compareVersions(currentVersion: string, latestVersion: string): number {
  const currentParts = currentVersion.split('.').map(part => Number(part) || 0)
  const latestParts = latestVersion.split('.').map(part => Number(part) || 0)
  const maxLength = Math.max(currentParts.length, latestParts.length)

  for (let i = 0; i < maxLength; i += 1) {
    const current = currentParts[i] ?? 0
    const latest = latestParts[i] ?? 0
    if (current > latest) return 1
    if (current < latest) return -1
  }

  return 0
}

async function openPlayStore() {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: PLAY_STORE_APP_URL })
    return
  }
  window.open(PLAY_STORE_APP_URL, '_blank', 'noreferrer')
}

export async function checkForAndroidUpdate() {
  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  if (!SHOULD_FORCE_SHOW_UPDATE_PROMPT && !isAndroidNative) return

  const hostedManifestUrl = import.meta.env.VITE_ANDROID_UPDATE_MANIFEST_URL as string | undefined
  const manifestUrl = typeof window !== 'undefined'
    ? (hostedManifestUrl?.trim() || new URL('/app-version.json', window.location.origin).toString())
    : ''
  if (!manifestUrl) return

  try {
    const response = await fetch(manifestUrl, { cache: 'no-store' })

    if (!response.ok) return

    const payload = (await response.json()) as UpdateManifest
    const latestVersion = (payload.androidLatestVersion ?? payload.androidLatest ?? '').trim() || 'test-version'
    if (!latestVersion) return

    const installedVersion = isAndroidNative
      ? (await CapacitorApp.getInfo()).version
      : '0.0.0'

    if (!SHOULD_FORCE_SHOW_UPDATE_PROMPT && compareVersions(installedVersion, latestVersion) >= 0) return

    toast.message(t('updates.title'), {
      description: t('updates.description', { version: latestVersion }),
      action: {
        label: t('updates.updateNow'),
        onClick: () => {
          void openPlayStore()
        },
      },
      duration: 12000,
    })
  }
  catch {
    // Update checks should never disrupt app usage.
  }
}
