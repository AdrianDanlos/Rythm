import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { t } from 'i18next'
import { toast } from 'sonner'
import { PLAY_STORE_APP_URL } from './constants'
import { STORAGE_KEYS } from './storageKeys'

type UpdateManifest = {
  androidLatestVersion?: string
  androidLatest?: string
}

// Temporary testing override: always show update prompt when check runs.
const FORCE_SHOW_UPDATE_PROMPT_FOR_TESTING = true

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
  if (!FORCE_SHOW_UPDATE_PROMPT_FOR_TESTING && !isAndroidNative) return

  const manifestUrl = typeof window !== 'undefined'
    ? new URL('/app-version.json', window.location.origin).toString()
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

    if (!FORCE_SHOW_UPDATE_PROMPT_FOR_TESTING && compareVersions(installedVersion, latestVersion) >= 0) return

    if (!FORCE_SHOW_UPDATE_PROMPT_FOR_TESTING) {
      const lastPromptedVersion = window.localStorage.getItem(STORAGE_KEYS.UPDATE_LAST_PROMPTED_VERSION)
      if (lastPromptedVersion === latestVersion) return
    }

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

    if (!FORCE_SHOW_UPDATE_PROMPT_FOR_TESTING) {
      window.localStorage.setItem(STORAGE_KEYS.UPDATE_LAST_PROMPTED_VERSION, latestVersion)
    }
  }
  catch {
    // Update checks should never disrupt app usage.
  }
}
