<script setup lang="ts">
import * as z from 'zod'
import { authService } from '~/services/auth.service'
import { ROUTE_LIST } from '~/constants/routeList'

definePageMeta({
  layout: 'auth'
})

const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address.')
})

type ForgotPasswordSchema = z.output<typeof forgotPasswordSchema>

const state = reactive<Partial<ForgotPasswordSchema>>({
  email: ''
})

const loading = ref(false)
const successMessage = ref<string | null>(null)

const toast = useToast()

const handleRequestReset = async () => {
  loading.value = true
  successMessage.value = null

  try {
    const response = await authService.passwordResetRequest({
      handler: '$fetch',
      body: {
        email: state.email
      }
    })

    const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
    const message = String(payload?.message || 'If an account exists for this email, a reset link has been sent.')

    successMessage.value = message

    toast.add({
      title: 'Reset link sent',
      description: message,
      color: 'success'
    })
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Unable to send reset link.')
      : 'Unable to send reset link.'

    toast.add({
      title: 'Request failed',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthFormShell
    title="Forgot password"
    description="Enter your email and we will send you a reset link."
  >
    <UForm :schema="forgotPasswordSchema" :state="state" class="space-y-4" @submit="handleRequestReset">
      <UFormField name="email" label="Email">
        <UInput v-model="state.email" type="email" class="w-full" placeholder="you@company.com" />
      </UFormField>

      <UAlert
        v-if="successMessage"
        color="success"
        variant="soft"
        icon="i-lucide-circle-check"
        :title="successMessage"
      />

      <div class="flex items-center justify-between gap-3">
        <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.login">
          Back to login
        </NuxtLink>

        <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.register">
          Create account
        </NuxtLink>
      </div>

      <UButton type="submit" block :loading="loading">
        Send reset link
      </UButton>
    </UForm>
  </AuthFormShell>
</template>