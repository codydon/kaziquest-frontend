<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { employeeService } from '~~/services/employee.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  open: boolean
  payInfo: Record<string, unknown>
  employeeId: string
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
  pay_rate: z.string().min(1, 'Pay rate is required'),
  effective_date: z.string().min(1, 'Effective date is required'),
  pay_frequency: z.string().min(1, 'Pay frequency is required'),
  change_reason: z.string().min(1, 'Change reason is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  pay_rate: '',
  effective_date: '',
  pay_frequency: '',
  change_reason: ''
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    const p = props.payInfo
    state.pay_rate = String(p.basic_salary ?? '')
    state.effective_date = String(p.effective_date ?? '').slice(0, 10)
    state.pay_frequency = String(p.pay_frequency ?? '')
    state.change_reason = String(p.change_reason ?? '')
  }
)

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    const id = String(props.payInfo.id ?? '')
    const res = await employeeService.updatePayInfo(id, {
      handler: '$fetch',
      secured: true,
      body: {
        pay_rate: state.pay_rate,
        effective_date: state.effective_date,
        pay_frequency: state.pay_frequency,
        change_reason: state.change_reason
      }
    }) as { id?: string }
    if (res?.id) {
      toast.add({ title: 'Compensation updated', color: 'success' })
      emit('success')
      isOpen.value = false
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Unable to update pay info.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" title="Update compensation">
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="Pay rate" name="pay_rate">
        <UInput v-model="state.pay_rate" />
      </UFormField>
      <UFormField label="Effective date" name="effective_date">
        <UInput v-model="state.effective_date" type="date" />
      </UFormField>
      <UFormField label="Pay frequency" name="pay_frequency">
        <UInput v-model="state.pay_frequency" />
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
