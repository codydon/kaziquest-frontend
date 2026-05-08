import type { AuthMethod, AuthSessionState, AuthUser } from '~/types'
import { AUTH_SESSION_STATE_KEY, OTP_SESSION_STORAGE_KEY } from '~/constants/authPersistence'

const AUTH_SESSION_HYDRATED_KEY = 'kq-auth-session-hydrated'
const AUTH_SESSION_HYDRATING_KEY = 'kq-auth-session-hydrating'
const ACCESS_TOKEN_COOKIE = 'access'

function persistOtpSessionSnapshot(snapshot: AuthSessionState) {
  if (typeof window === 'undefined') {
    return
  }

  if (!snapshot.otpSessionId) {
    sessionStorage.removeItem(OTP_SESSION_STORAGE_KEY)
    return
  }

  sessionStorage.setItem(
    OTP_SESSION_STORAGE_KEY,
    JSON.stringify({
      email: snapshot.otpEmail,
      sessionId: snapshot.otpSessionId,
      expiry: snapshot.otpExpiry
    })
  )
}

function clearPersistedOtpSession() {
  if (typeof window === 'undefined') {
    return
  }
  sessionStorage.removeItem(OTP_SESSION_STORAGE_KEY)
}

export function createDefaultAuthSessionState(): AuthSessionState {
  return {
    user: null,
    authMethod: 'password',
    otpEmail: '',
    otpSessionId: '',
    otpExpiry: null,
    fromRoute: null,
    isRedirected: false
  }
}

export interface AuthTokenPair {
  accessToken: string | null
}

export const useAuthSession = () => {
  const config = useRuntimeConfig()
  const isSecureCookie = Boolean(config.public.apiBase?.startsWith('https://'))
  const apiBase = useBaseUrl()
  const accessTokenMaxAgeSeconds = Number(config.public.authAccessTokenMaxAgeSeconds ?? 60 * 15)

  const authSession = useState<AuthSessionState>(AUTH_SESSION_STATE_KEY, createDefaultAuthSessionState)
  const isHydrating = useState<boolean>(AUTH_SESSION_HYDRATING_KEY, () => typeof window !== 'undefined')
  const hasHydrated = useState<boolean>(AUTH_SESSION_HYDRATED_KEY, () => typeof window === 'undefined')

  const accessToken = useCookie<string | null>(ACCESS_TOKEN_COOKIE, {
    path: '/',
    sameSite: 'lax',
    secure: isSecureCookie,
    maxAge: accessTokenMaxAgeSeconds,
    default: () => null
  })

  const effectiveAccessToken = computed(() => accessToken.value)

  const hasStoredUser = computed(() => {
    const user = authSession.value.user
    return Boolean(user && Object.keys(user).length > 0)
  })

  const isAuthenticated = computed(() => Boolean(effectiveAccessToken.value && hasStoredUser.value))

  const setAuthTokens = (tokens: AuthTokenPair) => {
    accessToken.value = tokens.accessToken
  }

  const setUser = (user: AuthUser | null) => {
    authSession.value.user = user
  }

  const setAuthMethod = (method: AuthMethod) => {
    authSession.value.authMethod = method
  }

  const setOtpSession = (payload: { email: string; sessionId: string; expiry?: string | null }) => {
    authSession.value.otpEmail = payload.email
    authSession.value.otpSessionId = payload.sessionId
    authSession.value.otpExpiry = payload.expiry ?? null
    persistOtpSessionSnapshot(authSession.value)
  }

  const clearOtpSession = () => {
    authSession.value.otpEmail = ''
    authSession.value.otpSessionId = ''
    authSession.value.otpExpiry = null
    clearPersistedOtpSession()
  }

  const setFromRoute = (fromRoute: string | null) => {
    authSession.value.fromRoute = fromRoute
  }

  const setRedirected = (value: boolean) => {
    authSession.value.isRedirected = value
  }

  const clearSession = () => {
    accessToken.value = null
    clearPersistedOtpSession()
    authSession.value = createDefaultAuthSessionState()
  }

  const beginHydration = () => {
    isHydrating.value = true
  }

  const finishHydration = () => {
    isHydrating.value = false
    hasHydrated.value = true
  }

  const revokeRefreshToken = async () => {
    try {
      await useApi(`${apiBase}/accounts/logout/`, {
        handler: '$fetch',
        method: 'POST',
        secured: true,
        credentials: 'include'
      })
    } catch {
      // Logout should still succeed locally even if the revocation API fails.
    }
  }

  const logout = async () => {
    clearSession()
    await revokeRefreshToken()
  }

  return {
    session: readonly(authSession),
    token: readonly(effectiveAccessToken),
    isHydrating: readonly(isHydrating),
    hasHydrated: readonly(hasHydrated),
    isAuthenticated,
    setAuthTokens,
    setUser,
    setAuthMethod,
    setOtpSession,
    clearOtpSession,
    setFromRoute,
    setRedirected,
    clearSession,
    beginHydration,
    finishHydration,
    logout
  }
}