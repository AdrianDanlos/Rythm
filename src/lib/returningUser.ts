import { AppPage } from './appTabs'
import { STORAGE_KEYS } from './storageKeys'

export function getReturningUserStorageKey(userId: string): string {
  return `${STORAGE_KEYS.RETURNING_USER}:${userId}`
}

export function isReturningUser(userId?: string): boolean {
  if (!userId) {
    return false
  }

  try {
    return window.localStorage.getItem(getReturningUserStorageKey(userId)) === 'true'
  }
  catch {
    return false
  }
}

export function getDefaultPageForUser(userId?: string): AppPage {
  return isReturningUser(userId) ? AppPage.Summary : AppPage.Log
}
