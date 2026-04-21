import { useState } from 'react'
import classNames from 'classnames'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { motionTransition } from '../lib/motion'
import { introThemedSvgMarkup } from '../lib/introThemedSvg'

type IntroCarouselProps = {
  onComplete: () => void
}

export const IntroCarousel = ({ onComplete }: IntroCarouselProps) => {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const slideTransition = reduceMotion ? { duration: 0 } : motionTransition

  const slides = [
    {
      title: t('intro.step1Title'),
      body: t('intro.step1Body'),
    },
    {
      title: t('intro.step2Title'),
      body: t('intro.step2Body'),
    },
    {
      title: t('intro.step3Title'),
      body: t('intro.step3Body'),
    },
  ] as const

  const isLastSlide = activeIndex === slides.length - 1

  return (
    <section className="intro-carousel" aria-label={t('intro.title')}>
      <header className="intro-carousel__hero">
        <h1 className="intro-carousel__hero-title">{t('intro.title')}</h1>
        <p className="intro-carousel__hero-subtitle">{t('intro.subtitle')}</p>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeIndex}
          className="intro-carousel__slide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={slideTransition}
        >
          <div className="intro-carousel__illustration-wrap" aria-hidden="true">
            {/* Local SVG markup; colors mapped to CSS variables in introThemedSvg.ts */}
            <div
              className="intro-carousel__illustration-svg"
              dangerouslySetInnerHTML={{ __html: introThemedSvgMarkup[activeIndex] }}
            />
          </div>

          <div className="intro-carousel__content">
            <h2 className="intro-carousel__title">{slides[activeIndex].title}</h2>
            <p className="intro-carousel__body">{slides[activeIndex].body}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="intro-carousel__pagination" aria-hidden="true">
        {slides.map((_, index) => (
          <span
            key={index}
            className={classNames('intro-carousel__dot', { 'is-active': index === activeIndex })}
          />
        ))}
      </div>

      <div className="intro-carousel__actions">
        <button
          type="button"
          className="ghost intro-carousel__button"
          onClick={onComplete}
        >
          {t('intro.skip')}
        </button>
        <button
          type="button"
          className="intro-carousel__button intro-carousel__button--primary"
          onClick={() => {
            if (isLastSlide) {
              onComplete()
              return
            }
            setActiveIndex(current => current + 1)
          }}
        >
          {isLastSlide ? t('intro.getStarted') : t('intro.next')}
        </button>
      </div>
    </section>
  )
}
