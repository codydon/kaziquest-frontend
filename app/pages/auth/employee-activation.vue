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

type ActivationPasswordSchema = z.output<typeof schema>

const state = reactive<Partial<ActivationPasswordSchema>>({
  password: '',
  confirmPassword: ''
})

const verifyingLink = ref(true)
const activationReady = ref(false)
const activationError = ref<string | null>(null)
const submitLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const verifyActivationLink = async () => {
  verifyingLink.value = true
  activationReady.value = false
  activationError.value = null

  if (!uid.value || !token.value) {
    activationError.value = 'This activation link is incomplete. Please request a new one from your administrator.'
    verifyingLink.value = false
    return
  }

  try {
    const response = await authService.linkTokenCheck({
      handler: '$fetch',
      body: {
        uid: uid.value,
        token: token.value,
        employee_activation: true
      }
    })

    const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
    const isSuccess = Boolean((response as Record<string, any>)?.success ?? payload?.success ?? false)

    if (!isSuccess) {
      throw new Error(String(payload?.message || 'Activation link verification failed.'))
    }

    activationReady.value = true
  } catch (error: unknown) {
    activationError.value = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { message?: string; statusMessage?: string } }).data?.message || (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Activation link verification failed.')
      : error instanceof Error
        ? error.message
        : 'Activation link verification failed.'
  } finally {
    verifyingLink.value = false
  }
}

const onSubmit = async () => {
  if (!activationReady.value) {
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
      title: 'Password created',
      description: 'Your account is now active. Sign in to continue.',
      color: 'success'
    })

    await navigateTo(ROUTE_LIST.auth.login)
  } catch (error: unknown) {
    const message = typeof error === 'object' && error && 'data' in error
      ? String((error as { data?: { message?: string; statusMessage?: string } }).data?.message || (error as { data?: { statusMessage?: string } }).data?.statusMessage || 'Unable to set password.')
      : 'Unable to set password.'

    toast.add({
      title: 'Activation failed',
      description: message,
      color: 'error'
    })
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  await verifyActivationLink()
})
</script>

<template>
  <AuthFormShell
    title="Activate your account"
    description="Verify your invitation and create your password to finish setup."
  >
    <div v-if="verifyingLink" class="space-y-3">
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
    </div>

    <div v-else-if="!activationReady" class="space-y-4">
      <UAlert
        color="error"
        variant="soft"
        icon="i-lucide-alert-triangle"
        :title="activationError || 'Activation link is invalid or expired.'"
      />

      <div class="flex items-center justify-between gap-3">
        <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.login">
          Back to login
        </NuxtLink>

        <UButton variant="link" color="primary" @click="verifyActivationLink">
          Try again
        </UButton>
      </div>
    </div>

    <UForm v-else :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UAlert
        color="success"
        variant="soft"
        icon="i-lucide-check-circle-2"
        title="Activation link verified"
      />

      <UFormField name="password" label="Create password">
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          class="w-full"
          placeholder="Enter your password"
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
          placeholder="Confirm your password"
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
        Activate account
      </UButton>
    </UForm>
  </AuthFormShell>
</template>
