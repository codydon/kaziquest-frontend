<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { employeeService } from '~~/services/employee.service'
import { timeOffService } from '~~/services/timeoff.service'
import { parseApiError } from '~/utils/parseApiError'

interface PickedEmployee {
  id: string
  first_name?: string
  user?: { full_name?: string }
}

const props = defineProps<{
  open: boolean
  manageType: 'add' | 'edit'
  dataToEdit?: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
  refreshEmployees: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

const toast = useToast()
const loading = ref(false)
const employeesLoading = ref(false)
const employeeRecords = ref<PickedEmployee[]>([])

const modalTitle = computed(() =>
  props.manageType === 'add'
    ? 'Add leave category'
    : `Edit leave category: ${String(props.dataToEdit?.name ?? '')}`,
)

const calcMethodItems = [
  { label: 'Working days', value: 'WD' },
  { label: 'Calendar days', value: 'CD' },
]

const genderItems = ['Male', 'Female'].map(g => ({ label: g, value: g }))

const leaveYearStartItems = [
  { label: 'Leave year start', value: 'year_start' },
  { label: 'Contract start', value: 'contract_start' },
]

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  eligibility_criteria: z.string().optional(),
  total_entitled_days: z.coerce.number().min(0),
  max_negative_balance: z.coerce.number().min(0),
  carry_over_policy: z.boolean(),
  max_carried_days: z.coerce.number().min(0).optional(),
  statutory: z.boolean(),
  leave_calculation_method: z.enum(['WD', 'CD']),
  leave_year_start: z.enum(['year_start', 'contract_start']),
  accrual_frequency: z.string(),
  accrual_registration_timing: z.string(),
  gender: z.string().optional(),
})

type Schema = z.output<typeof schema>

const applicableToAll = ref(true)
const selectedEmployeeIds = ref<string[]>([])

const state = reactive<Partial<Schema>>({
  name: '',
  description: '',
  eligibility_criteria: '',
  total_entitled_days: 0,
  max_negative_balance: 0,
  carry_over_policy: false,
  max_carried_days: 0,
  statutory: false,
  leave_calculation_method: 'WD',
  leave_year_start: 'year_start',
  accrual_frequency: 'yearly',
  accrual_registration_timing: 'period_start',
  gender: '',
})

const isGenderSensitive = ref(false)

function resetFromProps() {
  const d = props.dataToEdit
  state.name = (d?.name as string) || ''
  state.description = (d?.description as string) || ''
  state.eligibility_criteria = (d?.eligibility_criteria as string) || ''
  state.total_entitled_days = Number(d?.total_entitled_days ?? 0)
  state.max_negative_balance = Number(d?.max_negative_balance ?? 0)
  state.carry_over_policy = Boolean(d?.carry_over_policy)
  state.max_carried_days = Number(d?.max_carried_days ?? 0)
  state.statutory = Boolean(d?.statutory)
  {
    const m = d?.leave_calculation_method
    state.leave_calculation_method = m === 'CD' || m === 'WD' ? m : 'WD'
  }
  state.leave_year_start = (d?.leave_year_start as 'year_start' | 'contract_start') || 'year_start'
  state.accrual_frequency = (d?.accrual_frequency as string) || 'yearly'
  state.accrual_registration_timing = (d?.accrual_registration_timing as string) || 'period_start'
  state.gender = (d?.gender as string) || ''
  isGenderSensitive.value = Boolean(d?.gender)
  const emps = (d?.employees as PickedEmployee[] | undefined) ?? []
  applicableToAll.value = emps.length === 0
  selectedEmployeeIds.value = emps.map(e => String(e.id))
}

watch(isOpen, async (open) => {
  if (!open) {
    return
  }
  if (props.manageType === 'edit') {
    resetFromProps()
  }
  else {
    state.name = ''
    state.description = ''
    state.eligibility_criteria = ''
    state.total_entitled_days = 0
    state.max_negative_balance = 0
    state.carry_over_policy = false
    state.max_carried_days = 0
    state.statutory = false
    state.leave_calculation_method = 'WD'
    state.leave_year_start = 'year_start'
    state.accrual_frequency = 'yearly'
    state.accrual_registration_timing = 'period_start'
    state.gender = ''
    isGenderSensitive.value = false
    applicableToAll.value = true
    selectedEmployeeIds.value = []
  }
  await loadEmployees()
})

watch(isGenderSensitive, (on) => {
  if (!on) {
    state.gender = ''
  }
})

async function loadEmployees() {
  employeesLoading.value = true
  try {
    const res = await employeeService.getEmployees({
      handler: '$fetch',
      query: {
        page: 1,
        page_size: 500,
        paginate: 'false',
        stats: 'false',
      },
    }) as Record<string, unknown>
    const inner = (res?.data as Record<string, unknown>) ?? res
    const results = inner?.results
    employeeRecords.value = Array.isArray(results) ? (results as PickedEmployee[]) : []
  }
  catch {
    employeeRecords.value = []
  }
  finally {
    employeesLoading.value = false
  }
}

const employeeSelectItems = computed(() =>
  employeeRecords.value.map(e => ({
    label: e.user?.full_name || e.first_name || 'Unknown',
    value: e.id,
  })),
)

