<script setup lang="ts">
import { authService } from '~/services/auth.service'
import { ROUTE_LIST } from '~/constants/routeList'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const toast = useToast()

const { setAuthTokens, setUser, setAuthMethod } = useAuthSession()
const { resetSessionTimeoutState } = useSessionTimeoutState()

const loading = ref(true)
const error = ref<string | null>(null)

const ssoToken = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const attemptSso = async () => {
  if (!ssoToken.value) {
    error.value = 'No SSO token was provided.'
    loading.value = false
    return
  }

  try {
    const response = await authService.whmcsSSO({
      handler: '$fetch',
      body: {
        token: ssoToken.value
      }
    })

    const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
    const isSuccess = Boolean((response as Record<string, any>)?.success ?? payload?.success ?? true)
    const authPayload = (payload?.data ?? payload) as Record<string, any>

    if (!isSuccess || !authPayload || typeof authPayload !== 'object') {
      throw new Error(String(payload?.message || 'Invalid SSO response.'))
    }

    if (typeof authPayload.access !== 'string' || !authPayload.access) {
      throw new Error('SSO response is missing an access token.')
    }

    setAuthTokens({
      accessToken: authPayload.access,
      refreshToken: typeof authPayload.refresh === 'string' ? authPayload.refresh : null
    })

    const { access: _access, refresh: _refresh, ...userWithoutTokens } = authPayload
    setAuthMethod('whmcs_sso')
    setUser(userWithoutTokens)
    resetSessionTimeoutState()

    const authUserResponse = await authService.fetchAuthUser({
      handler: '$fetch'
    })
    const normalizedPayload = (authUserResponse as Record<string, any>)?.data ?? (authUserResponse as Record<string, any>)
    const normalizedUser = normalizedPayload?.data ?? normalizedPayload

    if (normalizedUser && typeof normalizedUser === 'object') {
      setUser(normalizedUser)
    }

    await navigateTo(ROUTE_LIST.home)
  } catch (ssoError: unknown) {
    error.value = typeof ssoError === 'object' && ssoError && 'data' in ssoError
      ? String((ssoError as { data?: { message?: string; statusMessage?: string } }).data?.message || (ssoError as { data?: { statusMessage?: string } }).data?.statusMessage || 'Failed to authenticate via WHMCS SSO.')
      : ssoError instanceof Error
        ? ssoError.message
        : 'Failed to authenticate via WHMCS SSO.'

    toast.add({
      title: 'WHMCS SSO failed',
      description: error.value,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const retrySso = async () => {
  loading.value = true
  error.value = null
  await attemptSso()
}

onMounted(async () => {
  await attemptSso()
})
</script>

<template>
  <AuthFormShell
    title="WHMCS sign-in"
    description="We are validating your SSO session and preparing your workspace."
  >
    <div v-if="loading" class="space-y-4 text-center">
      <div class="flex justify-center">
        <UIcon name="i-lucide-loader-circle" class="h-10 w-10 animate-spin text-primary" />
      </div>
      <p class="text-sm text-muted">Authenticating with WHMCS...</p>
    </div>

    <div v-else-if="error" class="space-y-4">
      <UAlert color="error" variant="soft" icon="i-lucide-alert-circle" :title="error" />

      <div class="flex items-center justify-between gap-3">
        <UButton color="neutral" variant="outline" :to="ROUTE_LIST.auth.login">
          Go to login
        </UButton>
        <UButton color="primary" @click="retrySso">
          Retry SSO
        </UButton>
      </div>
    </div>
  </AuthFormShell>
</template>
