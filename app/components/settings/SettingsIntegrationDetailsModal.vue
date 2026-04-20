<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { smsService } from '~~/services/sms.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  open: boolean
  integration: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  'saved': []
}>()

const toast = useToast()

const schema = z.object({
  username: z.string().optional(),
  sender_id: z.string().optional(),
  api_key: z.string().optional(),
  client_secret: z.string().optional(),
  is_primary: z.boolean().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  username: '',
  sender_id: '',
  api_key: '',
  client_secret: '',
  is_primary: false
})

const driverId = ref('')
const providerId = ref<string | number | undefined>(undefined)
const saving = ref(false)
const showApiKey = ref(false)
const showClientSecret = ref(false)

watch(
  () => [props.open, props.integration] as const,
  ([open]) => {
    if (!open) {
      return
    }
    const di = props.integration?.driver_info as Record<string, unknown> | undefined
    driverId.value = String(di?.id ?? '')
    providerId.value = (di?.provider as string | number | undefined) ?? props.integration?.id as string | number | undefined
    state.username = String(di?.username ?? '')
    state.sender_id = String(di?.sender_id ?? '')
    state.api_key = String(di?.api_key ?? '')
    state.client_secret = String(di?.client_secret ?? '')
    state.is_primary = Boolean(di?.is_primary)
  },
  { immediate: true }
)

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    if (driverId.value) {
      await smsService.updateSmsDriver(driverId.value, {
        handler: '$fetch',
        method: 'PATCH',
        body: {
          id: driverId.value,
          provider: providerId.value,
          username: state.username,
          sender_id: state.sender_id,
          api_key: state.api_key,
          client_secret: state.client_secret,
          is_primary: state.is_primary
        }
      })
      toast.add({ title: 'Integration updated', color: 'success' })
    } else {
      await smsService.addSmsDriver({
        handler: '$fetch',
        method: 'POST',
        body: {
          provider: providerId.value,
          username: state.username,
          sender_id: state.sender_id,
          api_key: state.api_key,
          client_secret: state.client_secret,
          is_primary: state.is_primary
        }
      })
      toast.add({ title: 'Integration added', color: 'success' })
    }
    emit('update:open', false)
    emit('saved')
  } catch (err: unknown) {
    toast.add({
      title: 'Save failed',
      description: parseApiError(err, 'Request failed.'),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    :title="driverId ? 'Update integration' : 'Add integration'"
    description="Enter credentials from your SMS provider."
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <UForm
      id="integration-form"
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="onSubmit"
    >
      <UFormField label="Username" name="username">
        <UInput v-model="state.username" autocomplete="off" />
      </UFormField>
      <UFormField label="Sender ID" name="sender_id">
        <UInput v-model="state.sender_id" autocomplete="off" />
      </UFormField>
      <UFormField label="API key" name="api_key">
        <div class="flex gap-2">
          <UInput
            v-model="state.api_key"
            class="flex-1"
            :type="showApiKey ? 'text' : 'password'"
            autocomplete="off"
          />
          <UButton
            size="sm"
            variant="outline"
            :label="showApiKey ? 'Hide' : 'Show'"
            @click="showApiKey = !showApiKey"
          />
        </div>
      </UFormField>
      <UFormField label="Client secret" name="client_secret">
        <div class="flex gap-2">
          <UInput
            v-model="state.client_secret"
            class="flex-1"
            :type="showClientSecret ? 'text' : 'password'"
            autocomplete="off"
          />
          <UButton
            size="sm"
            variant="outline"
            :label="showClientSecret ? 'Hide' : 'Show'"
            @click="showClientSecret = !showClientSecret"
          />
        </div>
      </UFormField>
      <UFormField name="is_primary">
        <UCheckbox v-model="state.is_primary" label="Set as default driver" />
      </UFormField>
    </UForm>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          @click="emit('update:open', false)"
        />
        <UButton
          type="submit"
          form="integration-form"
          :loading="saving"
          :label="driverId ? 'Update' : 'Add'"
        />
      </div>
    </template>
  </UModal>
</template>
