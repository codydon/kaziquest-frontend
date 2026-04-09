<script setup lang="ts">
import { authService } from '~/services/auth.service'
import { ROUTE_LIST } from '~/constants/routeList'

definePageMeta({
  layout: 'auth'
})

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

const otpCode = ref('')
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

const remainingSeconds = computed(() => {
  if (!otpExpiry.value) {
    return 0
  }

  const expiry = new Date(otpExpiry.value).getTime()
  if (Number.isNaN(expiry)) {
    return 0
  }

  return Math.max(0, Math.floor((expiry - Date.now()) / 1000))
})

const formattedRemaining = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const normalizedCode = computed(() => otpCode.value.replace(/\D/g, '').slice(0, 6))
const canVerify = computed(() => normalizedCode.value.length === 6 && Boolean(otpSessionId.value))
const otpExpired = computed(() => otpExpiry.value ? remainingSeconds.value <= 0 : false)

watch(normalizedCode, (value) => {
  if (value !== otpCode.value) {
    otpCode.value = value
  }
})

const verifyOtp = async () => {
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
        otp_code: normalizedCode.value
      }
    })

    const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
    const userData = (payload?.data ?? payload) as Record<string, any>

    if (!userData?.access) {
      throw new Error('OTP verification failed.')
    }

    setAuthTokens({
      accessToken: String(userData.access),
      refreshToken: typeof userData.refresh === 'string' ? userData.refresh : null
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
    const message = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { message?: string; statusMessage?: string } }).data?.message || (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Invalid OTP code.')
      : 'Invalid OTP code.'

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

    if (expiresAt) {
      setOtpSession({
        email: otpEmail.value,
        sessionId: otpSessionId.value,
        expiry: expiresAt
      })
    }

    otpCode.value = ''
    toast.add({
      title: 'Code resent',
      description: 'Check your email for the latest OTP code.',
      color: 'success'
    })
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { message?: string; statusMessage?: string } }).data?.message || (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Unable to resend OTP code.')
      : 'Unable to resend OTP code.'

    otpError.value = message
  } finally {
    resendLoading.value = false
  }
}

onMounted(async () => {
  if (!otpSessionId.value) {
    await navigateTo(ROUTE_LIST.auth.login, { replace: true })
  }
})
</script>

<template>
  <AuthFormShell
    title="Verify one-time code"
    description="Enter the code sent to your email to complete sign in."
  >
    <div class="space-y-4">
      <UAlert
        color="neutral"
        variant="soft"
        icon="i-lucide-mail"
        :title="`Code sent to ${otpEmail || 'your email'}`"
      />

      <UFormField label="One-time code" name="otp_code">
        <UInput
          v-model="otpCode"
          class="w-full"
          placeholder="Enter 6-digit code"
          maxlength="6"
          inputmode="numeric"
        />
      </UFormField>

      <div class="flex items-center justify-between text-xs text-gray-500">
        <span>Time remaining: {{ formattedRemaining }}</span>
        <span v-if="otpExpired" class="text-error">Code expired</span>
      </div>

      <UAlert
        v-if="otpError"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="otpError"
      />

      <div class="flex items-center justify-between gap-3">
        <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.login">
          Back to login
        </NuxtLink>

        <UButton
          variant="link"
          color="primary"
          :loading="resendLoading"
          @click="resendOtp"
        >
          Resend code
        </UButton>
      </div>

      <UButton type="button" block :loading="loading" :disabled="!canVerify" @click="verifyOtp">
        Verify
      </UButton>
    </div>
  </AuthFormShell>
</template>
