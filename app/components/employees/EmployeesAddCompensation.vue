<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { employeeService } from '~~/services/employee.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  open: boolean
  employeeId: string
  jobId: string
  jobName: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

const toast = useToast()
const loading = ref(false)

const schema = z.object({
  basic_salary: z.string().min(1, 'Basic salary is required'),
  effective_date: z.string().min(1, 'Effective date is required'),
  pay_frequency: z.string().min(1, 'Pay frequency is required'),
  change_reason: z.string().min(1, 'Change reason is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  basic_salary: '',
  effective_date: '',
  pay_frequency: 'Monthly',
  change_reason: ''
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    state.basic_salary = ''
    state.effective_date = ''
    state.pay_frequency = 'Monthly'
    state.change_reason = ''
  }
)

const payFrequencyItems = ['Monthly'].map(p => ({ label: p, value: p }))

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const res = await employeeService.addPayInfo({
      handler: '$fetch',
      secured: true,
      body: {
        basic_salary: state.basic_salary,
        effective_date: state.effective_date,
        pay_frequency: state.pay_frequency,
        change_reason: state.change_reason,
        employee: props.employeeId,
        job: props.jobId
      }
    }) as { id?: string }
    if (res?.id) {
      toast.add({ title: 'Compensation added', color: 'success' })
      emit('success')
      isOpen.value = false
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Unable to add compensation',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" :title="`Add compensation — ${jobName}`">
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Basic salary" name="basic_salary">
        <UInput v-model="state.basic_salary" type="number" />
      </UFormField>
      <UFormField label="Effective date" name="effective_date">
        <UInput v-model="state.effective_date" type="date" />
      </UFormField>
      <UFormField label="Pay frequency" name="pay_frequency">
        <USelect v-model="state.pay_frequency" :items="payFrequencyItems" class="w-full" />
      </UFormField>
      <UFormField label="Change reason" name="change_reason">
        <UTextarea v-model="state.change_reason" />
      </UFormField>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" label="Cancel" @click="isOpen = false" />
        <UButton type="submit" label="Save" :loading="loading" />
      </div>
    </UForm>
  </UModal>
</template>
