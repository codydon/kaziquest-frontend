<script setup lang="ts">
import { authService } from '~/services/auth.service'
import { ROUTE_LIST } from '~/constants/routeList'
import { parseApiError } from '~/utils/parseApiError'

definePageMeta({
  layout: 'auth',
  alias: ['/auth/OTP-verification']
})

const OTP_TTL_MS = 5 * 60 * 1000

const route = useRoute()
const toast = useToast()

const {
  session,
  setAuthTokens,
  setUser,
  setAuthMethod,
  clearOtpSession,
  setOtpSession
} = useAuthSession()
const { resetSessionTimeoutState } = useSessionTimeoutState()

const loading = ref(false)
const resendLoading = ref(false)
const otpError = ref<string | null>(null)

const otpSessionId = computed(() => session.value.otpSessionId)
const otpEmail = computed(() => session.value.otpEmail)
const otpExpiry = computed(() => session.value.otpExpiry)

const redirectPath = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect !== 'string' || !redirect.startsWith('/')) {
    return ROUTE_LIST.home
  }
  return redirect
})

const verifyOtp = async (code: string) => {
  if (!otpSessionId.value) {
    otpError.value = 'Your OTP session is missing. Please sign in again.'
    return
  }

  loading.value = true
  otpError.value = null

  try {
    const response = await authService.verifyLoginOTP({
      handler: '$fetch',
      body: {
        otp_session_id: otpSessionId.value,
        otp_code: code
      }
    })

    const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
    const userData = (payload?.data ?? payload) as Record<string, any>

    if (!userData?.access) {
      throw new Error('OTP verification failed.')
    }

    setAuthTokens({
      accessToken: String(userData.access)
    })

    const { access: _access, refresh: _refresh, ...user } = userData
    setUser(user)
    setAuthMethod('password')
    clearOtpSession()
    resetSessionTimeoutState()

    toast.add({
      title: 'Verification complete',
      description: 'You are now signed in.',
      color: 'success'
    })

    await navigateTo(redirectPath.value)
  } catch (error: unknown) {
    const message = parseApiError(error, 'Invalid OTP code.')

    otpError.value = message
  } finally {
    loading.value = false
  }
}

const resendOtp = async () => {
  if (!otpSessionId.value) {
    otpError.value = 'Your OTP session is missing. Please sign in again.'
    return
  }

  resendLoading.value = true
  otpError.value = null

  try {
    const response = await authService.resendLoginOTP({
      handler: '$fetch',
      body: {
        otp_session_id: otpSessionId.value
      }
    })

    const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
    const expiresAt = typeof payload?.expires_at === 'string'
      ? payload.expires_at
      : typeof payload?.data?.expires_at === 'string'
        ? payload.data.expires_at
        : null

    const nextExpiry = expiresAt || new Date(Date.now() + OTP_TTL_MS).toISOString()

    setOtpSession({
      email: otpEmail.value,
      sessionId: otpSessionId.value,
      expiry: nextExpiry
    })

    toast.add({
      title: 'Code resent',
      description: 'Check your email for the latest OTP code.',
      color: 'success'
    })
  } catch (error: unknown) {
    const message = parseApiError(error, 'Unable to resend OTP code.')

    otpError.value = message
  } finally {
    resendLoading.value = false
  }
}

const goBackToLogin = async () => {
  clearOtpSession()
  await navigateTo({
    path: ROUTE_LIST.auth.login,
    query: redirectPath.value !== ROUTE_LIST.home ? { redirect: redirectPath.value } : undefined
  })
}

onMounted(async () => {
  if (!otpSessionId.value) {
    await navigateTo(ROUTE_LIST.auth.login, { replace: true })
  }
})
</script>

<template>
  <AuthRegisterVerifyStep
    v-if="otpSessionId"
    :email="otpEmail"
    :loading="loading"
    :resend-loading="resendLoading"
    :code-expiry="otpExpiry"
    :error-message="otpError"
    title="Verify one-time code"
    description="Enter the code sent to your email to complete sign in."
    submit-label="Verify"
    back-label="Back to login"
    @submit="verifyOtp"
    @resend="resendOtp"
    @back="goBackToLogin"
  />
</template>
