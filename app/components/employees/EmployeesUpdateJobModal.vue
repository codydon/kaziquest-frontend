<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import type { EmployeeJobRow, IPosition } from '~/types/employee'
import { employeeService } from '~~/services/employee.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  open: boolean
  job: EmployeeJobRow | null
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
  hire_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().optional(),
  is_current: z.boolean()
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  hire_date: '',
  end_date: '',
  location: '',
  is_current: false
})

const positionId = ref<string | number | undefined>(undefined)

watch(
  () => [props.open, props.job] as const,
  () => {
    const j = props.job
    if (!props.open || !j) return
    state.hire_date = String(j.hire_date ?? '').slice(0, 10)
    state.end_date = j.end_date ? String(j.end_date).slice(0, 10) : ''
    state.location = String(j.location ?? '')
    state.is_current = Boolean(j.is_current)
    positionId.value = j.position?.id
  }
)

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  const j = props.job
  if (!j?.id) return
  loading.value = true
  try {
    await employeeService.updateJob(String(j.id), {
      handler: '$fetch',
      secured: true,
      body: {
        job_title: j.position?.job_title ?? j.job_title,
        hire_date: state.hire_date || null,
        end_date: state.is_current ? null : (state.end_date || null),
        employment_status: j.employment_status,
        location: state.location,
        is_current: state.is_current,
        position: positionId.value ?? j.position?.id,
        employee: j.employee?.id
      }
    })
    toast.add({ title: 'Job updated', color: 'success' })
    emit('success')
    isOpen.value = false
  } catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Unable to update job.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function onPositionPicked(p: IPosition) {
  positionId.value = p.id
}
</script>

<template>
  <UModal v-model:open="isOpen" title="Update job">
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <EmployeesDepartmentPosition
        @selected-position="onPositionPicked"
      />
      <UCheckbox v-model="state.is_current" label="This is the current job" />
      <div class="grid gap-4 md:grid-cols-2">
        <UFormField label="Hire date" name="hire_date">
          <UInput v-model="state.hire_date" type="date" />
        </UFormField>
        <UFormField v-if="!state.is_current" label="End date" name="end_date">
          <UInput v-model="state.end_date" type="date" />
        </UFormField>
      </div>
      <UFormField label="Work location" name="location">
        <UInput v-model="state.location" />
      </UFormField>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" label="Cancel" @click="isOpen = false" />
        <UButton type="submit" label="Save" :loading="loading" />
      </div>
    </UForm>
  </UModal>
</template>
