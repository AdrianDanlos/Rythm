import {
  type ComponentType,
  type CSSProperties,
} from 'react'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import type { TFunction } from 'i18next'
import { Angry, Frown, Laugh, Meh, Smile, Sun } from 'lucide-react'

const MOOD_ICONS: Record<1 | 2 | 3 | 4 | 5, ComponentType<{ 'className'?: string, 'size'?: number, 'aria-hidden'?: boolean }>> = {
  1: Angry,
  2: Frown,
  3: Meh,
  4: Smile,
  5: Laugh,
}

type LogFormMoodPageProps = {
  mood: number | null
  moodColors: string[]
  onMoodChange: (value: number) => void
  saving: boolean
  onNext: () => void
  onSkip: () => void
  t: TFunction
}

export function LogFormMoodPage({
  mood,
  moodColors,
  onMoodChange,
  saving,
  onNext,
  onSkip,
  t,
}: LogFormMoodPageProps) {
  return (
    <div className="log-form-carousel__reflection-land">
      <div className="log-form-carousel__reflection-cluster">
        <div
          className={classNames('log-reflection-card', 'log-reflection-block', {
            'log-reflection-card--mood-selected': mood != null,
          })}
          style={
            mood != null
              ? ({
                  '--reflection-mood-tint': moodColors[mood - 1] ?? moodColors[2],
                  '--mood-aura-x': ['10%', '30%', '50%', '70%', '90%'][mood - 1]!,
                } as CSSProperties)
              : undefined
          }
        >
          <header className="log-reflection-header">
            <div className="log-reflection-icon" aria-hidden="true">
              <Sun size={28} strokeWidth={2} />
            </div>
            <h2 className="log-reflection-title">{t('log.reflectionTitle')}</h2>
            <p className="log-reflection-subtitle">{t('log.tip')}</p>
          </header>

          <div className="log-reflection-section log-reflection-section--mood">
            <div className="log-reflection-section-label">
              {t('log.sectionMood')}
            </div>
            <div className="mood-row" role="group" aria-label={t('log.moodQuestion')}>
              {([1, 2, 3, 4, 5] as const).map((value) => {
                const Icon = MOOD_ICONS[value]
                return (
                  <button
                    key={value}
                    type="button"
                    className={classNames('mood-button', { active: mood === value })}
                    onClick={() => onMoodChange(value)}
                    style={
                      {
                        '--mood-color': moodColors[value - 1],
                      } as CSSProperties
                    }
                    aria-pressed={mood === value}
                    aria-label={
                      [
                        t('log.moodName1'),
                        t('log.moodName2'),
                        t('log.moodName3'),
                        t('log.moodName4'),
                        t('log.moodName5'),
                      ][value - 1]!
                    }
                  >
                    <Icon className="mood-button-icon" size={26} aria-hidden />
                    <span className="mood-button-num">{value}</span>
                  </button>
                )
              })}
            </div>
            <p
              className={classNames('mood-selected-name', {
                'mood-selected-name--placeholder': mood == null,
              })}
              aria-live="polite"
            >
              {mood != null
                ? t(`log.moodName${mood}` as 'log.moodName1')
                : t('log.selectMoodHint')}
            </p>
          </div>
        </div>
        <motion.div className="log-form-carousel__actions">
          <button
            type="button"
            className="ghost log-form-carousel__skip"
            onClick={onSkip}
            disabled={saving}
          >
            {t('intro.skip')}
          </button>
          <button
            type="button"
            className="save-button log-form-carousel__primary"
            onClick={onNext}
            disabled={mood == null}
          >
            {t('intro.next')}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
