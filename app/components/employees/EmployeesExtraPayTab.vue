<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import * as z from 'zod'
import type { EmployeeExtraPay } from '~/types/employee'
import { employeeService } from '~~/services/employee.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  employeeId: string
}>()

const toast = useToast()
const { isBaseLevelEmployee } = useRolePermissionGuard()
const UButton = resolveComponent('UButton')
const NuxtTime = resolveComponent('NuxtTime')

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const rows = ref<EmployeeExtraPay[]>([])
const modalOpen = ref(false)
const editing = ref<EmployeeExtraPay | null>(null)

const extraPayCategories = [
  { label: 'Cash Pay', value: 'cash_pay' },
  { label: 'Non-Cash Benefits', value: 'non_cash_benefits' },
  { label: 'Housing Benefit', value: 'housing_benefit' },
  { label: 'Other', value: 'other_allowance' }
]

const cashPayOptions = [
  { label: 'Housing Allowance', value: 'housing_allowance' },
  { label: 'Transport Allowance', value: 'transport_allowance' },
  { label: 'Leave Pay', value: 'leave_pay_allowance' },
  { label: 'Overtime Allowance', value: 'overtime_allowance' },
  { label: "Director's Fee", value: 'director_fees' },
  { label: 'Lump Sum Payment', value: 'lumpsum' },
  { label: 'Global Income', value: 'global_income' },
  { label: 'Other Allowance', value: 'other_allowance' }
]

const nonCashBenefitsOptions = [
  { label: 'Car Benefit', value: 'car_benefit' },
  { label: 'Other Non-Cash Benefit', value: 'non_cash' }
]

const housingTypes = [
  { label: 'Employer Owned', value: 'employer_owned' },
  { label: 'Employer Rented', value: 'employer_rented' },
  { label: 'Agriculture Farm', value: 'agriculture_farm' },
  { label: 'House to non full time service director', value: 'house_to_non_fulltime_service_director' }
]

const carCostTypes = [
  { label: 'Owned', value: 'owned' },
  { label: 'Hired', value: 'hired' }
]

const carBodyTypes = [
  { label: 'Saloon Hatch Backs Estates', value: 'saloon_hatchback_estate' },
  { label: 'Pick Up Panel Vans Uncovered', value: 'pickup_panel_vans_uncovered' },
  { label: 'Landrover/Cruisers', value: 'landrover_cruiser' }
]

const prorationTypeOptions = [
  { label: 'Pay full amount', value: 'full' },
  { label: 'Prorate amount', value: 'prorated' }
]

const state = reactive({
  category: '',
  option: '',
  name: '',
  amount: null as number | null,
  start_date: '',
  end_date: '',
  recurring: true,
  proration_type: 'full',
  active: true,
  description: '',
  included_in_salary: true,
  comments: '',
  housing_benefit_data: {
    house_market_value: null as number | null,
    housing_type: '',
    rent_covered: null as number | null
  },
  car_benefit_data: {
    registration_number: '',
    make: '',
    cost_type: '',
    body_type: '',
    cc_rating: null as number | null
  }
})

const selectedCategoryOptions = computed(() => {
  switch (state.category) {
    case 'cash_pay':
      return cashPayOptions
    case 'non_cash_benefits':
      return nonCashBenefitsOptions
    default:
      return []
  }
})

