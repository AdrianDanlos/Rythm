import { type RefObject } from 'react'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import type { TFunction } from 'i18next'
import { Info, Tags } from 'lucide-react'
import { MAX_TAG_LENGTH } from '../../lib/utils/stringUtils'
import { EventTagSelector, type EventTagOption } from '../EventTagSelector'
import { Tooltip } from '../Tooltip'

type LogFormTagsPageProps = {
  tagInputValue: string
  setTagInputValue: (value: string) => void
  atMaxTags: boolean
  maxTagsPerEntry: number
  visibleTagOptions: EventTagOption[]
  usedTagSet: Set<string>
  toggleTagOption: (option: EventTagOption) => void
  tagColors: Record<string, string> | undefined
  tagInputRef: RefObject<HTMLInputElement | null>
  showCreateTagSuggestion: boolean
  addTag: (tag: string) => void
  hasAtLeastOneEvent: boolean
  isFirstEntry: boolean
  onNext: () => void
  onSkip: () => void
  isSaving: boolean
  isDoneSaving: boolean
  t: TFunction
}

export function LogFormTagsPage({
  tagInputValue,
  setTagInputValue,
  atMaxTags,
  maxTagsPerEntry,
  visibleTagOptions,
  usedTagSet,
  toggleTagOption,
  tagColors,
  tagInputRef,
  showCreateTagSuggestion,
  addTag,
  hasAtLeastOneEvent,
  isFirstEntry,
  onNext,
  onSkip,
  isSaving,
  isDoneSaving,
  t,
}: LogFormTagsPageProps) {
  const handleNext = () => {
    if (isSaving) return
    onNext()
  }

  const handleSkip = () => {
    if (isSaving) return
    onSkip()
  }

  return (
    <div className="log-form-carousel__reflection-land">
      <div className="log-form-carousel__reflection-cluster">
        <div className="log-reflection-card log-reflection-block">
          <header className="log-reflection-header">
            <div className={classNames('log-reflection-icon', 'log-reflection-icon--tags')} aria-hidden="true">
              <Tags size={28} strokeWidth={2} />
            </div>
            <div className="log-reflection-title-wrap">
              <h2 className="log-reflection-title log-reflection-title--with-tip">
                {t('log.journalPageTitle')}
                <Tooltip label={t('log.eventsTooltip')}>
                  <span className="tooltip-trigger log-reflection-title-tip">
                    <span className="tooltip-icon" aria-hidden="true">
                      <Info size={14} />
                    </span>
                  </span>
                </Tooltip>
              </h2>
            </div>
          </header>

          <div className="field log-reflection-tags">
            <div className="tag-control-row tag-control-row--reflection">
              <div className="tag-dropdown-wrap">
                <EventTagSelector
                  searchValue={tagInputValue}
                  onSearchChange={value => setTagInputValue(value.slice(0, MAX_TAG_LENGTH))}
                  searchPlaceholder={atMaxTags ? t('log.maxReached', { count: maxTagsPerEntry }) : t('insights.timelineFilters.searchEvents')}
                  searchAriaLabel={t('insights.timelineFilters.searchEvents')}
                  options={visibleTagOptions}
                  selectedKeys={usedTagSet}
                  onToggleOption={toggleTagOption}
                  tagColors={tagColors ?? {}}
                  inputRef={tagInputRef}
                  inputMaxLength={MAX_TAG_LENGTH}
                  isOptionDisabled={(_, isSelected) => atMaxTags && !isSelected}
                  listAboveInput
                  onSubmitSearch={() => {
                    if (atMaxTags) return
                    if (!tagInputValue.trim()) return
                    addTag(tagInputValue)
                  }}
                  createSuggestion={
                    showCreateTagSuggestion
                      ? {
                          label: `#${tagInputValue.trim()}`,
                          actionLabel: t('log.addTagOption'),
                          ariaLabel: t('log.addTagOption'),
                          onClick: () => addTag(tagInputValue),
                        }
                      : undefined
                  }
                />
              </div>
            </div>
          </div>

        </div>
        <motion.div className="log-form-carousel__actions log-form-carousel__actions--reflection-tight">
          <button
            type="button"
            className="ghost log-form-carousel__skip"
            onClick={handleSkip}
          >
            {isDoneSaving ? t('log.saving') : t('log.carouselDone')}
            {isDoneSaving && <span className="spinner log-form-carousel__saving-spinner" aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="save-button log-form-carousel__primary"
            onClick={handleNext}
            disabled={isFirstEntry && !hasAtLeastOneEvent}
          >
            {t('log.carouselNext')}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
