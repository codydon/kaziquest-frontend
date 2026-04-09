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

const impersonationToken = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const removeTokenFromUrl = () => {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  if (!url.searchParams.has('token')) {
    return
  }

  url.searchParams.delete('token')
  window.history.replaceState({}, '', url.toString())
}

const runImpersonation = async () => {
  if (!impersonationToken.value) {
    error.value = 'No impersonation token was provided.'
    loading.value = false
    return
  }

  try {
    const response = await authService.fetchAuthUser({
      handler: '$fetch',
      secured: false,
      headers: {
        Authorization: `Bearer ${impersonationToken.value}`
      }
    })

    const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
    const isSuccess = Boolean((response as Record<string, any>)?.success ?? payload?.success ?? true)
    const userData = (payload?.data ?? payload) as Record<string, any>

    if (!isSuccess || !userData || typeof userData !== 'object') {
      throw new Error(String(payload?.message || 'Unable to authenticate impersonation token.'))
    }

    const accessToken = typeof userData.access === 'string' && userData.access
      ? userData.access
      : impersonationToken.value

    setAuthTokens({
      accessToken,
      refreshToken: typeof userData.refresh === 'string' ? userData.refresh : null
    })

    const { access: _access, refresh: _refresh, ...userWithoutTokens } = userData
    setUser(userWithoutTokens)
    setAuthMethod('impersonation')
    resetSessionTimeoutState()

    removeTokenFromUrl()

    toast.add({
      title: 'Impersonation successful',
      description: `Signed in as ${String(userData?.email || userData?.name || 'company admin')}.`,
      color: 'success'
    })

    await navigateTo(ROUTE_LIST.home)
  } catch (authError: unknown) {
    error.value = typeof authError === 'object' && authError && 'data' in authError
      ? String((authError as { data?: { message?: string; statusMessage?: string } }).data?.message || (authError as { data?: { statusMessage?: string } }).data?.statusMessage || 'Failed to authenticate impersonation token.')
      : authError instanceof Error
        ? authError.message
        : 'Failed to authenticate impersonation token.'

    toast.add({
      title: 'Impersonation failed',
      description: error.value,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await runImpersonation()
})
</script>

<template>
  <AuthFormShell
    title="Admin impersonation"
    description="We are securely creating an admin session for this company."
  >
    <div v-if="loading" class="space-y-4 text-center">
      <div class="flex justify-center">
        <UIcon name="i-lucide-loader-circle" class="h-10 w-10 animate-spin text-primary" />
      </div>
      <p class="text-sm text-muted">Authenticating impersonation token...</p>
    </div>

    <div v-else-if="error" class="space-y-4">
      <UAlert color="error" variant="soft" icon="i-lucide-alert-circle" :title="error" />
      <UButton block color="neutral" variant="outline" :to="ROUTE_LIST.auth.login">
        Go to login
      </UButton>
    </div>
  </AuthFormShell>
</template>