const schema = computed(() => {
  /** Branches call `.extend()` with different shapes; widen so TS accepts reassignment. */
  let currentSchema = z.object({
    category: z.string().min(1, 'Category is required'),
    option: z.string().optional(),
    name: z.string().optional(),
    amount: z.number().nullable().optional(),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional(),
    recurring: z.boolean(),
    proration_type: z.string().min(1, 'Payment rule is required'),
    active: z.boolean(),
    description: z.string().optional(),
    included_in_salary: z.boolean(),
    comments: z.string().optional(),
    housing_benefit_data: z.object({
      house_market_value: z.number().nullable().optional(),
      housing_type: z.string().optional(),
      rent_covered: z.number().nullable().optional()
    }),
    car_benefit_data: z.object({
      registration_number: z.string().optional(),
      make: z.string().optional(),
      cost_type: z.string().optional(),
      body_type: z.string().optional(),
      cc_rating: z.number().nullable().optional()
    })
  }) as z.ZodObject<z.core.$ZodShape>

  if (state.category === 'cash_pay' || state.category === 'non_cash_benefits') {
    currentSchema = currentSchema.extend({
      option: z.string().min(1, 'Option is required'),
      amount: z.number().min(1, 'Amount must be greater than 0')
    })
  }

  if (state.category === 'housing_benefit') {
    currentSchema = currentSchema.extend({
      amount: z.number().min(1, 'Amount must be greater than 0'),
      housing_benefit_data: z.object({
        house_market_value: z.number().min(1, 'House market value is required'),
        housing_type: z.string().min(1, 'Housing type is required'),
        rent_covered: z.number().min(1, 'Rent covered is required')
      })
    })
  }

  if (state.category === 'non_cash_benefits' && state.option === 'car_benefit') {
    currentSchema = currentSchema.extend({
      car_benefit_data: z.object({
        registration_number: z.string().min(1, 'Registration number is required'),
        make: z.string().min(1, 'Make is required'),
        cost_type: z.string().min(1, 'Cost type is required'),
        body_type: z.string().min(1, 'Body type is required'),
        cc_rating: z.number().min(1, 'CC rating is required')
      })
    })
  }

  if (
    state.category === 'other_allowance'
    || state.option === 'other_allowance'
    || (state.category === 'non_cash_benefits' && state.option === 'non_cash')
  ) {
    currentSchema = currentSchema.extend({
      name: z.string().min(1, 'Name is required')
    })
  }

  return currentSchema.refine((value: { end_date?: string; start_date?: string }) => {
    if (value.end_date && value.start_date) {
      return new Date(value.end_date) >= new Date(value.start_date)
    }
    return true
  }, {
    message: 'End date should not be less than start date',
    path: ['end_date']
  })
})

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) {
    return res as T[]
  }
  if (!res || typeof res !== 'object') {
    return []
  }
  const raw = res as Record<string, unknown>
  const inner = raw.data && typeof raw.data === 'object' ? raw.data as Record<string, unknown> : raw
  if (Array.isArray(inner.results)) {
    return inner.results as T[]
  }
  if (Array.isArray((inner as Record<string, unknown>).value)) {
    return (inner as Record<string, unknown>).value as T[]
  }
  if (Array.isArray(raw.results)) {
    return raw.results as T[]
  }
  return []
}

function resetForm() {
  state.category = ''
  state.option = ''
  state.name = ''
  state.amount = null
  state.start_date = ''
  state.end_date = ''
  state.recurring = true
  state.proration_type = 'full'
  state.active = true
  state.description = ''
  state.included_in_salary = true
  state.comments = ''
  state.housing_benefit_data.house_market_value = null
  state.housing_benefit_data.housing_type = ''
  state.housing_benefit_data.rent_covered = null
  state.car_benefit_data.registration_number = ''
  state.car_benefit_data.make = ''
  state.car_benefit_data.cost_type = ''
  state.car_benefit_data.body_type = ''
  state.car_benefit_data.cc_rating = null
}

function getCategoryFromOption(option: string | undefined) {
  switch (option) {
    case 'housing_allowance':
    case 'transport_allowance':
    case 'leave_pay_allowance':
    case 'overtime_allowance':
    case 'director_fees':
    case 'lumpsum':
    case 'global_income':
    case 'other_allowance':
      return 'cash_pay'
    case 'car_benefit':
    case 'non_cash':
      return 'non_cash_benefits'
    case 'housing_benefit':
      return 'housing_benefit'
    default:
      return ''
  }
}

