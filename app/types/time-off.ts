/** Shapes used by leave request detail / timeline / comments (ported from legacy employer UI). */
export interface TimeOffLeaveComment {
  id?: string
  comment?: string
  created_at?: string
  leave?: string
  commented_by?: {
    id: string
    full_name: string
  }
}

export interface TimeOffLeaveTimelineEvent {
  id: string
  leave: string
  event_type: string
  from_status?: string | null
  to_status?: string | null
  actor_user_id?: string | null
  actor_name?: string | null
  actor_role?: string | null
  reason?: string | null
  metadata?: Record<string, unknown>
  created_at: string
}
