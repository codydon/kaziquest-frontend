<script setup lang="ts">
import { authService } from '~/services/auth.service'
import { ROUTE_LIST } from '~/constants/routeList'

definePageMeta({
  layout: 'auth',
  middleware: [
    () => {
      const { isAuthenticated } = useAuthSession()
      if (isAuthenticated.value) {
        return navigateTo(ROUTE_LIST.home)
      }
    }
  ]
})

type RegisterStep = 'register' | 'verify' | 'password'

const route = useRoute()
const toast = useToast()

const {
  registrationFlow,
  setEmail,
  setStep,
  setAffiliateCode,
  completeRegistration,
  initializeFromCookie
} = useRegistrationFlow()

const registerLoading = ref(false)
const verifyLoading = ref(false)
const resendLoading = ref(false)
const passwordLoading = ref(false)

const registerError = ref<string | null>(null)
const verifyError = ref<string | null>(null)
const passwordError = ref<string | null>(null)

const userId = computed(() => {
  const value = route.query.u
  return typeof value === 'string' ? value : ''
})

const step = computed<RegisterStep>(() => {
  const queryStep = route.query.s
  if (queryStep === 'verify' || queryStep === 'password' || queryStep === 'register') {
    return queryStep
  }
  return registrationFlow.value.currentStep
})

const pushStep = async (nextStep: RegisterStep, nextUserId = userId.value) => {
  setStep(nextStep)

  const nextQuery: Record<string, string> = {
    s: nextStep
  }

  if (nextUserId) {
    nextQuery.u = nextUserId
  }

  await navigateTo({ path: ROUTE_LIST.auth.register, query: nextQuery }, { replace: true })
}

const parseResponsePayload = (response: Record<string, any>) => {
  return response?.data ?? response
}

const handleRegisterSubmit = async (payload: Record<string, unknown>) => {
  registerLoading.value = true
  registerError.value = null

  try {
    const response = await authService.register({
      handler: '$fetch',
      body: payload
    })

    const parsed = parseResponsePayload(response as Record<string, any>)
    const createdUserId = String(parsed?.user?.id ?? parsed?.id ?? '')

    if (!createdUserId) {
      throw new Error('Registration succeeded but user id was not returned.')
    }

    setEmail(String(payload.email || ''))
    await pushStep('verify', createdUserId)

    toast.add({
      title: 'Account created',
      description: 'We sent a verification code to your email.',
      color: 'success'
    })
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { message?: string; statusMessage?: string } }).data?.message || (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Unable to register account.')
      : 'Unable to register account.'

    registerError.value = message
  } finally {
    registerLoading.value = false
  }
}

const handleVerifySubmit = async (code: string) => {
  if (!userId.value) {
    verifyError.value = 'Missing registration context. Please start again.'
    await pushStep('register', '')
    return
  }

  verifyLoading.value = true
  verifyError.value = null

  try {
    await authService.verifyActivationCode({
      handler: '$fetch',
      body: {
        u_id: userId.value,
        verification_code: code
      }
    })

    await pushStep('password', userId.value)

    toast.add({
      title: 'Email verified',
      description: 'Now create your workspace password.',
      color: 'success'
    })
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { message?: string; statusMessage?: string } }).data?.message || (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Invalid verification code.')
      : 'Invalid verification code.'

    verifyError.value = message
  } finally {
    verifyLoading.value = false
  }
}

const handleResendCode = async () => {
  if (!userId.value) {
    verifyError.value = 'Missing registration context. Please start again.'
    return
  }

  resendLoading.value = true
  verifyError.value = null

  try {
    await authService.resendActivationCode({
      handler: '$fetch',
      body: {
        u_id: userId.value
      }
    })

    toast.add({
      title: 'Code resent',
      description: 'Please check your inbox for the latest code.',
      color: 'success'
    })
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { message?: string; statusMessage?: string } }).data?.message || (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Unable to resend verification code.')
      : 'Unable to resend verification code.'

    verifyError.value = message
  } finally {
    resendLoading.value = false
  }
}

const handleBackToRegister = async () => {
  await pushStep('register', userId.value)
}

const handleBackToVerify = async () => {
  await pushStep('verify', userId.value)
}

const handlePasswordSubmit = async (payload: { password: string; careersite: string }) => {
  if (!userId.value) {
    passwordError.value = 'Missing registration context. Please start again.'
    await pushStep('register', '')
    return
  }

  passwordLoading.value = true
  passwordError.value = null

  try {
    await authService.updateUserData(userId.value, {
      handler: '$fetch',
      body: {
        password: payload.password
      }
    })

    const siteResponse = await authService.createCareerSite({
      handler: '$fetch',
      body: {
        careersite: payload.careersite,
        user_id: userId.value
      }
    })

    const sitePayload = parseResponsePayload(siteResponse as Record<string, any>)

    completeRegistration()

    toast.add({
      title: 'Workspace ready',
      description: String(sitePayload?.site_url ? `Your site is ${sitePayload.site_url}` : 'You can now sign in to continue.'),
      color: 'success'
    })

    await navigateTo(ROUTE_LIST.auth.login)
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { message?: string; statusMessage?: string } }).data?.message || (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Unable to finalize account setup.')
      : 'Unable to finalize account setup.'

    passwordError.value = message
  } finally {
    passwordLoading.value = false
  }
}

onMounted(async () => {
  initializeFromCookie()

  const referral = route.query.ref
  if (typeof referral === 'string' && referral.trim()) {
    setAffiliateCode(referral.trim())
  }

  if (!route.query.s) {
    await pushStep(registrationFlow.value.currentStep, userId.value)
  }
})
</script>

<template>
  <AuthRegisterStepForm
    v-if="step === 'register'"
    :loading="registerLoading"
    :initial-email="registrationFlow.email"
    :initial-referral-code="registrationFlow.affiliateCode"
    :error-message="registerError"
    @submit="handleRegisterSubmit"
  />

  <AuthRegisterVerifyStep
    v-else-if="step === 'verify'"
    :email="registrationFlow.email"
    :loading="verifyLoading"
    :resend-loading="resendLoading"
    :error-message="verifyError"
    @submit="handleVerifySubmit"
    @resend="handleResendCode"
    @back="handleBackToRegister"
  />

  <AuthRegisterPasswordStep
    v-else
    :loading="passwordLoading"
    :error-message="passwordError"
    @submit="handlePasswordSubmit"
    @back="handleBackToVerify"
  />
</template>
