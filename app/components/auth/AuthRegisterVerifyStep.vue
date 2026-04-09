<script setup lang="ts">
const OTP_LENGTH = 6

const props = defineProps<{
  email: string
  loading: boolean
  resendLoading: boolean
  codeExpiry?: string | null
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  submit: [code: string]
  resend: []
  back: []
}>()

const inputs = ref<string[]>(Array(OTP_LENGTH).fill(''))
const inputRefs = ref<Array<HTMLInputElement | null>>([])
const nowTick = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const normalizedCode = computed(() => inputs.value.join('').replace(/\D/g, '').slice(0, OTP_LENGTH))
const isCodeComplete = computed(() => normalizedCode.value.length === OTP_LENGTH)

const hasExpiry = computed(() => Boolean(props.codeExpiry))
const remainingSeconds = computed(() => {
  if (!props.codeExpiry) {
    return 0
  }

  const expiry = new Date(props.codeExpiry).getTime()
  if (Number.isNaN(expiry)) {
    return 0
  }

  return Math.max(0, Math.floor((expiry - nowTick.value) / 1000))
})

const formattedRemaining = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const isCodeExpired = computed(() => hasExpiry.value && remainingSeconds.value <= 0)
const canResend = computed(() => !props.resendLoading && (!hasExpiry.value || isCodeExpired.value))
const resendLabel = computed(() => {
  if (!hasExpiry.value || isCodeExpired.value) {
    return 'Resend code'
  }
  return `Resend in ${formattedRemaining.value}`
})

const setInputRef = (el: unknown, index: number) => {
  inputRefs.value[index] = (el as HTMLInputElement | null)
}

const focusInput = (index: number) => {
  const el = inputRefs.value[index]
  if (el) {
    el.focus()
  }
}

const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '').slice(-1)
  inputs.value[index] = value

  if (value && index < OTP_LENGTH - 1) {
    focusInput(index + 1)
  }
}

const handleKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !inputs.value[index] && index > 0) {
    focusInput(index - 1)
  }

  if (event.key === 'ArrowLeft' && index > 0) {
    focusInput(index - 1)
  }

  if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
    focusInput(index + 1)
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH)
  const chars = pasted.split('')
  inputs.value = Array.from({ length: OTP_LENGTH }, (_, idx) => chars[idx] || '')
  focusInput(Math.min(chars.length, OTP_LENGTH - 1))
}

const submit = () => {
  if (!isCodeComplete.value || isCodeExpired.value) {
    return
  }

  emit('submit', normalizedCode.value)
}

const resend = () => {
  if (!canResend.value) {
    return
  }

  inputs.value = Array(OTP_LENGTH).fill('')
  focusInput(0)
  emit('resend')
}

onMounted(() => {
  nowTick.value = Date.now()
  timer = setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)

  nextTick(() => focusInput(0))
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
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
        <div class="flex items-center gap-2" @paste="handlePaste">
          <input
            v-for="(value, index) in inputs"
            :key="index"
            :ref="(el) => setInputRef(el, index)"
            :value="value"
            type="text"
            maxlength="1"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="one-time-code"
            :disabled="props.loading || isCodeExpired"
            class="h-11 w-full rounded-md border border-slate-300 bg-white text-center text-base text-slate-900 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
            @input="handleInput(index, $event)"
            @keydown="handleKeyDown(index, $event)"
          >
        </div>
      </UFormField>

      <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span v-if="hasExpiry">Code expires in {{ formattedRemaining }}</span>
        <span v-else>Code expires shortly after sending.</span>
        <span v-if="isCodeExpired" class="text-error">Code expired</span>
      </div>

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
          :disabled="!canResend"
          @click="resend"
        >
          {{ resendLabel }}
        </UButton>
      </div>

      <UButton
        type="button"
        block
        :loading="props.loading"
        :disabled="!isCodeComplete || isCodeExpired"
        @click="submit"
      >
        Verify code
      </UButton>
    </div>
  </AuthFormShell>
</template>