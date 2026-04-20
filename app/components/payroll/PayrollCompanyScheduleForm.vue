<script setup lang="ts">
import { addDays, format } from 'date-fns'
import type { AuthUser } from '~/types'
import { companyService } from '~~/services/company.service'
import { useAuthStore } from '~/stores/auth'

const emit = defineEmits(['validate-step'])
const toast = useToast()
const loading = ref(false)
const { getDateForDayOfMonth, getDayDate } = usePayrollDates()
const authStore = useAuthStore()
const { setUser } = useAuthSession()

// Interfaces
interface PayrollSettings {
  pay_day: number
  payroll_deadline_day: number
  frequency: string
  groups_paid: string[]
  pay_day_offset: number
  is_pay_day_after: boolean
  pay_day_adjustment: string
}

// Constants
const frequencies = [{ name: 'Monthly', value: 'monthly' }]
const startPeriods = [{ name: 'First day of the month', value: 1 }]
const endPeriods = [{ name: 'Last day of the month', value: 30 }]
const payWeekendAndHoliday = [
  { value: 'previous', label: 'Pay on the previous business day' },
  { value: 'next', label: 'Pay on the next business day' }
]
const payTimePeriod = ['after', 'before']

type CompanyRecord = Record<string, any>

const company = computed(
  () => ((authStore.user.value as { company?: CompanyRecord })?.company ?? {}) as CompanyRecord
)

// Form controls
const startDate = ref(1)
const endDate = ref(30)
const deadlineDate = ref(0)
const pay_day_offset = ref(0)
const is_pay_day_after = ref(true)
const pay_day_adjustment = ref('next')
const payTime = ref<'after' | 'before'>('after')
const frequency = ref('monthly')

// Checkbox controls
const includeAll = ref(false)
const includeAdmin = ref(false)
const includeManagers = ref(false)
const includeEmployees = ref(false)

function hydrateFromCompany(c: CompanyRecord) {
  deadlineDate.value = (Number(c.pay_day ?? 0)) - (Number(c.payroll_deadline_day ?? 0))
  pay_day_offset.value = Number(c.pay_day_offset || 0)
  is_pay_day_after.value = Boolean(c.is_pay_day_after ?? true)
  pay_day_adjustment.value = String(c.pay_day_adjustment || 'next')
  payTime.value = c.is_pay_day_after ? 'after' : 'before'
  frequency.value = String(c.payroll_frequency || 'monthly')
  const groups = (c.groups_paid as string[] | undefined) || []
  includeAll.value = groups.includes('all')
  includeAdmin.value = groups.includes('admin')
  includeManagers.value = groups.includes('managers')
  includeEmployees.value = groups.includes('employee')
}

watch(
  () => (authStore.user.value as { company?: CompanyRecord })?.company,
  (c) => {
    if (c) hydrateFromCompany(c)
  },
  { immediate: true, deep: true }
)

// Computed dates
const calculatedPayDate = computed(() => {
  const date = getDateForDayOfMonth(endDate.value)
  if (typeof date === 'string') return date
  const shifted =
    payTime.value === 'before'
      ? addDays(date, -pay_day_offset.value)
      : addDays(date, pay_day_offset.value)
  return format(shifted, 'yyyy-MM-dd')
})

const calculatedDeadlineDate = computed(() => {
  const payDateRaw = getDateForDayOfMonth(getDayDate(calculatedPayDate.value))
  if (typeof payDateRaw === 'string') return payDateRaw
  return format(addDays(payDateRaw, -deadlineDate.value), 'yyyy-MM-dd')
})

// Initial form data
const initialPayrollSettings: PayrollSettings = {
  pay_day: company.value.pay_day || getDayDate(calculatedPayDate.value) || 1,
  payroll_deadline_day: company.value.payroll_deadline_day || getDayDate(calculatedDeadlineDate.value) || 1,
  frequency: company.value.payroll_frequency || 'monthly',
  groups_paid: (company.value.groups_paid as string[]) || [],
  pay_day_offset: company.value.pay_day_offset || 0,
  is_pay_day_after: company.value.is_pay_day_after ?? true,
  pay_day_adjustment: company.value.pay_day_adjustment || 'next'
}

// Current form data
const payrollSettingsData = ref<PayrollSettings>({ ...initialPayrollSettings })

