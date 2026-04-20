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
  day: z.coerce.number().int().min(1).max(31),
  month: z.coerce.number().int().min(1).max(12),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  day: 1,
  month: 1,
})

watch(isOpen, (open) => {
  if (open) {
    state.name = ''
    state.day = 1
    state.month = 1
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await timeOffService.AddNonWorkignDay({
      handler: '$fetch',
      method: 'POST',
      body: event.data,
    })
    toast.add({ title: 'Non-working day added', color: 'success' })
    isOpen.value = false
    emit('success')
  }
  catch (error: unknown) {
    toast.add({
      title: 'Could not add day',
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
    title="Add non-working day"
    description="Add a company-specific non-working day."
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="e.g. Founders Day" />
        </UFormField>
        <UFormField label="Day of month" name="day">
          <UInput v-model.number="state.day" type="number" min="1" max="31" class="w-full" />
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
