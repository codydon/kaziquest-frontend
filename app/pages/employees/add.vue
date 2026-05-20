<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import type { Employee, IDepartment, IPosition } from '~/types/employee'
import { employeeService } from '~~/services/employee.service'
import { ROUTE_LIST } from '~/constants/routeList'
import { parseApiError } from '~/utils/parseApiError'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default'
})

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const selectedDept = ref<IDepartment>({})
const selectedPos = ref<IPosition>({})
const departmentError = ref(false)
const positionError = ref(false)
const errorsFromServer = ref<Record<string, string>>({})
const showErrorFromServer = ref(false)
const showSubscriptionError = ref(false)
const excemptionCertNoErr = ref(false)
const systemAccess = ref(true)

const schema = z.object({
  full_name: z.string().min(1, 'First name is required'),
  email: z.string().email('Invalid email address'),
  date_of_birth: z.preprocess(
    val => (val === null || val === undefined ? '' : String(val)),
    z.string().min(1, 'Date of birth is required')
  ),
  salary: z.preprocess(
    v => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number({ error: 'Salary is required' }).min(1, 'Salary is required')
  ),
  start_date: z.preprocess(
    val => (val === null || val === undefined ? '' : String(val)),
    z.string().min(1, 'Start date is required')
  ),
  national_id_no: z.preprocess(
    v => (v === '' || v === undefined || v === null ? '' : String(v)),
    z.string().min(1, 'National ID is required')
  ),
  kra_pin_no: z
    .string()
    .length(11, 'KRA PIN must be 11 characters long')
    .regex(/^[A-Z].*[A-Z]$/, 'KRA PIN must start and end with a capital letter'),
  nhif_no: z.string().min(1, 'SHIF number is required'),
  nssf_no: z.string().min(1, 'NSSF number is required'),
  employee_number: z.string().min(1, 'Employee number is required'),
  employment_arrangement: z.string().min(1, 'Employment arrangement is required'),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  location: z.string().optional(),
  phone_number: z.string().optional(),
  residential_status: z.string().optional(),
  employee_type: z.string().optional(),
  currency: z.string(),
  pay_frequency: z.string(),
  self_service_access: z.boolean(),
  pwd: z.boolean(),
  excemption_cert_no: z.string().optional(),
  reports_to: z.array(z.string()).optional()
})

type Schema = z.output<typeof schema>

const employeeFormState = reactive<Schema>({
  full_name: '',
  email: '',
  date_of_birth: '',
  salary: undefined as unknown as number,
  start_date: '',
  national_id_no: '',
  kra_pin_no: '',
  nhif_no: '',
  nssf_no: '',
  employee_number: '',
  employment_arrangement: '',
  gender: '',
  marital_status: '',
  location: '',
  phone_number: '',
  residential_status: 'Resident',
  employee_type: 'Primary',
  currency: 'KES',
  pay_frequency: 'Monthly',
  self_service_access: true,
  pwd: false,
  excemption_cert_no: '',
  reports_to: []
})

const employmentArrangements = [
  'Permanent',
  'Fixed Term Contract',
  'Casual',
  'Intern',
  'Part-Time',
  'Attachment',
  'Consultant',
  'Probation'
]

const genderOptions = ['Male', 'Female']
const maritalOptions = ['Single', 'Married', 'Divorced', 'Widowed']
const residentialOptions = ['Resident', 'Non-Resident']
const employeeTypeOptions = ['Primary', 'Secondary']
const currencyOptions = ['KES', 'UGX', 'TZS', 'RWF', 'USD']
const payFrequencyOptions = ['Monthly']

function menuItems(strings: readonly string[]) {
  return strings.map(s => ({ label: s, value: s }))
}

watch(systemAccess, (enabled) => {
  employeeFormState.self_service_access = enabled
})

function setDepartment(dept: IDepartment) {
  selectedDept.value = dept
  departmentError.value = false
}

function setPosition(pos: IPosition) {
  selectedPos.value = pos
  positionError.value = false
}

function setReportsTo(value: Employee | Employee[] | Record<string, never>) {
  if (!value || typeof value !== 'object') {
    employeeFormState.reports_to = []
    return
  }
  if (Array.isArray(value)) {
    employeeFormState.reports_to = value
      .map(emp => String(emp?.user?.id || '').trim())
      .filter(Boolean)
    return
  }
  if ('user' in value || 'id' in value) {
    const emp = value as Employee
    const id = String(emp.user?.id || '').trim()
    employeeFormState.reports_to = id ? [id] : []
  }
}

