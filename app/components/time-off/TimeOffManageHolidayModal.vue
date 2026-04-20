<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { calendarMonths } from '~/constants/months'
import { timeOffService } from '~~/services/timeoff.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

const toast = useToast()
const loading = ref(false)

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  month: z.coerce.number().int().min(1).max(12),
  day: z.string().min(1, 'Date is required'),
  is_observed: z.boolean(),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  month: 1,
  day: '',
  is_observed: true,
})

watch(isOpen, (open) => {
  if (open) {
    state.name = ''
    state.month = 1
    state.day = ''
    state.is_observed = true
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await timeOffService.addCompanyHoliday({
      handler: '$fetch',
      method: 'POST',
      body: {
        name: event.data.name,
        month: event.data.month,
        day: event.data.day,
        is_observed: event.data.is_observed,
      },
    })
    toast.add({ title: 'Holiday added', color: 'success' })
    isOpen.value = false
    emit('success')
  }
  catch (error: unknown) {
    toast.add({
      title: 'Could not add holiday',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Add public holiday"
    description="Add a holiday to your company calendar."
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Holiday name" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Month" name="month">
          <USelect
            v-model="state.month"
            class="w-full"
            :items="[...calendarMonths]"
            value-key="value"
            label-key="label"
          />
        </UFormField>
        <UFormField label="Date" name="day" hint="Day of month (as shown on the legacy form).">
          <UInput v-model="state.day" class="w-full" placeholder="e.g. 25" />
        </UFormField>
        <UFormField label="Observed" name="is_observed">
          <USwitch v-model="state.is_observed" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancel"
            :disabled="loading"
            @click="isOpen = false"
          />
          <UButton type="submit" label="Save" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
