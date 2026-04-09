<script setup lang="ts">
import * as z from 'zod'

const props = defineProps<{
  loading: boolean
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  submit: [payload: { password: string; careersite: string }]
  back: []
}>()

const schema = z.object({
  careersite: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters.')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphen only.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(8, 'Please confirm your password.')
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.'
})

type PasswordSchema = z.output<typeof schema>

const state = reactive<Partial<PasswordSchema>>({
  careersite: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const submit = () => {
  emit('submit', {
    careersite: String(state.careersite || '').trim(),
    password: String(state.password || '')
  })
}
</script>

<template>
  <AuthFormShell
    title="Finalize your account"
    description="Set your password and choose your careers subdomain."
  >
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="submit">
      <UFormField label="Career site subdomain" name="careersite">
        <UInput v-model="state.careersite" class="w-full" placeholder="your-company" />
      </UFormField>

      <UFormField label="Password" name="password">
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          class="w-full"
          placeholder="Create a strong password"
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

      <UFormField label="Confirm password" name="confirmPassword">
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

      <UAlert
        v-if="props.errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="props.errorMessage"
      />

      <div class="flex items-center justify-between gap-3">
        <UButton variant="ghost" color="neutral" @click="emit('back')">
          Back
        </UButton>

        <UButton type="submit" :loading="props.loading">
          Create workspace
        </UButton>
      </div>
    </UForm>
  </AuthFormShell>
</template>