// Validation state
const hasAttemptedSubmit = ref(false)
type ErrorFields = 'frequency' | 'groups_paid' | 'pay_day_offset' | 'deadlineDate'
const errors = ref<Record<ErrorFields, string[]>>({
  frequency: [],
  groups_paid: [],
  pay_day_offset: [],
  deadlineDate: []
})

// Required fields (only those that have error validation)
const requiredFields: ErrorFields[] = [
  'frequency',
  'groups_paid',
  'pay_day_offset',
  'deadlineDate'
]

// Validation functions
const validateField = (field: ErrorFields) => {
  if (!hasAttemptedSubmit.value) return

  errors.value[field] = []
  
  switch (field) {
    case 'frequency':
      if (!frequency.value) {
        errors.value.frequency.push('Payroll frequency is required')
      }
      break
    
    case 'groups_paid':
      if (payrollSettingsData.value.groups_paid.length === 0) {
        errors.value.groups_paid.push('At least one employee group must be selected')
      }
      break
    
    case 'pay_day_offset':
      if (!payrollSettingsData.value.pay_day_offset) {
        errors.value.pay_day_offset.push('Pay day offset is required')
      } else if (payrollSettingsData.value.pay_day_offset < 1) {
        errors.value.pay_day_offset.push('Pay day offset must be at least 1 day')
      } else if (payrollSettingsData.value.pay_day_offset > 10) {
        errors.value.pay_day_offset.push('Pay day offset cannot exceed 10 days')
      }
      break
    
    case 'deadlineDate':
      if (deadlineDate.value === undefined || deadlineDate.value === null) {
        errors.value.deadlineDate.push('Deadline date is required')
      } else if (deadlineDate.value < 0) {
        errors.value.deadlineDate.push('Deadline date cannot be negative')
      } else if (deadlineDate.value > 10) {
        errors.value.deadlineDate.push('Deadline date cannot exceed 10 days')
      }
      break
  }
}

// Computed properties for form validation
const areRequiredFieldsFilled = computed(() => {
  return (
    frequency.value &&
    payrollSettingsData.value.groups_paid.length > 0 &&
    typeof payrollSettingsData.value.pay_day_offset === 'number' &&
    payrollSettingsData.value.pay_day_offset >= 1 &&
    typeof deadlineDate.value === 'number' &&
    deadlineDate.value >= 0
  )
})
const changed = ref(false)
const hasChanges = computed(() => {
    changed.value = JSON.stringify(payrollSettingsData.value) !== JSON.stringify(initialPayrollSettings)
  return changed.value 
});

const hasErrors = computed(() => {
  return Object.values(errors.value).some(fieldErrors => fieldErrors.length > 0)
})

// Watchers
watch([endDate, pay_day_offset, payTime, deadlineDate], () => {
  payrollSettingsData.value.pay_day = Math.min(Math.max(getDayDate(calculatedPayDate.value), 1), 30)
  payrollSettingsData.value.payroll_deadline_day = Math.min(Math.max(getDayDate(calculatedDeadlineDate.value), 1), 30)
})

watch(includeAll, (newValue) => {
  includeAdmin.value = newValue
  includeManagers.value = newValue
  includeEmployees.value = newValue
  payrollSettingsData.value.groups_paid = newValue 
    ? ['all', 'admin', 'managers', 'employee']
    : []
})

watch([includeAdmin, includeManagers, includeEmployees], () => {
  const selectedGroups = []
  if (includeAdmin.value) selectedGroups.push('admin')
  if (includeManagers.value) selectedGroups.push('managers')
  if (includeEmployees.value) selectedGroups.push('employee')

  if (selectedGroups.length === 3) {
    includeAll.value = true
    payrollSettingsData.value.groups_paid = ['all', ...selectedGroups]
  } else {
    includeAll.value = false
    payrollSettingsData.value.groups_paid = selectedGroups
  }
  
  validateField('groups_paid')
})


watch(payTime, (newValue) => {
  payrollSettingsData.value.is_pay_day_after = newValue === 'after'
})

watch(
  [hasChanges, areRequiredFieldsFilled],
  ([changes, fieldsFilled]) => {
    // Component is valid when all required fields are filled AND there are no unsaved changes
    const isValid = !changes && fieldsFilled
    emit('validate-step', fieldsFilled)
  },
  { immediate: true }
)