function collectErrorMessages(res: Record<string, unknown>): Record<string, string> {
  const errorFields = ['nssf_no', 'national_id_no', 'kra_pin_no', 'nhif_no']
  const errorMessages: Record<string, string> = {}

  for (const field of errorFields) {
    const v = res[field]
    if (Array.isArray(v) && v.length > 0) {
      errorMessages[field] = v.map(String).join(', ')
    }
  }

  for (const [key, value] of Object.entries(res)) {
    if (!errorFields.includes(key) && Array.isArray(value) && value.length > 0) {
      errorMessages[key] = value.map(String).join(', ')
    }
  }

  return errorMessages
}

function collectServerErrorsFromHttpData(data: Record<string, unknown> | undefined): Record<string, string> {
  if (!data || typeof data !== 'object') {
    return {}
  }
  const skip = new Set(['message', 'success', 'data', 'error', 'detail', 'statusCode'])
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(data)) {
    if (skip.has(key)) {
      continue
    }
    if (Array.isArray(value) && value.length) {
      out[key] = value.map(String).join(', ')
    } else if (typeof value === 'string' && value.trim()) {
      out[key] = value
    }
  }
  return out
}

const watchFields = ['nssf_no', 'national_id_no', 'kra_pin_no', 'nhif_no'] as const
type WatchField = (typeof watchFields)[number]

watchFields.forEach((field) => {
  watch(
    () => employeeFormState[field as WatchField],
    () => {
      if (errorsFromServer.value[field]) {
        const { [field]: _, ...rest } = errorsFromServer.value
        errorsFromServer.value = rest
        if (Object.keys(errorsFromServer.value).length === 0) {
          showErrorFromServer.value = false
        }
      }
    }
  )
})

watch(
  selectedDept,
  () => {
    if (Object.keys(selectedDept.value).length > 0) {
      departmentError.value = false
    }
  },
  { deep: true }
)

watch(
  selectedPos,
  () => {
    if (Object.keys(selectedPos.value).length > 0) {
      positionError.value = false
    }
  },
  { deep: true }
)