function openCreate() {
  editing.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row: EmployeeExtraPay) {
  editing.value = row
  state.category = getCategoryFromOption(row.category) || String(row.category || '')
  state.option = ['cash_pay', 'non_cash_benefits'].includes(state.category)
    ? String(row.category || '')
    : ''
  state.name = String(row.name || '')
  state.amount = row.amount ?? null
  state.start_date = String(row.start_date || '').slice(0, 10)
  state.end_date = row.end_date ? String(row.end_date).slice(0, 10) : ''
  state.recurring = Boolean(row.recurring)
  state.proration_type = String(row.proration_type || 'full')
  state.active = row.active !== false
  state.description = String(row.description || '')
  state.included_in_salary = row.included_in_salary !== false
  state.comments = String(row.comments || '')
  state.housing_benefit_data.house_market_value = row.housing_benefit?.house_market_value ?? null
  state.housing_benefit_data.housing_type = String(row.housing_benefit?.housing_type || '')
  state.housing_benefit_data.rent_covered = row.housing_benefit?.rent_covered ?? null
  state.car_benefit_data.registration_number = String(row.car_benefit?.registration_number || '')
  state.car_benefit_data.make = String(row.car_benefit?.make || '')
  state.car_benefit_data.cost_type = String(row.car_benefit?.cost_type || '')
  state.car_benefit_data.body_type = String(row.car_benefit?.body_type || '')
  state.car_benefit_data.cc_rating = row.car_benefit?.cc_rating ?? null
  modalOpen.value = true
}

watch(() => state.category, () => {
  state.option = ''
  if (state.category !== 'housing_benefit') {
    state.housing_benefit_data.house_market_value = null
    state.housing_benefit_data.housing_type = ''
    state.housing_benefit_data.rent_covered = null
  }
})

watch(() => state.option, (option) => {
  if (option !== 'car_benefit') {
    state.car_benefit_data.registration_number = ''
    state.car_benefit_data.make = ''
    state.car_benefit_data.cost_type = ''
    state.car_benefit_data.body_type = ''
    state.car_benefit_data.cc_rating = null
  }
})

watch(() => state.recurring, (recurring) => {
  if (recurring) {
    state.end_date = ''
  }
})

function buildBody() {
  const category = ['cash_pay', 'non_cash_benefits'].includes(state.category)
    ? state.option
    : state.category

  const body: Record<string, unknown> = {
    employee: props.employeeId,
    category,
    amount: state.amount,
    start_date: state.start_date,
    end_date: state.recurring ? null : (state.end_date || null),
    recurring: state.recurring,
    proration_type: state.proration_type,
    active: state.active,
    description: state.description,
    included_in_salary: state.included_in_salary,
    comments: state.comments
  }

  if (
    state.category === 'other_allowance'
    || state.option === 'other_allowance'
    || (state.category === 'non_cash_benefits' && state.option === 'non_cash')
  ) {
    body.name = state.name
  }

  if (state.category === 'housing_benefit') {
    body.housing_benefit_data = {
      house_market_value: state.housing_benefit_data.house_market_value,
      housing_type: state.housing_benefit_data.housing_type,
      rent_covered: state.housing_benefit_data.rent_covered
    }
  }

  if (state.category === 'non_cash_benefits' && state.option === 'car_benefit') {
    body.car_benefit_data = {
      registration_number: state.car_benefit_data.registration_number,
      make: state.car_benefit_data.make,
      cost_type: state.car_benefit_data.cost_type,
      body_type: state.car_benefit_data.body_type,
      cc_rating: state.car_benefit_data.cc_rating
    }
  }

  return body
}

