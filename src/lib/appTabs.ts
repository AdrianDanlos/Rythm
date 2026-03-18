export enum Tabs {
  Insights = 'insights',
  Log = 'log',
  Summary = 'summary',
  Charts = 'charts',
  Events = 'events',
}

export type TabKey = Tabs.Insights | Tabs.Log
export type InsightsSection = Tabs.Summary | Tabs.Charts | Tabs.Events

export enum AppPage {
  Summary = 'summary',
  Charts = 'charts',
  Events = 'events',
  Log = 'log',
  Settings = 'settings',
  Pro = 'pro',
}

export const APP_PAGE_PATHS: Record<AppPage, string> = {
  [AppPage.Log]: '/log',
  [AppPage.Summary]: '/summary',
  [AppPage.Charts]: '/charts',
  [AppPage.Events]: '/events',
  [AppPage.Settings]: '/settings',
  [AppPage.Pro]: '/pro',
}

export function getPathForPage(page: AppPage): string {
  return APP_PAGE_PATHS[page]
}

export function getPageFromPathname(pathname: string): AppPage | null {
  const normalizedPath
    = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  const entry = Object.entries(APP_PAGE_PATHS).find(([, path]) => path === normalizedPath)
  return entry ? (entry[0] as AppPage) : null
}

export function getAppPage(tab: TabKey, insightsTab: InsightsSection): AppPage {
  if (tab === Tabs.Log) {
    return AppPage.Log
  }

  if (insightsTab === Tabs.Charts) {
    return AppPage.Charts
  }

  if (insightsTab === Tabs.Events) {
    return AppPage.Events
  }

  return AppPage.Summary
}

export function getInsightsSectionForPage(page: AppPage): InsightsSection {
  if (page === AppPage.Charts) {
    return Tabs.Charts
  }

  if (page === AppPage.Events) {
    return Tabs.Events
  }

  return Tabs.Summary
}

export function getTabForPage(page: AppPage): TabKey {
  if (page === AppPage.Log) return Tabs.Log
  if (page === AppPage.Pro) return Tabs.Insights
  return Tabs.Insights
}
