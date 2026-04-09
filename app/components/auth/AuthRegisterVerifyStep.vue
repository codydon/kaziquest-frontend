<script setup lang="ts">
const props = defineProps<{
  email: string
  loading: boolean
  resendLoading: boolean
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  submit: [code: string]
  resend: []
  back: []
}>()

const codeInput = ref('')

const normalizedCode = computed(() => codeInput.value.replace(/\D/g, '').slice(0, 6))
const isCodeComplete = computed(() => normalizedCode.value.length === 6)

watch(normalizedCode, (value) => {
  if (value !== codeInput.value) {
    codeInput.value = value
  }
})

const submit = () => {
  emit('submit', normalizedCode.value)
}
</script>

<template>
  <AuthFormShell
    title="Verify your email"
    description="Enter the six-digit verification code sent to your inbox."
  >
    <div class="space-y-4">
      <UAlert
        color="neutral"
        variant="soft"
        icon="i-lucide-mail"
        :title="`Code sent to ${props.email || 'your email'}`"
      />

      <UFormField label="Verification code" name="verification_code">
        <UInput
          v-model="codeInput"
          class="w-full"
          placeholder="Enter 6-digit code"
          maxlength="6"
          inputmode="numeric"
        />
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

        <UButton
          variant="link"
          color="primary"
          :loading="props.resendLoading"
          @click="emit('resend')"
        >
          Resend code
        </UButton>
      </div>

      <UButton type="button" block :loading="props.loading" :disabled="!isCodeComplete" @click="submit">
        Verify code
      </UButton>
    </div>
  </AuthFormShell>
</template>