const isEmployeeLimitReached = computed(() => unref(authStore.isEmployeeLimitReached))

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  loading.value = true
  showErrorFromServer.value = false
  errorsFromServer.value = {}
  excemptionCertNoErr.value = false

  try {
    if (Object.keys(selectedDept.value).length < 1) {
      departmentError.value = true
      return
    }
    if (Object.keys(selectedPos.value).length < 1) {
      positionError.value = true
      return
    }
    if (employeeFormState.pwd && !String(employeeFormState.excemption_cert_no || '').trim()) {
      excemptionCertNoErr.value = true
      return
    }

    employeeFormState.self_service_access = systemAccess.value

    const payload: Record<string, unknown> = {
      ...employeeFormState,
      department: selectedDept.value.id,
      position: selectedPos.value.id
    }

    if (Array.isArray(payload.reports_to) && payload.reports_to.length === 0) {
      delete payload.reports_to
    }
    if (!String(employeeFormState.excemption_cert_no || '').trim()) {
      payload.excemption_cert_no = ''
    }

    const res = await employeeService.createEmployee({
      handler: '$fetch',
      secured: true,
      body: payload
    }) as { success?: boolean, data?: { id?: unknown } } & Record<string, unknown>

    const created = res?.data && typeof res.data === 'object' && res.data.id != null
    if (res?.success === true || created) {
      toast.add({
        title: 'Employee added successfully',
        color: 'success'
      })
      await router.push(ROUTE_LIST.employees.index)
      return
    }

    const errorMessages = collectErrorMessages(res)
    if (Object.keys(errorMessages).length > 0) {
      showErrorFromServer.value = true
      errorsFromServer.value = errorMessages
    } else {
      toast.add({ title: 'Could not create employee', color: 'error' })
    }
  } catch (err: unknown) {
    const e = err as { data?: Record<string, unknown>, statusCode?: number }
    const data = e.data
    const msg = typeof data?.message === 'string' ? data.message : ''

    if (msg === 'employee_limit_reached' || e.statusCode === 402) {
      showSubscriptionError.value = true
      return
    }

    if (
      msg === 'expired'
      || msg === 'no_subscription'
    ) {
      showSubscriptionError.value = true
      return
    }

    const fieldErrs = collectServerErrorsFromHttpData(data)
    if (Object.keys(fieldErrs).length) {
      showErrorFromServer.value = true
      errorsFromServer.value = fieldErrs
      return
    }

    toast.add({
      title: parseApiError(err, 'Failed, something went wrong'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const user = computed(() => unref(authStore.user) as Record<string, unknown> | undefined)

useSeoMeta({
  title: computed(() => {
    const company = user.value?.company as Record<string, unknown> | undefined
    const name = company?.name
    return `${typeof name === 'string' && name ? name : 'KaziQuest'} - add employee`
  }),
  description: 'Create a new employee in your company.'
})
</script>

<template>
  <UDashboardPanel id="employees-add">
    <template #header>
      <DashboardPageHeader
        title="Add New Employee"
        breadcrumb="Dashboard / Employees / Add New Employee"
        :back-to="ROUTE_LIST.employees.index"
      >
        <template #right>
          <UserMenu avatar-only class="shrink-0" />
        </template>
      </DashboardPageHeader>
    </template>

    <template #body>
      <div class="mx-auto w-full max-w-3xl px-3 pb-6 pt-1 sm:px-4">
        <div
          v-if="showSubscriptionError || isEmployeeLimitReached"
          class="mb-3 flex flex-wrap items-center justify-center gap-2 rounded-md bg-red-100 px-2 py-2 text-sm text-red-500 dark:bg-red-950/40 dark:text-red-300"
        >
          <span>Maximum employee limit reached. Upgrade your plan to add more.</span>
          <UButton
            label="Upgrade Plan"
            variant="outline"
            color="error"
            size="sm"
            :to="ROUTE_LIST.settings.billing"
          />
        </div>

        <UForm
          :schema="schema"
          :state="employeeFormState"
          class="space-y-3"
          @submit="onSubmit"
        >
          <div class="grid grid-cols-1 gap-x-5 gap-y-2.5 md:grid-cols-2">
            <UFormField
              label="Full name"
              name="full_name"
              required
            >
              <UInput
                v-model="employeeFormState.full_name"
                class="w-full max-w-md capitalize"
                placeholder="Enter full name"
                type="text"
              />
            </UFormField>
            <UFormField
              label="Email"
              name="email"
              required
            >
              <UInput
                v-model="employeeFormState.email"
                class="w-full max-w-md"
                placeholder="Enter email"
                type="email"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-x-5 gap-y-2.5 md:grid-cols-2 md:items-start">
            <div class="min-w-0">
              <EmployeesDepartmentPosition
                @selected-department="setDepartment"
                @selected-position="setPosition"
              />
              <div class="mt-1 flex min-h-5 flex-wrap items-center gap-2">
                <span v-if="departmentError" class="text-xs text-red-500">Please select a department</span>
                <span v-if="positionError" class="text-xs text-red-500">Please select a position</span>
              </div>
            </div>
            <div class="min-w-0 max-w-md">
              <EmployeeSelect title="Reports To" @selected="setReportsTo" />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-x-5 gap-y-2.5 md:grid-cols-2">
            <UFormField label="Phone Number" name="phone_number">
              <UInput
                v-model="employeeFormState.phone_number"
                class="w-full max-w-xs"
                type="tel"
                placeholder="Phone number"
              />
            </UFormField>
            <UFormField label="Marital status" name="marital_status">
              <USelectMenu
                v-model="employeeFormState.marital_status"
                :items="menuItems(maritalOptions)"
                value-key="value"
                label-key="label"
                placeholder="Select marriage status"
                class="w-full max-w-md"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-x-5 gap-y-2.5 md:grid-cols-2">
            <UFormField
              label="Date of birth"
              name="date_of_birth"
              required
            >
              <UInput
                v-model="employeeFormState.date_of_birth"
                class="w-full max-w-xs"
                type="date"
              />
            </UFormField>
            <UFormField
              label="Date of employment"
              name="start_date"
              required
            >
              <UInput
                v-model="employeeFormState.start_date"
                class="w-full max-w-xs"
                type="date"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-x-5 gap-y-2.5 md:grid-cols-2 md:items-end">
            <UFormField label="Gender" name="gender">
              <USelectMenu
                v-model="employeeFormState.gender"
                :items="menuItems(genderOptions)"
                value-key="value"
                label-key="label"
                placeholder="Select gender"
                class="w-full max-w-xs"
              />
            </UFormField>
            <UFormField label="Salary" name="salary">
              <div class="flex max-w-md flex-nowrap items-center gap-2">
                <UInput
                  v-model.number="employeeFormState.salary"
                  class="w-32 min-w-0 shrink-0"
                  placeholder="Amount"
                  type="number"
                />
                <USelect
                  v-model="employeeFormState.currency"
                  :items="currencyOptions.map(c => ({ label: c, value: c }))"
                  value-key="value"
                  label-key="label"
                  placeholder="Currency"
                  class="w-24 shrink-0"
                />
                <USelect
                  v-model="employeeFormState.pay_frequency"
                  :items="payFrequencyOptions.map(c => ({ label: c, value: c }))"
                  value-key="value"
                  label-key="label"
                  placeholder="Pay frequency"
                  class="w-32 shrink-0"
                />
              </div>
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-x-5 gap-y-2.5 md:grid-cols-2">
            <UFormField
              label="NSSF number"
              name="nssf_no"
              required
            >
              <UInput
                v-model="employeeFormState.nssf_no"
                class="w-full max-w-xs"
                placeholder="Enter NSSF"
                type="text"
                maxlength="10"
              />
            </UFormField>
            <UFormField label="Location" name="location">
              <UInput
                v-model="employeeFormState.location"
                class="w-full max-w-md"
                placeholder="Enter location"
                type="text"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-x-5 gap-y-2.5 md:grid-cols-2">
            <UFormField
              label="Employee Number"
              name="employee_number"
              required
            >
              <UInput
                v-model="employeeFormState.employee_number"
                class="w-full max-w-xs"
                placeholder="Enter employee number"
                type="text"
              />
            </UFormField>
            <UFormField
              label="National ID"
              name="national_id_no"
              required
            >
              <UInput
                v-model="employeeFormState.national_id_no"
                class="w-full max-w-xs"
                placeholder="Enter national ID"
                type="text"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-x-5 gap-y-2.5 md:grid-cols-2">
            <UFormField
              label="KRA PIN"
              name="kra_pin_no"
              required
            >
              <UInput
                v-model="employeeFormState.kra_pin_no"
                class="w-full max-w-[12rem] font-mono text-sm tracking-wide"
                placeholder="Enter KRA pin"
                type="text"
              />
            </UFormField>
            <UFormField
              label="SHIF number"
              name="nhif_no"
              required
            >
              <UInput
                v-model="employeeFormState.nhif_no"
                class="w-full max-w-xs"
                placeholder="Enter SHIF Number"
                type="text"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-x-5 gap-y-2.5 md:grid-cols-3">
            <UFormField
              label="Residential status"
              name="residential_status"
              required
            >
              <USelectMenu
                v-model="employeeFormState.residential_status"
                :items="menuItems(residentialOptions)"
                value-key="value"
                label-key="label"
                placeholder="Select residential status"
                class="w-full max-w-xs"
              />
            </UFormField>
            <UFormField
              label="Employment Arrangement"
              name="employment_arrangement"
              required
            >
              <USelectMenu
                v-model="employeeFormState.employment_arrangement"
                :items="menuItems(employmentArrangements)"
                value-key="value"
                label-key="label"
                placeholder="Select employment arrangement"
                class="w-full max-w-md"
              />
            </UFormField>
            <UFormField
              label="Employee type"
              name="employee_type"
              required
            >
              <USelectMenu
                v-model="employeeFormState.employee_type"
                :items="menuItems(employeeTypeOptions)"
                value-key="value"
                label-key="label"
                placeholder="Select employee type"
                class="w-full max-w-xs"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-x-5 gap-y-2 md:grid-cols-2 md:items-start">
            <div class="flex items-center gap-2.5">
              <USwitch v-model="employeeFormState.pwd" />
              <span class="text-sm leading-snug">Person With Disabilty?</span>
            </div>
            <UFormField
              v-if="employeeFormState.pwd"
              label="Excemption Certificate Number"
              name="excemption_cert_no"
              required
            >
              <UInput
                v-model="employeeFormState.excemption_cert_no"
                class="w-full max-w-md"
                placeholder="Enter excemption certificate number"
                type="text"
              />
              <p v-if="excemptionCertNoErr" class="mt-1 text-xs text-red-500">
                excemption certificate number is required
              </p>
            </UFormField>
          </div>

          <UFormField label="System Access" class="w-full max-w-3xl">
            <div class="flex items-start gap-2.5">
              <USwitch v-model="systemAccess" class="mt-0.5 shrink-0" />
              <div class="text-xs leading-relaxed text-muted sm:text-sm">
                <span v-if="systemAccess">Allow Access to KaziQuest: Enable this option if you wish to provide the employee
                  with access to the KaziQuest platform.</span>
                <span v-else>No Access: The employee will not have access and will be unable to log in to KaziQuest.</span>
              </div>
            </div>
          </UFormField>

          <div
            v-if="showErrorFromServer"
            class="rounded border-l-4 border-red-500 bg-red-50 p-2 text-sm shadow dark:bg-red-950/30"
          >
            <p class="font-medium">
              Correct the following errors to continue:
            </p>
            <ul class="mt-1 list-inside list-disc">
              <li
                v-for="(errorMsg, field) in errorsFromServer"
                :key="field"
                class="text-red-500"
              >
                {{ String(field).replace(/_/g, ' ').toUpperCase() }}: {{ errorMsg }}
              </li>
            </ul>
          </div>

          <UButton
            v-else-if="!showSubscriptionError && !isEmployeeLimitReached"
            :loading="loading"
            type="submit"
            label="Add"
            icon="i-lucide-plus"
            class="max-w-md"
            block
          />
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
