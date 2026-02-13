export enum Tabs {
  Insights = 'insights',
  Log = 'log',
  Summary = 'summary',
  Charts = 'charts',
  Data = 'data',
}

export type TabKey = Tabs.Insights | Tabs.Log
export type InsightsSection = Tabs.Summary | Tabs.Charts | Tabs.Data
