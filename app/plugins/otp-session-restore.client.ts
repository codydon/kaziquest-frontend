import type { AuthSessionState } from '~/types'
import {
  AUTH_SESSION_STATE_KEY,
  OTP_SESSION_STORAGE_KEY
} from '~/constants/authPersistence'
import { createDefaultAuthSessionState } from '~/composables/useAuthSession'

export default defineNuxtPlugin({
  name: 'kq-otp-session-restore',
  enforce: 'pre',
  setup() {
    if (import.meta.server) {
      return
    }

    const authSession = useState<AuthSessionState>(
      AUTH_SESSION_STATE_KEY,
      createDefaultAuthSessionState
    )

    if (authSession.value.otpSessionId) {
      return
    }

    try {
      const raw = sessionStorage.getItem(OTP_SESSION_STORAGE_KEY)
      if (!raw) {
        return
      }

      const data = JSON.parse(raw) as {
        email?: string
        sessionId?: string
        expiry?: string | null
      }

      if (typeof data.sessionId !== 'string' || !data.sessionId) {
        sessionStorage.removeItem(OTP_SESSION_STORAGE_KEY)
        return
      }

      authSession.value.otpEmail = typeof data.email === 'string' ? data.email : ''
      authSession.value.otpSessionId = data.sessionId
      authSession.value.otpExpiry = typeof data.expiry === 'string' ? data.expiry : null
    } catch {
      sessionStorage.removeItem(OTP_SESSION_STORAGE_KEY)
    }
  }
})
