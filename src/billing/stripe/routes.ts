/** Stripe (web) checkout and return routes. */
export const ROUTES = {
  stripeLanding: '/stripe',
  stripeSuccess: '/success',
  stripeCancel: '/cancel',
} as const

export const isStripeLanding = (pathname = window.location.pathname) =>
  pathname === ROUTES.stripeLanding

export const isStripeReturn = (pathname = window.location.pathname) =>
  pathname === ROUTES.stripeSuccess || pathname === ROUTES.stripeCancel
