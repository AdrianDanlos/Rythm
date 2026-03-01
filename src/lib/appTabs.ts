export enum Tabs {
  Insights = 'insights',
  Log = 'log',
  Summary = 'summary',
  Charts = 'charts',
  Data = 'data',
}

export type TabKey = Tabs.Insights | Tabs.Log
export type InsightsSection = Tabs.Summary | Tabs.Charts | Tabs.Data

export enum AppPage {
  Summary = 'summary',
  Charts = 'charts',
  Export = 'export',
  Log = 'log',
}

export const APP_PAGE_PATHS: Record<AppPage, string> = {
  [AppPage.Log]: '/log',
  [AppPage.Summary]: '/summary',
  [AppPage.Charts]: '/charts',
  [AppPage.Export]: '/export',
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

  if (insightsTab === Tabs.Data) {
    return AppPage.Export
  }

  return AppPage.Summary
}

export function getInsightsSectionForPage(page: AppPage): InsightsSection {
  if (page === AppPage.Charts) {
    return Tabs.Charts
  }

  if (page === AppPage.Export) {
    return Tabs.Data
  }

  return Tabs.Summary
}

export function getTabForPage(page: AppPage): TabKey {
  return page === AppPage.Log ? Tabs.Log : Tabs.Insights
}
