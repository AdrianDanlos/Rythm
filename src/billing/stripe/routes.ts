/** Stripe (web) checkout and return routes. */
export const ROUTES = {
  privacyPage: '/privacy',
  deleteAccountPage: '/delete-account',
  stripeSuccess: '/success',
  stripeCancel: '/cancel',
} as const

export const isPrivacyPage = (pathname = window.location.pathname) =>
  pathname === ROUTES.privacyPage

export const isDeleteAccountPage = (pathname = window.location.pathname) =>
  pathname === ROUTES.deleteAccountPage

export const isStripeReturn = (pathname = window.location.pathname) =>
  pathname === ROUTES.stripeSuccess || pathname === ROUTES.stripeCancel
