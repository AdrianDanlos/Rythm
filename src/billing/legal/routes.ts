/** Static marketing / account routes (privacy, delete account). */
export const ROUTES = {
  privacyPage: '/privacy',
  deleteAccountPage: '/delete-account',
} as const

export const isPrivacyPage = (pathname = window.location.pathname) =>
  pathname === ROUTES.privacyPage

export const isDeleteAccountPage = (pathname = window.location.pathname) =>
  pathname === ROUTES.deleteAccountPage
