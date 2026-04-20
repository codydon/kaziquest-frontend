/**
 * Client-side API contracts inferred from `kaziquest-employer-nuxt` usage.
 * Backend may return additional fields; treat these as minimum expectations for the UI.
 */

/** Query params for `GET timeoffs/leaves/leave-requests` (legacy `params` / Nuxt `query`). */
export interface TimeOffLeaveRequestsQuery {
  page?: number
  page_size?: number
  search?: string
  status?: string
  paginate?: boolean | string
}

/** Typical paginated list envelope (exact keys vary by backend version). */
export interface TimeOffPaginated<T> {
  results?: T[]
  count?: number
  current_page?: number
  current_page_count?: number
  status_counts?: Record<string, number>
}

/** `POST timeoffs/leaves/` — employer builds `FormData` with these keys for day-based leave. */
export interface TimeOffApplyLeaveFormDataKeys {
  employee: string
  category: string
  start_date: string
  end_date: string
  leave_type: 'days'
  duration_type: 'fullday'
  full_days_count: string
  half_days_count: string
  day_selections: string
  note: string
}

/** `POST timeoffs/leaves/calculate-requested-days/` body (edit + preview flows). */
export interface TimeOffCalculateDaysBody {
  start_date: string
  end_date: string
  category: string
  leave_type: 'days' | 'hours'
  duration_type: string
  day_selections: Record<string, string>
  start_time: string | null
  end_time: string | null
}

/** `PATCH timeoffs/leave-balances/:id/` — legacy overload supports `(available_balance, id, reason)`. */
export interface TimeOffBalancePatchBody {
  available_balance: number
  reason: string
}
