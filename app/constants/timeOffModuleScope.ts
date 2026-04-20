/**
 * Time Off module boundary (migration contract).
 * Primary list UX lives under `/time-off/requests` and `/time-off/balances`.
 * Company-wide category / calendar config uses `/settings#timeoffs` (legacy employer Settings → Time Off).
 * Employee profile tabs and HR reports are out of this module unless scope is explicitly widened.
 */
export const TIME_OFF_MODULE_ROUTES = {
  requests: '/time-off/requests',
  balances: '/time-off/balances',
  settings: '/settings#timeoffs',
  /** Legacy `/timeoff/leave-categories` style entry → company settings time off. */
  categoriesRedirect: '/settings#timeoffs',
} as const

export const TIME_OFF_SCOPE = {
  includesEmployeeProfileTab: false,
  includesHrLeaveReport: false,
  leaveCategoriesUi: 'settings_hash' as const,
  /** Log/history are not primary nav; use API or future reports if needed. */
  leaveLogHistory: 'out_of_nav' as const,
} as const
