import { Trans } from 'react-i18next'
import { requestScrollToLogDailyEventsInput } from '../../hooks/useScrollToLogDailyEventsOnMount'

type NoDailyEventsLoggedHintProps = {
  onGoToLog: () => void
  className?: string
}

export const NoDailyEventsLoggedHint = ({
  onGoToLog,
  className = 'muted',
}: NoDailyEventsLoggedHintProps) => {
  const handleGoToLog = () => {
    requestScrollToLogDailyEventsInput()
    onGoToLog()
  }

  return (
    <p className={className}>
      <Trans
        i18nKey="insights.noDailyEventsLogged"
        components={{
          logLink: (
            <button
              type="button"
              className="link-button link-button--text"
              onClick={handleGoToLog}
            />
          ),
        }}
      />
    </p>
  )
}
