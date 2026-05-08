<script setup lang="ts">
import * as z from 'zod'
import { authService } from '~/services/auth.service'
import { ROUTE_LIST } from '~/constants/routeList'
import { parseApiError } from '~/utils/parseApiError'
import { getSubdomainFromHref, parseExcludedSubdomains } from '~/utils/subdomain'

definePageMeta({
  layout: 'auth',
  middleware: [
    (to) => {
      const { isAuthenticated } = useAuthSession()
      if (!isAuthenticated.value) {
        return
      }
      const raw = to.query.redirect
      const redirectTarget = typeof raw === 'string' && raw.startsWith('/') ? raw : null
      if (redirectTarget) {
        return navigateTo(redirectTarget)
      }
      return navigateTo(ROUTE_LIST.home)
    }
  ]
})

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.')
})

type LoginSchema = z.output<typeof loginSchema>

const state = reactive<Partial<LoginSchema>>({
  email: '',
  password: ''
})

const loading = ref(false)
const authError = ref<string | null>(null)
const showPassword = ref(false)
const rememberDevice = ref(true)

const route = useRoute()
const toast = useToast()
const runtimeConfig = useRuntimeConfig()
const requestUrl = useRequestURL()

const subdomain = computed(() => getSubdomainFromHref(requestUrl.href))
const excludedSubdomains = computed(() =>
  parseExcludedSubdomains(String(runtimeConfig.public.excludedSubdomains ?? ''))
)
const needsSubdomain = computed(
  () => !subdomain.value || excludedSubdomains.value.includes(subdomain.value)
)

const { setAuthTokens, setUser, setAuthMethod, setOtpSession } = useAuthSession()
const { resetSessionTimeoutState } = useSessionTimeoutState()
const directLoginDone = ref(false)

const redirectPath = computed(() => {
  const redirect = route.query.redirect
  if (typeof redirect !== 'string' || !redirect.startsWith('/')) {
    return ROUTE_LIST.home
  }
  return redirect
})

const removeTokenFromUrl = () => {
  if (typeof window === 'undefined') {
    return
  }

  const url = new URL(window.location.href)
  const keysToRemove = ['t', 'u', 'site_url']
  let changed = false

  for (const key of keysToRemove) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key)
      changed = true
    }
  }

  if (changed) {
    window.history.replaceState({}, '', url.toString())
  }
}

const handleDirectTokenLogin = async (token: string) => {
  loading.value = true
  authError.value = null

  try {
    const response = await authService.fetchAuthUser({
      handler: '$fetch',
      secured: false,
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
    const userData = (payload?.data ?? payload) as Record<string, any>

    if (!userData || typeof userData !== 'object') {
      throw new Error('Unable to authenticate with the provided token.')
    }

    const accessToken = typeof userData.access === 'string' && userData.access
      ? userData.access
      : token

    setAuthTokens({
      accessToken
    })

    const { access: _access, refresh: _refresh, ...user } = userData
    setUser(user)
    setAuthMethod('password')
    resetSessionTimeoutState()
    removeTokenFromUrl()

    toast.add({
      title: 'Welcome back',
      description: 'Your account has been opened successfully.',
      color: 'success'
    })

    await navigateTo(redirectPath.value)
  } catch (error: unknown) {
    const message = parseApiError(error, 'Direct login failed.')

    authError.value = message

    toast.add({
      title: 'Unable to sign in',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  loading.value = true
  authError.value = null

  try {
    const response = await authService.login({
      handler: '$fetch',
      body: {
        email: state.email,
        password: state.password,
        use_otp: true
      }
    })

    const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
    const otpSessionId = String(payload?.otp_session_id ?? '')
    const otpExpiry = typeof payload?.expires_at === 'string' ? payload.expires_at : null

    if (otpSessionId) {
      setOtpSession({
        email: String(state.email || ''),
        sessionId: otpSessionId,
        expiry: otpExpiry
      })

      toast.add({
        title: 'Verification code sent',
        description: 'Check your email for the OTP code.',
        color: 'success'
      })

      await navigateTo({
        path: ROUTE_LIST.auth.otpVerification,
        query: redirectPath.value !== ROUTE_LIST.home ? { redirect: redirectPath.value } : undefined
      })
      return
    }

    const userData = (payload?.data ?? payload) as Record<string, any>

    if (!userData?.access) {
      throw new Error('Unable to authenticate user.')
    }

    setAuthTokens({
      accessToken: String(userData.access)
    })

    const { access: _access, refresh: _refresh, ...user } = userData
    setUser(user)
    setAuthMethod('password')
    resetSessionTimeoutState()

    toast.add({
      title: 'Welcome back',
      description: 'You are now signed in.',
      color: 'success'
    })

    await navigateTo(redirectPath.value)
  } catch (error: unknown) {
    const message = parseApiError(error, 'Login failed.')

    authError.value = message

    toast.add({
      title: 'Unable to sign in',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (directLoginDone.value) {
    return
  }

  const routeToken = route.query.t
  const routeUserId = route.query.u
  if (typeof routeToken !== 'string' || !routeToken || typeof routeUserId !== 'string' || !routeUserId) {
    return
  }

  removeTokenFromUrl()
  directLoginDone.value = true
  await handleDirectTokenLogin(routeToken)
})
</script>

<template>
  <AuthEnterSubdomain v-if="needsSubdomain" />

  <AuthFormShell
    v-else
    title="Sign in"
    description="Use your work account to continue."
  >
    <UForm :schema="loginSchema" :state="state" class="space-y-4" @submit="handleLogin">
      <UFormField name="email" label="Email">
        <UInput
          v-model="state.email"
          type="email"
          class="w-full"
          placeholder="you@company.com"
          autocomplete="username"
        />
      </UFormField>

      <UFormField name="password" label="Password">
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          class="w-full"
          placeholder="Enter your password"
          autocomplete="current-password"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UAlert
        v-if="authError"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="authError"
      />

      <div class="flex items-center justify-between gap-3">
        <UCheckbox v-model="rememberDevice" label="Remember this device" />

        <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.forgotPassword">
          Forgot password?
        </NuxtLink>
      </div>

      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-gray-500">Need a KaziQuest Workspace?</span>
        <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.register">
          Create account
        </NuxtLink>
      </div>

      <UButton type="submit" block :loading="loading">
        Sign in to workspace
      </UButton>
    </UForm>
  </AuthFormShell>
</template>