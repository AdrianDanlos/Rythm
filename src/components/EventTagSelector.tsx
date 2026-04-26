import classNames from 'classnames'
import type { RefObject } from 'react'
import { getFallbackTagColor } from '../lib/colors'
import { getHighContrastTextColor } from '../lib/utils/colorContrast'

export type EventTagOption = {
  key: string
  label: string
}

type EventTagSelectorProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  searchAriaLabel: string
  options: EventTagOption[]
  selectedKeys: Set<string>
  onToggleOption: (option: EventTagOption) => void
  tagColors: Record<string, string>
  noSuggestionsText?: string
  disabled?: boolean
  inputRef?: RefObject<HTMLInputElement | null>
  inputMaxLength?: number
  maxVisibleOptions?: number
  isOptionDisabled?: (option: EventTagOption, isSelected: boolean) => boolean
  createSuggestion?: {
    label: string
    actionLabel: string
    ariaLabel?: string
    onClick: () => void
  }
  listAboveInput?: boolean
  onSubmitSearch?: () => void
}

export const EventTagSelector = ({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  options,
  selectedKeys,
  onToggleOption,
  tagColors,
  noSuggestionsText,
  disabled = false,
  inputRef,
  inputMaxLength,
  maxVisibleOptions,
  isOptionDisabled,
  createSuggestion,
  listAboveInput = false,
  onSubmitSearch,
}: EventTagSelectorProps) => {
  const visibleOptions = maxVisibleOptions != null
    ? options.slice(0, maxVisibleOptions)
    : options

  const inputBlock = (
    <div className="event-tag-selector-input-wrap">
      <div className="timeline-filter-tag-search">
        <input
          ref={inputRef}
          type="search"
          className="tag-dropdown-trigger log-reflection-input"
          value={searchValue}
          onChange={event => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            onSubmitSearch?.()
          }}
          placeholder={searchPlaceholder}
          aria-label={searchAriaLabel}
          maxLength={inputMaxLength}
          disabled={disabled}
        />
      </div>
      {createSuggestion && (
        <div
          className={classNames('event-tag-selector-create-suggestions', {
            'event-tag-selector-create-suggestions--top': listAboveInput,
          })}
          role="listbox"
        >
          <button
            type="button"
            className="tag-suggestion tag-suggestion--creatable"
            aria-label={createSuggestion.ariaLabel}
            onMouseDown={event => event.preventDefault()}
            onClick={createSuggestion.onClick}
          >
            <span className="tag-suggestion-label">{createSuggestion.label}</span>
            <span className="tag-suggestion-action">{createSuggestion.actionLabel}</span>
          </button>
        </div>
      )}
    </div>
  )

  const listBlock = (
    <div className="timeline-filter-tags-fade-wrap">
      <div className="timeline-filter-tags-scroll">
        <div className="timeline-filter-tags-wrap">
          {visibleOptions.length > 0
            ? visibleOptions.map((option, index) => {
                const isSelected = selectedKeys.has(option.key)
                const isDisabled = disabled || isOptionDisabled?.(option, isSelected) === true
                const effectiveTagColor = tagColors[option.key] ?? getFallbackTagColor(option.key)
                const textColor = getHighContrastTextColor(effectiveTagColor)
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={classNames('timeline-filter-tag-option', {
                      'active': isSelected,
                      'tag-pill': isSelected,
                    })}
                    data-color-index={index % 8}
                    style={
                      isSelected
                        ? { backgroundColor: effectiveTagColor, color: textColor, borderColor: 'transparent' }
                        : undefined
                    }
                    onClick={() => onToggleOption(option)}
                    disabled={isDisabled}
                  >
                    #
                    {option.label}
                    {isSelected && (
                      <span className="timeline-filter-tag-option-remove-hint" aria-hidden>
                        ×
                      </span>
                    )}
                  </button>
                )
              })
            : noSuggestionsText
              ? <span className="tag-suggestions-empty">{noSuggestionsText}</span>
              : null}
        </div>
      </div>
    </div>
  )

  return listAboveInput
    ? (
        <>
          {listBlock}
          {inputBlock}
        </>
      )
    : (
        <>
          {inputBlock}
          {listBlock}
        </>
      )
}