async function load() {
  if (!props.employeeId) {
    return
  }
  loading.value = true
  try {
    const res = await employeeService.getEmployeeExtraPay({
      handler: '$fetch',
      secured: true,
      params: {
        employee_id: props.employeeId
      }
    })
    rows.value = unwrapList<EmployeeExtraPay>(res)
  } catch (error: unknown) {
    rows.value = []
    toast.add({
      title: 'Unable to load extra pay',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.employeeId, () => void load(), { immediate: true })

async function onSubmit(_event?: FormSubmitEvent<unknown>) {
  saving.value = true
  try {
    if (editing.value?.id != null) {
      await employeeService.updateEmployeeExtraPayRequest(String(editing.value.id), {
        handler: '$fetch',
        secured: true,
        body: buildBody()
      })
      toast.add({ title: 'Extra pay updated', color: 'success' })
    } else {
      await employeeService.addEmployeeExtraPayRequest({
        handler: '$fetch',
        secured: true,
        body: buildBody()
      })
      toast.add({ title: 'Extra pay added', color: 'success' })
    }
    modalOpen.value = false
    await load()
  } catch (error: unknown) {
    toast.add({
      title: editing.value ? 'Update failed' : 'Create failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function remove(row: EmployeeExtraPay) {
  if (row.id == null) {
    return
  }
  deletingId.value = String(row.id)
  try {
    await employeeService.deleteEmployeeExtraPay(String(row.id), {
      handler: '$fetch',
      secured: true
    })
    toast.add({ title: 'Extra pay deleted', color: 'success' })
    await load()
  } catch (error: unknown) {
    toast.add({
      title: 'Delete failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    deletingId.value = null
  }
}

function displayCategory(row: EmployeeExtraPay) {
  const raw = String(row.category || '')
  if (raw === 'other_allowance' || raw === 'non_cash') {
    return row.name || raw.replaceAll('_', ' ')
  }
  return raw.replaceAll('_', ' ')
}

const columns: TableColumn<EmployeeExtraPay>[] = [
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => displayCategory(row.original)
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => row.original.amount != null ? String(row.original.amount) : '—'
  },
  {
    accessorKey: 'start_date',
    header: 'Start date',
    cell: ({ row }) => row.original.start_date
      ? h(NuxtTime, { datetime: row.original.start_date, month: 'short', day: '2-digit', year: 'numeric' })
      : '—'
  },
  {
    accessorKey: 'end_date',
    header: 'End date',
    cell: ({ row }) => row.original.end_date
      ? h(NuxtTime, { datetime: row.original.end_date, month: 'short', day: '2-digit', year: 'numeric' })
      : '—'
  },
  {
    accessorKey: 'recurring',
    header: 'Recurring',
    cell: ({ row }) => row.original.recurring ? 'Yes' : 'No'
  },
  {
    accessorKey: 'active',
    header: 'Active',
    cell: ({ row }) => {
      const UBadge = resolveComponent('UBadge')
      return h(UBadge, {
        variant: 'soft',
        color: row.original.active ? 'success' : 'error'
      }, () => row.original.active ? 'Active' : 'Inactive')
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      if (isBaseLevelEmployee.value) {
        return null
      }
      return h('div', { class: 'flex justify-end gap-2' }, [
        h(UButton, {
          size: 'xs',
          variant: 'ghost',
          color: 'neutral',
          icon: 'i-lucide-pencil',
          onClick: () => openEdit(row.original)
        }),
        h(UButton, {
          size: 'xs',
          variant: 'ghost',
          color: 'error',
          icon: deletingId.value === row.original.id ? 'i-lucide-loader-circle' : 'i-lucide-trash-2',
          loading: deletingId.value === row.original.id,
          onClick: () => void remove(row.original)
        })
      ])
    }
  }
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold">
          Extra Pay
        </h3>
        <p class="text-sm text-muted">
          Additional cash and non-cash earnings for this employee.
        </p>
      </div>
      <UButton
        v-if="!isBaseLevelEmployee"
        icon="i-lucide-plus"
        label="Add extra pay"
        @click="openCreate"
      />
    </div>

    <UTable
      :data="rows"
      :columns="columns"
      :loading="loading"
    />

    <UModal
      v-model:open="modalOpen"
      :title="editing ? 'Edit extra pay' : 'Add extra pay'"
      :ui="{ content: 'sm:max-w-3xl' }"
    >
      <UForm
        id="employee-extra-pay-form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Category" name="category" required>
            <USelect
              v-model="state.category"
              :items="extraPayCategories"
              value-key="value"
              label-key="label"
              placeholder="Select category"
              class="w-full"
            />
          </UFormField>

          <UFormField
            v-if="state.category === 'cash_pay' || state.category === 'non_cash_benefits'"
            label="Option"
            name="option"
            required
          >
            <USelect
              v-model="state.option"
              :items="selectedCategoryOptions"
              value-key="value"
              label-key="label"
              placeholder="Select option"
              class="w-full"
            />
          </UFormField>

          <UFormField
            v-if="state.category === 'other_allowance' || state.option === 'other_allowance' || (state.category === 'non_cash_benefits' && state.option === 'non_cash')"
            label="Name"
            name="name"
            class="md:col-span-2"
            required
          >
            <UInput v-model="state.name" class="w-full" />
          </UFormField>

          <UFormField label="Amount" name="amount" required>
            <UInput v-model.number="state.amount" type="number" class="w-full" />
          </UFormField>

          <UFormField label="Payment rule" name="proration_type" required>
            <USelect
              v-model="state.proration_type"
              :items="prorationTypeOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Start date" name="start_date" required>
            <UInput v-model="state.start_date" type="date" class="w-full" />
          </UFormField>

          <UFormField v-if="!state.recurring" label="End date" name="end_date">
            <UInput v-model="state.end_date" type="date" class="w-full" />
          </UFormField>

          <UFormField name="recurring">
            <UCheckbox v-model="state.recurring" label="Recurring payment" />
          </UFormField>

          <UFormField name="included_in_salary">
            <UCheckbox v-model="state.included_in_salary" label="Included in salary" />
          </UFormField>

          <UFormField name="active">
            <UCheckbox v-model="state.active" label="Active" />
          </UFormField>
        </div>

        <div
          v-if="state.category === 'housing_benefit'"
          class="grid gap-4 rounded-lg border border-default p-4 md:grid-cols-2"
        >
          <UFormField label="House market value" name="housing_benefit_data.house_market_value" required>
            <UInput v-model.number="state.housing_benefit_data.house_market_value" type="number" class="w-full" />
          </UFormField>
          <UFormField label="Housing type" name="housing_benefit_data.housing_type" required>
            <USelect
              v-model="state.housing_benefit_data.housing_type"
              :items="housingTypes"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Rent covered" name="housing_benefit_data.rent_covered" required class="md:col-span-2">
            <UInput v-model.number="state.housing_benefit_data.rent_covered" type="number" class="w-full" />
          </UFormField>
        </div>

        <div
          v-if="state.category === 'non_cash_benefits' && state.option === 'car_benefit'"
          class="grid gap-4 rounded-lg border border-default p-4 md:grid-cols-2"
        >
          <UFormField label="Registration number" name="car_benefit_data.registration_number" required>
            <UInput v-model="state.car_benefit_data.registration_number" class="w-full" />
          </UFormField>
          <UFormField label="Make" name="car_benefit_data.make" required>
            <UInput v-model="state.car_benefit_data.make" class="w-full" />
          </UFormField>
          <UFormField label="Cost type" name="car_benefit_data.cost_type" required>
            <USelect
              v-model="state.car_benefit_data.cost_type"
              :items="carCostTypes"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Body type" name="car_benefit_data.body_type" required>
            <USelect
              v-model="state.car_benefit_data.body_type"
              :items="carBodyTypes"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
          <UFormField label="CC rating" name="car_benefit_data.cc_rating" required class="md:col-span-2">
            <UInput v-model.number="state.car_benefit_data.cc_rating" type="number" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" class="w-full" autoresize />
        </UFormField>

        <UFormField label="Comments" name="comments">
          <UTextarea v-model="state.comments" class="w-full" autoresize />
        </UFormField>
      </UForm>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="modalOpen = false" />
          <UButton
            form="employee-extra-pay-form"
            type="submit"
            :loading="saving"
            :label="editing ? 'Save changes' : 'Add extra pay'"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
