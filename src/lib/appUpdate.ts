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
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return

  const manifestUrl = typeof window !== 'undefined'
    ? new URL('/app-version.json', window.location.origin).toString()
    : ''
  if (!manifestUrl) return

  try {
    const [{ version: installedVersion }, response] = await Promise.all([
      CapacitorApp.getInfo(),
      fetch(manifestUrl, { cache: 'no-store' }),
    ])

    if (!response.ok) return

    const payload = (await response.json()) as UpdateManifest
    const latestVersion = (payload.androidLatestVersion ?? payload.androidLatest ?? '').trim()
    if (!latestVersion) return

    if (compareVersions(installedVersion, latestVersion) >= 0) return

    const lastPromptedVersion = window.localStorage.getItem(STORAGE_KEYS.UPDATE_LAST_PROMPTED_VERSION)
    if (lastPromptedVersion === latestVersion) return

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

    window.localStorage.setItem(STORAGE_KEYS.UPDATE_LAST_PROMPTED_VERSION, latestVersion)
  }
  catch {
    // Update checks should never disrupt app usage.
  }
}