function buildBody() {
  const employees = applicableToAll.value
    ? []
    : selectedEmployeeIds.value
  return {
    name: state.name,
    max_days: 0,
    total_entitled_days: state.total_entitled_days,
    description: state.description,
    carry_over_policy: state.carry_over_policy,
    carry_over_expiry_days: null,
    eligibility_criteria: state.eligibility_criteria,
    gender: isGenderSensitive.value ? state.gender : '',
    max_carried_days: state.max_carried_days,
    time_period: null,
    employees,
    statutory: state.statutory,
    leave_calculation_method: state.leave_calculation_method,
    max_negative_balance: state.max_negative_balance,
    accrual_frequency: state.accrual_frequency,
    accrual_registration_timing: state.accrual_registration_timing,
    leave_year_start: state.leave_year_start,
  }
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (isGenderSensitive.value && !String(state.gender || '').trim()) {
    toast.add({ title: 'Select a gender', color: 'warning' })
    return
  }
  if (!applicableToAll.value && selectedEmployeeIds.value.length === 0) {
    toast.add({
      title: 'Select employees',
      description: 'Turn on “all employees” or pick at least one employee.',
      color: 'warning',
    })
    return
  }
  loading.value = true
  try {
    if (props.manageType === 'add') {
      await timeOffService.createLeaveCategory({
        handler: '$fetch',
        method: 'POST',
        body: buildBody(),
      })
    }
    else {
      const id = props.dataToEdit?.id
      if (!id) {
        toast.add({ title: 'Missing category id', color: 'error' })
        return
      }
      await timeOffService.updateLeaveCategory(String(id), {
        handler: '$fetch',
        method: 'PATCH',
        body: buildBody(),
      })
    }
    toast.add({
      title: props.manageType === 'add' ? 'Category created' : 'Category updated',
      color: 'success',
    })
    isOpen.value = false
    emit('success')
  }
  catch (error: unknown) {
    toast.add({
      title: 'Save failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

async function removeEmployeeFromCategory(employeeId: string) {
  const categoryId = props.dataToEdit?.id
  if (!categoryId) {
    return
  }
  loading.value = true
  try {
    await timeOffService.removeEmployeesFromCategory(Number(categoryId), {
      handler: '$fetch',
      method: 'POST',
      body: { employees: [employeeId] },
    })
    selectedEmployeeIds.value = selectedEmployeeIds.value.filter(id => id !== employeeId)
    emit('refreshEmployees')
    toast.add({ title: 'Employee removed from category', color: 'success' })
  }
  catch (error: unknown) {
    toast.add({
      title: 'Remove failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

const selectedEmployeeLabels = computed(() => {
  const map = new Map(employeeSelectItems.value.map(i => [i.value, i.label]))
  return selectedEmployeeIds.value.map(id => ({ id, label: map.get(id) || id }))
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    description="Configure how this leave type accrues and who it applies to."
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" class="w-full" />
        </UFormField>
        <UFormField label="Eligibility criteria" name="eligibility_criteria">
          <UTextarea v-model="state.eligibility_criteria" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Total entitled days" name="total_entitled_days">
            <UInput v-model.number="state.total_entitled_days" type="number" min="0" class="w-full" />
          </UFormField>
          <UFormField label="Max negative balance" name="max_negative_balance">
            <UInput v-model.number="state.max_negative_balance" type="number" min="0" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Gender-specific category" name="gender">
            <div class="flex flex-col gap-2">
              <USwitch v-model="isGenderSensitive" />
              <USelect
                v-if="isGenderSensitive"
                v-model="state.gender"
                :items="genderItems"
                value-key="value"
                label-key="label"
                class="w-full"
                placeholder="Gender"
              />
            </div>
          </UFormField>
          <UFormField label="Carry over policy" name="carry_over_policy">
            <div class="flex flex-col gap-2">
              <USwitch v-model="state.carry_over_policy" />
              <UInput
                v-if="state.carry_over_policy"
                v-model.number="state.max_carried_days"
                type="number"
                min="0"
                class="w-full"
                placeholder="Max carried days"
              />
            </div>
          </UFormField>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField label="Leave calculation" name="leave_calculation_method">
            <USelect
              v-model="state.leave_calculation_method"
              :items="calcMethodItems"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Statutory" name="statutory">
            <USwitch v-model="state.statutory" />
          </UFormField>
        </div>

        <UFormField label="Leave year reference" name="leave_year_start">
          <USelect
            v-model="state.leave_year_start"
            :items="leaveYearStartItems"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>

        <div class="space-y-2 rounded-lg border border-default p-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium">Applicable to all employees</span>
            <USwitch v-model="applicableToAll" />
          </div>
          <template v-if="!applicableToAll">
            <USelectMenu
              v-model="selectedEmployeeIds"
              multiple
              searchable
              class="w-full"
              :loading="employeesLoading"
              :items="employeeSelectItems"
              value-key="value"
              label-key="label"
              placeholder="Select employees"
            />
            <ul v-if="selectedEmployeeLabels.length" class="mt-2 space-y-1 text-sm">
              <li
                v-for="row in selectedEmployeeLabels"
                :key="row.id"
                class="flex items-center justify-between gap-2 rounded bg-elevated px-2 py-1"
              >
                <span>{{ row.label }}</span>
                <UButton
                  v-if="manageType === 'edit' && dataToEdit?.id"
                  icon="i-lucide-user-minus"
                  size="xs"
                  color="error"
                  variant="ghost"
                  @click="() => void removeEmployeeFromCategory(row.id)"
                />
              </li>
            </ul>
          </template>
        </div>

        <div class="flex justify-end gap-2 border-t border-default pt-4">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancel"
            :disabled="loading"
            @click="isOpen = false"
          />
          <UButton type="submit" :label="manageType === 'add' ? 'Create' : 'Update'" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
