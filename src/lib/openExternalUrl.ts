import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

/**
 * Opens a URL in the system browser on native (Custom Tabs) or a new tab on web.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url })
    return
  }
  window.open(url, '_blank', 'noreferrer')
}
