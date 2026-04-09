<script setup lang="ts">
import * as z from 'zod'
import { authService } from '~/services/auth.service'
import { ROUTE_LIST } from '~/constants/routeList'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const toast = useToast()

const uid = computed(() => (typeof route.query.uid === 'string' ? route.query.uid : ''))
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(8, 'Please confirm your password.')
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.'
})

type ResetSchema = z.output<typeof schema>

const state = reactive<Partial<ResetSchema>>({
  password: '',
  confirmPassword: ''
})

const checkingToken = ref(true)
const tokenValid = ref(false)
const tokenError = ref<string | null>(null)
const submitLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const checkToken = async () => {
  checkingToken.value = true
  tokenError.value = null

  if (!uid.value || !token.value) {
    tokenValid.value = false
    tokenError.value = 'The reset link is incomplete. Please request a new one.'
    checkingToken.value = false
    return
  }

  try {
    const response = await authService.linkTokenCheck({
      handler: '$fetch',
      body: {
        uid: uid.value,
        token: token.value
      }
    })

    const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
    tokenValid.value = Boolean((response as Record<string, any>)?.success ?? payload?.success ?? true)

    if (!tokenValid.value) {
      tokenError.value = String(payload?.message || 'Invalid or expired reset link.')
    }
  } catch (error: unknown) {
    tokenValid.value = false
    tokenError.value = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { message?: string; statusMessage?: string } }).data?.message || (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Invalid or expired reset link.')
      : 'Invalid or expired reset link.'
  } finally {
    checkingToken.value = false
  }
}

const onSubmit = async () => {
  if (!tokenValid.value) {
    return
  }

  submitLoading.value = true

  try {
    await authService.passwordResetComplete({
      handler: '$fetch',
      body: {
        uid: uid.value,
        token: token.value,
        password: state.password
      }
    })

    toast.add({
      title: 'Password updated',
      description: 'Your password has been reset. You can sign in now.',
      color: 'success'
    })

    await navigateTo(ROUTE_LIST.auth.login)
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { message?: string; statusMessage?: string } }).data?.message || (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Failed to reset password.')
      : 'Failed to reset password.'

    toast.add({
      title: 'Reset failed',
      description: message,
      color: 'error'
    })
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  await checkToken()
})
</script>

<template>
  <AuthFormShell
    title="Reset password"
    description="Create a new password for your account."
  >
    <div v-if="checkingToken" class="space-y-3">
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
    </div>

    <div v-else-if="!tokenValid" class="space-y-4">
      <UAlert
        color="error"
        variant="soft"
        icon="i-lucide-alert-triangle"
        :title="tokenError || 'Invalid reset link.'"
      />

      <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.forgotPassword">
        Request a new reset link
      </NuxtLink>
    </div>

    <UForm v-else :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField name="password" label="New password">
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          class="w-full"
          placeholder="Enter new password"
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

      <UFormField name="confirmPassword" label="Confirm password">
        <UInput
          v-model="state.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          class="w-full"
          placeholder="Confirm new password"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UButton type="submit" block :loading="submitLoading">
        Update password
      </UButton>
    </UForm>
  </AuthFormShell>
</template>