// Form submission
async function onsubmit() {
  hasAttemptedSubmit.value = true
  
  // Validate all fields
  requiredFields.forEach(field => validateField(field))
  
  if (hasErrors.value || !areRequiredFieldsFilled.value) {
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Please fix the validation errors',
      color: 'error'
    })
    return
  }

  loading.value = true
  try {
    const res: any = await companyService.updateCompany(String(company.value.id ?? ''), { body: payrollSettingsData.value })
    if (res.id) {
      toast.add({
        icon: 'i-heroicons-check-circle',
        title: 'Success!',
        color: 'success'
      })
      const prev = (authStore.user.value ?? {}) as AuthUser
      setUser({ ...prev, company: res as AuthUser['company'] })
      changed.value = false
      // Update initial values after successful save
    //   Object.assign(initialPayrollSettings, payrollSettingsData.value)
    } else {
      toast.add({
        icon: 'i-heroicons-x-circle',
        title: 'Something went wrong.',
        color: 'error'
      })
    }
  } catch {
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Something went wrong.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="py-4 flex h-full flex-col px-4 gap-12">
    <div class="h-90">
      <UDivider class="my-4" />
      <div class="flex flex-col gap-2">
        <h3>Payroll Settings</h3>
        <UForm 
          :state="payrollSettingsData" 
          class="space-y-6" 
          @submit.prevent="onsubmit"
        >
          <UFormGroup 
            class="flex flex-col gap-2" 
            label="Payroll Frequency"
          >
            <USelect 
              v-model="frequency" 
              :options="frequencies" 
              option-attribute="name"
            />
            <p 
              v-for="error in errors.frequency" 
              :key="error" 
              class="text-red-500 text-sm"
            >
              {{ error }}
            </p>
          </UFormGroup>

          <div class="flex flex-col gap-2 py-4">
            <UFormGroup 
              label="Select Employee Groups" 
              name="groups_paid"
            >
              <div class="flex gap-4">
                <UCheckbox v-model="includeAll" label="All" />
                <UCheckbox v-model="includeAdmin" label="Admin" />
                <UCheckbox v-model="includeManagers" label="Managers" />
                <UCheckbox v-model="includeEmployees" label="Employees" />
              </div>
              <p 
                v-for="error in errors.groups_paid" 
                :key="error" 
                class="text-red-500 text-sm"
              >
                {{ error }}
              </p>
            </UFormGroup>
          </div>

          <div class="flex flex-col gap-2">
            <h3>Pay Period</h3>
            <div class="flex items-center gap-4">
              <UFormGroup label="Start Day">
                <USelect 
                  v-model="startDate" 
                  :options="startPeriods" 
                  option-attribute="name" 
                  value-attribute="value" 
                />
              </UFormGroup>
              <UFormGroup label="End Day">
                <USelect 
                  v-model="endDate" 
                  :options="endPeriods" 
                  option-attribute="name" 
                  value-attribute="value"
                />
              </UFormGroup>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <h3>Pay Day</h3>
            <div class="flex items-center gap-2">
              <UFormGroup>
                <UInput 
                  v-model="payrollSettingsData.pay_day_offset" 
                  type="number" 
                  class="w-16" 
                  min="0" 
                  max="10"
                />
                <p 
                  v-for="error in errors.pay_day_offset" 
                  :key="error" 
                  class="text-red-500 text-sm"
                >
                  {{ error }}
                </p>
              </UFormGroup>
              <p>day(s)</p>
              <UFormGroup>
                <USelect 
                  :options="payTimePeriod" 
                  v-model="payTime"
                />
              </UFormGroup>
              <p>the period ends</p>
            </div>
          </div>

          <UFormGroup>
            <URadioGroup 
              v-model="pay_day_adjustment" 
              legend="Pay Day on Weekend/Holiday" 
              :options="payWeekendAndHoliday" 
            />
          </UFormGroup>

          <div class="flex flex-col gap-2">
            <h3>Deadline for Running Payroll</h3>
            <div class="flex items-center gap-2">
              <UFormGroup>
                <UInput 
                  type="number" 
                  class="w-16" 
                  min="0" 
                  max="10" 
                  v-model="deadlineDate"
                />
                <p 
                  v-for="error in errors.deadlineDate" 
                  :key="error" 
                  class="text-red-500 text-sm"
                >
                  {{ error }}
                </p>
              </UFormGroup>
              <p>day(s) before pay date</p>
            </div>
          </div>

          <div class="flex justify-end">
            <UButton 
              :loading="loading" 
              type="submit" 
              label="Save Changes" 
              :disabled="!changed || hasErrors"
            />
          </div>
        </UForm>
      </div>
    </div>
  </div>
</template>
