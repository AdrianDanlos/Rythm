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
