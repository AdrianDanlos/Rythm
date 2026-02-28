import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import es from './locales/es'

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_STORAGE_KEY = 'languagePreference'

const normalizeLng = (raw: string | undefined): SupportedLanguage => {
  const short = raw?.toLowerCase().split('-')[0]
  return short === 'es' ? 'es' : 'en'
}

const stored = typeof window !== 'undefined'
  ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? undefined
  : undefined
const detected = typeof navigator !== 'undefined'
  ? navigator.language
  : undefined

const initialLanguage = normalizeLng(stored ?? detected)

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
      convertDetectedLanguage: lng => normalizeLng(String(lng)),
    },
    returnNull: false,
  })

export default i18n
