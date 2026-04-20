/** Must match the key passed to `useState` in `useAuthSession`. */
export const AUTH_SESSION_STATE_KEY = 'kq-auth-session' as const

/** Persists login OTP context so reload keeps the same server expiry countdown. */
export const OTP_SESSION_STORAGE_KEY = 'kq-otp-inline-session' as const

/** Persists signup verify step expiry so reload does not reset the timer. */
export const REGISTRATION_VERIFY_EXPIRY_STORAGE_KEY = 'kq-registration-verify-expiry' as const
