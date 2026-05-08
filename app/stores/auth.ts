import { ROUTE_LIST } from '~/constants/routeList'

/** Narrow session user for subscription / company fields without `any`. */
interface UserCompanyCredits {
  company?: {
    kra_pin?: unknown
    current_subscription?: {
      status?: string
      add_employee_credit?: unknown
      job_posting_credit?: unknown
    }
  }
}

export const useAuthStore = () => {
  const {
    session,
    token,
    isAuthenticated,
    setAuthTokens,
    setUser,
    setAuthMethod,
    setOtpSession,
    clearOtpSession,
    setFromRoute,
    logout
  } = useAuthSession()

  const { affiliateState, setAffiliateCode, setAffiliateActive } = useAffiliateState()
  const { resetSessionTimeoutState } = useSessionTimeoutState()

  const show_signup = useState<boolean>('kq-auth-show-signup', () => false)
  const payment_section = useState<boolean>('kq-auth-payment-section', () => false)
  const freePost = useState<boolean>('kq-auth-free-post', () => false)
  const activeTab = useState<string>('kq-auth-active-tab', () => '')
  const selected = useState<string>('kq-auth-selected', () => '')
  const isSidebarOpen = useState<boolean>('kq-auth-sidebar-open', () => true)
  const email = useState<string>('kq-auth-email', () => '')
  const password = useState<string>('kq-auth-password', () => '')
  const approvers = useState<unknown[]>('kq-auth-approvers', () => [])

  const user = computed({
    get: () => session.value.user || {},
    set: (value: Record<string, unknown>) => setUser(value)
  })

  const authMethod = computed({
    get: () => session.value.authMethod,
    set: (value: 'password' | 'whmcs_sso' | 'impersonation') => setAuthMethod(value)
  })

  const otp_email = computed({
    get: () => session.value.otpEmail,
    set: (value: string) => {
      setOtpSession({
        email: value,
        sessionId: session.value.otpSessionId,
        expiry: session.value.otpExpiry
      })
    }
  })

  const otp_session_id = computed({
    get: () => session.value.otpSessionId,
    set: (value: string) => {
      setOtpSession({
        email: session.value.otpEmail,
        sessionId: value,
        expiry: session.value.otpExpiry
      })
    }
  })

  const otp_expiry = computed({
    get: () => session.value.otpExpiry,
    set: (value: string | null) => {
      setOtpSession({
        email: session.value.otpEmail,
        sessionId: session.value.otpSessionId,
        expiry: value
      })
    }
  })

  const from_route = computed({
    get: () => session.value.fromRoute,
    set: (value: string | null) => setFromRoute(value)
  })

  const isRedirected = computed({
    get: () => session.value.isRedirected,
    set: (value: boolean) => {
      const { setRedirected } = useAuthSession()
      setRedirected(value)
    }
  })

  const isAffiliateActive = computed(() => affiliateState.value.isAffiliateActive)
  const affiliateCode = computed(() => affiliateState.value.affiliateCode)

  const currentSubscription = computed(
    () => (user.value as UserCompanyCredits).company?.current_subscription
  )
  const isSubscriptionActive = computed(
    () => (user.value as UserCompanyCredits).company?.current_subscription?.status === 'ACTIVE'
  )

  function subscriptionCreditRemaining(raw: unknown): number | null {
    if (raw == null || raw === '') {
      return null
    }
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(n)) {
      return null
    }
    return n
  }

  const isEmployeeLimitReached = computed(() => {
    const credit = subscriptionCreditRemaining(
      (user.value as UserCompanyCredits).company?.current_subscription?.add_employee_credit
    )
    if (credit == null) {
      return false
    }
    return credit < 1
  })

  const isJobPostLimitReached = computed(() => {
    const credit = subscriptionCreditRemaining(
      (user.value as UserCompanyCredits).company?.current_subscription?.job_posting_credit
    )
    if (credit == null) {
      return false
    }
    return credit < 1
  })

  const isPayrollSetup = computed(() => Boolean((user.value as UserCompanyCredits).company?.kra_pin))

  const setOTPSessionAndEmail = (emailValue: string, sessionId: string) => {
    setOtpSession({
      email: emailValue,
      sessionId,
      expiry: session.value.otpExpiry
    })
  }

  const setOTPExpiry = (expiry: string) => {
    setOtpSession({
      email: session.value.otpEmail,
      sessionId: session.value.otpSessionId,
      expiry
    })
  }

  const setPaymentSection = (value: boolean) => {
    payment_section.value = value
  }

  const updateFreePost = (value: boolean) => {
    freePost.value = value
  }

  const deactivateAffiliateAccount = () => {
    setAffiliateCode(null)
    setAffiliateActive(false)
  }

  const setAffiliateActiveState = (id: string) => {
    setAffiliateCode(id)
    setAffiliateActive(!affiliateState.value.isAffiliateActive)
  }

  const showSignUp = (value: boolean) => {
    show_signup.value = value
  }

  const logOut = async () => {
    await logout()
    resetSessionTimeoutState()
    clearNuxtState()
    await navigateTo(ROUTE_LIST.auth.login)
  }

  return {
    user,
    authMethod,
    isAuthenticated,
    otp_email,
    otp_session_id,
    otp_expiry,
    token,
    from_route,
    show_signup,
    payment_section,
    isAffiliateActive,
    affiliateCode,
    freePost,
    activeTab,
    selected,
    isSidebarOpen,
    isRedirected,
    email,
    password,
    approvers,
    currentSubscription,
    isSubscriptionActive,
    isEmployeeLimitReached,
    isJobPostLimitReached,
    isPayrollSetup,
    setAuthMethod,
    setOTPSessionAndEmail,
    setOTPExpiry,
    clearOTPData: clearOtpSession,
    setPaymentSection,
    updateFreePost,
    deactivateAffiliateAccount,
    setAffiliateActive: setAffiliateActiveState,
    showSignUp,
    setFromRoute,
    setAuthTokens,
    logOut
  }
}
