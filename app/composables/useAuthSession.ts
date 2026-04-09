import type { AuthMethod, AuthSessionState, AuthUser } from '~/types'

const AUTH_SESSION_STATE_KEY = 'kq-auth-session'
const ACCESS_TOKEN_COOKIE = 'access'
const REFRESH_TOKEN_COOKIE = 'refresh'

function createDefaultAuthSessionState(): AuthSessionState {
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
  refreshToken?: string | null
}

export const useAuthSession = () => {
  const config = useRuntimeConfig()
  const isSecureCookie = Boolean(config.public.apiBase?.startsWith('https://'))

  const authSession = useState<AuthSessionState>(AUTH_SESSION_STATE_KEY, createDefaultAuthSessionState)

  const accessToken = useCookie<string | null>(ACCESS_TOKEN_COOKIE, {
    path: '/',
    sameSite: 'lax',
    secure: isSecureCookie,
    maxAge: 60 * 60 * 24 * 7,
    default: () => null
  })

  const refreshToken = useCookie<string | null>(REFRESH_TOKEN_COOKIE, {
    path: '/',
    sameSite: 'lax',
    secure: isSecureCookie,
    maxAge: 60 * 60 * 24 * 365,
    default: () => null
  })

  const effectiveAccessToken = computed(() => accessToken.value)
  const effectiveRefreshToken = computed(() => refreshToken.value)

  const hasStoredUser = computed(() => {
    const user = authSession.value.user
    return Boolean(user && Object.keys(user).length > 0)
  })

  const isAuthenticated = computed(() => Boolean(effectiveAccessToken.value && hasStoredUser.value))

  const setAuthTokens = (tokens: AuthTokenPair) => {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken ?? null
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
  }

  const clearOtpSession = () => {
    authSession.value.otpEmail = ''
    authSession.value.otpSessionId = ''
    authSession.value.otpExpiry = null
  }

  const setFromRoute = (fromRoute: string | null) => {
    authSession.value.fromRoute = fromRoute
  }

  const setRedirected = (value: boolean) => {
    authSession.value.isRedirected = value
  }

  const clearSession = () => {
    accessToken.value = null
    refreshToken.value = null
    authSession.value = createDefaultAuthSessionState()
  }

  return {
    session: readonly(authSession),
    token: readonly(effectiveAccessToken),
    refreshToken: readonly(effectiveRefreshToken),
    isAuthenticated,
    setAuthTokens,
    setUser,
    setAuthMethod,
    setOtpSession,
    clearOtpSession,
    setFromRoute,
    setRedirected,
    clearSession
  }
}