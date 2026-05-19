import type { TagDriver, TagSleepDriver } from '../types/stats'

/**
 * Synthetic event correlations for the Events insights tab when the user has
 * too few entries or no real tag drivers yet. Two tags per mood sign and per
 * sleep sign (free tier: no extra “locked” pills).
 */
export function getTagInsightsPreviewData(
  t: (key: string) => string,
): { tagDrivers: TagDriver[], tagSleepDrivers: TagSleepDriver[] } {
  const tagDrivers: TagDriver[] = [
    {
      tag: t('insights.tagPreview.morningWalk'),
      count: 12,
      moodWith: 4.1,
      moodWithout: 3.25,
      delta: 0.85,
    },
    {
      tag: t('insights.tagPreview.socialPlans'),
      count: 9,
      moodWith: 3.9,
      moodWithout: 3.35,
      delta: 0.55,
    },
    {
      tag: t('insights.tagPreview.lateNightScreen'),
      count: 14,
      moodWith: 2.75,
      moodWithout: 3.55,
      delta: -0.8,
    },
    {
      tag: t('insights.tagPreview.stressDeadline'),
      count: 10,
      moodWith: 2.6,
      moodWithout: 3.5,
      delta: -0.9,
    },
  ]

  const tagSleepDrivers: TagSleepDriver[] = [
    {
      tag: t('insights.tagPreview.morningWalk'),
      count: 12,
      sleepWith: 7.4,
      sleepWithout: 6.75,
      delta: 0.65,
    },
    {
      tag: t('insights.tagPreview.socialPlans'),
      count: 9,
      sleepWith: 7.2,
      sleepWithout: 6.82,
      delta: 0.38,
    },
    {
      tag: t('insights.tagPreview.lateNightScreen'),
      count: 14,
      sleepWith: 5.65,
      sleepWithout: 7.05,
      delta: -1.4,
    },
    {
      tag: t('insights.tagPreview.stressDeadline'),
      count: 10,
      sleepWith: 6.05,
      sleepWithout: 6.95,
      delta: -0.9,
    },
  ]

  return { tagDrivers, tagSleepDrivers }
}
