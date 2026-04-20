<script setup lang="ts">
import { smsService } from '~~/services/sms.service'
import { parseApiError } from '~/utils/parseApiError'

export interface SmsRecipient {
  sent_to?: string
  phone_number: string
}

const props = defineProps<{
  open: boolean
  recipients: SmsRecipient[]
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  'success': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

const toast = useToast()
const message = ref('')
const loading = ref(false)

watch(() => props.open, (v) => {
  if (v) {
    message.value = ''
  }
})

async function hasSmsDriver(): Promise<boolean> {
  try {
    const res = await smsService.getSMSDrivers({
      handler: '$fetch',
      secured: true
    })
    if (Array.isArray(res)) return res.length > 0
    const r = res as Record<string, unknown>
    const list = Array.isArray(r.results) ? r.results : (Array.isArray(r.data) ? r.data : [])
    return Array.isArray(list) && list.length > 0
  } catch {
    return false
  }
}

async function send() {
  const trimmed = message.value.trim()
  if (!trimmed) {
    toast.add({ title: 'Enter a message', color: 'warning' })
    return
  }
  const validRecipients = props.recipients.filter(r => r.phone_number?.trim())
  if (!validRecipients.length) {
    toast.add({ title: 'No valid phone numbers in selection', color: 'warning' })
    return
  }
  if (!(await hasSmsDriver())) {
    toast.add({
      title: 'No SMS integration',
      description: 'Configure an SMS provider under Settings → Integrations.',
      color: 'error'
    })
    return
  }
  loading.value = true
  try {
    await smsService.sendSMS({
      handler: '$fetch',
      secured: true,
      body: {
        text: trimmed,
        recipients: validRecipients.map(r => ({
          sent_to: r.sent_to,
          phone_number: r.phone_number.trim()
        }))
      }
    })
    toast.add({ title: 'SMS sent', color: 'success' })
    emit('success')
    isOpen.value = false
  } catch (error: unknown) {
    toast.add({
      title: 'Send failed',
      description: parseApiError(error, 'Unable to send SMS.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Send SMS"
    :description="`${recipients.length} recipient(s)`"
    :ui="{
      content: 'sm:max-w-lg',
      overlay: 'backdrop-blur-sm'
    }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Message">
          <UTextarea
            v-model="message"
            :rows="4"
            placeholder="Enter your message"
            class="w-full"
            autoresize
          />
          <p class="mt-1 text-xs text-muted">
            {{ message.length }} characters
          </p>
        </UFormField>
        <div>
          <h3 class="mb-2 text-sm font-medium text-highlighted">
            Recipients
          </h3>
          <ul class="max-h-48 space-y-1 overflow-auto rounded-md border border-default p-2 text-sm">
            <li
              v-for="(r, i) in recipients"
              :key="`${r.phone_number}-${i}`"
              class="flex justify-between gap-2"
            >
              <span>{{ r.sent_to || '—' }}</span>
              <span class="text-muted">{{ r.phone_number || '—' }}</span>
            </li>
          </ul>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          :disabled="loading"
          @click="isOpen = false"
        />
        <UButton label="Send" :loading="loading" @click="() => void send()" />
      </div>
    </template>
  </UModal>
</template>
