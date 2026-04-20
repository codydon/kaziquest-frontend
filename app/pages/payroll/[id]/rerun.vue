<script setup lang="ts">
import { payrollService } from '~~/services/payroll.service'
import { ROUTE_LIST } from '~/constants/routeList'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const payrollStore = usePayrollStore()

type RerunDraft = {
  v: 1;
  updatedAt: number;
  excludedIds: string[];
};

const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

const loading = ref(true)
const rerunning = ref(false)
const validating = ref(false)
const hasValidated = ref(false)

const issuesBlockRef = ref<HTMLElement | null>(null)

const validationIssues = ref<any[]>([])
const validationErrorMessage = ref<string>('')

const getIssueSeverity = (issue: any) => String(issue?.severity || 'error').toLowerCase()
const isWarningIssue = (issue: any) => getIssueSeverity(issue) === 'warning'
const getIssueCode = (issue: any) => String(issue?.code || '')
const formatMoney = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0)
}

const openWarningPayslipDetails = async (issue: any) => {
  const payslipId = issue?.meta?.payslip_id
  if (!payslipId) {
    toast.add({
      title: 'Payslip not available',
      description: 'The payslip details are not ready yet.',
      color: 'warning'
    })
    return
  }

  try {
    const payslip: any = await payrollService.getPayslip(String(payslipId))
    payrollStore.setPayslipToView(payslip)
    payrollStore.setupPayslipId(String(payslipId))
    await navigateTo(`/payroll/payslip/${payslip?.employee?.employee_id}/details`)
  } catch (error: any) {
    toast.add({
      title: 'Unable to open payslip',
      description: error?.message || 'Please try again in a moment.',
      color: 'error'
    })
  }
}

const coverageEmployees = ref<any[]>([]) // All valid employees from coverage
const backendExcludedEmployees = ref<any[]>([]) // Employees excluded from backend (locked or manual)
const originalBackendExcluded = ref<Map<string, any>>(new Map()) // Original backend excluded for restoration
const newJoiningEmployees = ref<any[]>([]) // New employees from backend
const userExcludedIds = ref<string[]>([]) // User's exclusion choices
const payrollPeriod = ref<any>(null) // Period info from coverage
const payrollName = ref<string>('') // Payroll name from coverage
const isOffCycle = ref<boolean>(false) // Off-cycle flag from coverage

// Search/Filter state
const searchQuery = ref('')
const selectedDepartment = ref<string | undefined>(undefined)
const payrollId = computed(() => String(route.params.id || ''))
const draftStorageKey = computed(() => `payroll:rerun:draft:${payrollId.value}`)

const getEmployeeId = (emp: any): string => {
  const id = emp?.id ?? emp?.employee_id ?? emp?.user?.id
  return id ? String(id) : ''
}

// Helper sets for quick lookups
const userExcludedSet = computed(() => new Set(userExcludedIds.value))
const backendExcludedIds = computed(() => new Set(backendExcludedEmployees.value.map(getEmployeeId).filter(Boolean)))

const isExcluded = (id?: string) => !!id && userExcludedSet.value.has(String(id))

// EMPLOYEE CATEGORIES

// 1. Originally included = coverage employees that are NOT new joining
const originallyIncludedEmployees = computed(() => {
  return coverageEmployees.value.filter(emp => !emp.is_new_joining)
})

// 2. New joining (from backend)
const newEmployees = computed(() => {
  return newJoiningEmployees.value
})

// Get unique departments for filter dropdown
const departments = computed(() => {
  const depts = new Set<string>()
  coverageEmployees.value.forEach(emp => {
    if (emp.department) depts.add(emp.department)
  })
  return Array.from(depts).sort()
})

// Filter helper
const matchesFilter = (emp: any): boolean => {
  const query = searchQuery.value.toLowerCase().trim()
  const dept = selectedDepartment.value
  
  // Department filter
  if (dept && emp.department !== dept) return false
  
  // Search filter
  if (query) {
    const name = (emp.name || emp.full_name || '').toLowerCase()
    const empNum = (emp.employee_number || '').toLowerCase()
    const position = (emp.position || '').toLowerCase()
    const department = (emp.department || '').toLowerCase()
    
    if (!name.includes(query) && !empNum.includes(query) && !position.includes(query) && !department.includes(query)) {
      return false
    }
  }
  
  return true
}

// DISPLAY LISTS

// Currently included: originally included + new joining - user excluded (with filter)
const displayedIncludedEmployees = computed(() => {
  const allIncluded = [...originallyIncludedEmployees.value, ...newEmployees.value]
  return allIncluded
    .filter(emp => !userExcludedSet.value.has(getEmployeeId(emp)))
    .filter(matchesFilter)
})

// Currently excluded: backend excluded + user-excluded employees
const excludedEmployees = computed(() => {
  const excluded: any[] = []
  const seen = new Set<string>()
  
  // Backend excluded employees (locked or manual)
  backendExcludedEmployees.value.forEach(emp => {
    const id = getEmployeeId(emp)
    if (id && !seen.has(id)) {
      seen.add(id)
      excluded.push({ ...emp, exclusion_type: 'previously_excluded' })
    }
  })
  
  // User excluded from included list
  originallyIncludedEmployees.value.forEach(emp => {
    const id = getEmployeeId(emp)
    if (id && userExcludedSet.value.has(id) && !seen.has(id)) {
      seen.add(id)
      excluded.push({ ...emp, exclusion_type: 'newly_excluded', exclusion_reason: 'You excluded this employee', can_include: true })
    }
  })
  
  // User excluded from new joining
  newEmployees.value.forEach(emp => {
    const id = getEmployeeId(emp)
    if (id && userExcludedSet.value.has(id) && !seen.has(id)) {
      seen.add(id)
      excluded.push({ ...emp, exclusion_type: 'newly_excluded', exclusion_reason: 'You excluded this employee', can_include: true })
    }
  })
  
  return excluded
})

// Filtered excluded employees
const filteredExcludedEmployees = computed(() => {
  return excludedEmployees.value.filter(matchesFilter)
})

// COUNTS (unfiltered for accuracy)
const includedCount = computed(() => {
  const originalIncluded = originallyIncludedEmployees.value.filter(emp => !userExcludedSet.value.has(getEmployeeId(emp))).filter(matchesFilter).length
  const newIncluded = newEmployees.value.filter(emp => !userExcludedSet.value.has(getEmployeeId(emp))).filter(matchesFilter).length
  return originalIncluded + newIncluded
})

const newJoiningIncludedCount = computed(() => {
  return newEmployees.value.filter(emp => !userExcludedSet.value.has(getEmployeeId(emp))).filter(matchesFilter).length
})

const excludedCount = computed(() => filteredExcludedEmployees.value.length)

const hasActiveFilter = computed(() => searchQuery.value.trim().length > 0 || selectedDepartment.value)

// Final employee IDs for API
const currentlyIncludedIds = computed<Set<string>>(() => {
  const ids = new Set<string>()
  
  // Add displayed included (original employees not excluded)
  displayedIncludedEmployees.value.forEach(emp => {
    const id = getEmployeeId(emp)
    if (id) ids.add(id)
  })
  
  // Add new joining that are not excluded
  newEmployees.value.forEach(emp => {
    const id = getEmployeeId(emp)
    if (id && !userExcludedSet.value.has(id)) ids.add(id)
  })
  
  return ids
})

const blockingIssues = computed<any[]>(() => {
  const included = currentlyIncludedIds.value
  return (validationIssues.value || []).filter((i: any) => {
    const id = i?.employee_id ? String(i.employee_id) : ''
    if (!id || !included.has(id)) return false
    return (i?.issues || []).some((issue: any) => !isWarningIssue(issue))
  })
})

const warningIssues = computed<any[]>(() => {
  const included = currentlyIncludedIds.value
  return (validationIssues.value || [])
    .map((employeeIssue: any) => {
      const id = employeeIssue?.employee_id ? String(employeeIssue.employee_id) : ''
      if (!id || !included.has(id)) return null

      const warnings = (employeeIssue?.issues || []).filter((issue: any) => isWarningIssue(issue))
      if (!warnings.length) return null

      return {
        ...employeeIssue,
        issues: warnings
      }
    })
    .filter(Boolean)
})

const hasNewEmployeesToInclude = computed(() => {
  return newEmployees.value.some((e: any) => !userExcludedSet.value.has(getEmployeeId(e)))
})

const needsValidation = computed(() => {
  // Needs validation if there are new employees to include OR employee list was modified
  return !hasValidated.value && (hasNewEmployeesToInclude.value || userExcludedIds.value.length > 0 || backendExcludedEmployees.value.length < originalBackendExcluded.value.size)
})

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const extractIssuesFromProgress = (payload: any): any[] => {
  const issues = payload?.data?.issues
  if (Array.isArray(issues)) return issues
  if (Array.isArray(issues?.details?.issues)) return issues.details.issues
  return []
}

const waitForRerunOutcome = async (payrollId: string) => {
  const attempts = 8

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await sleep(1500)

    const { data, error }: any = await payrollService.getPayrollProgress(payrollId)
    if (error?.value) continue

    const payload = data.value
    const isComplete = Boolean(payload?.data?.is_complete)
    if (!isComplete) continue

    return {
      issues: extractIssuesFromProgress(payload),
      status: payload?.data?.status,
    }
  }

  return null
}

// ACTIONS

const excludeEmployee = (employee: any) => {
  const id = getEmployeeId(employee)
  if (!id) return
  
  // Check if this employee was originally backend excluded
  const originalExcluded = originalBackendExcluded.value.get(id)
  
  if (originalExcluded) {
    // Restore to backend excluded list
    if (!backendExcludedEmployees.value.find(e => getEmployeeId(e) === id)) {
      backendExcludedEmployees.value = [...backendExcludedEmployees.value, originalExcluded]
    }
    // Remove from coverage/new joining lists
    coverageEmployees.value = coverageEmployees.value.filter(e => getEmployeeId(e) !== id)
    newJoiningEmployees.value = newJoiningEmployees.value.filter(e => getEmployeeId(e) !== id)
  } else {
    // Regular user exclusion
    if (!userExcludedIds.value.includes(id)) {
      userExcludedIds.value = [...userExcludedIds.value, id]
    }
  }
}

const includeEmployee = (employee: any) => {
  const id = getEmployeeId(employee)
  if (!id) return
  
  // Remove from user exclusions if present
  userExcludedIds.value = userExcludedIds.value.filter(eid => eid !== id)
  
  // Find the employee in backend excluded
  const emp = backendExcludedEmployees.value.find(e => getEmployeeId(e) === id)
  
  // Remove from backend excluded employees
  backendExcludedEmployees.value = backendExcludedEmployees.value.filter(e => getEmployeeId(e) !== id)
  
  // Add to appropriate list based on whether it's a new joining employee
  if (emp) {
    const isNewJoining = emp.is_new_joining === true
    
    if (isNewJoining) {
      // Add to new joining list if not already there
      if (!newJoiningEmployees.value.find(e => getEmployeeId(e) === id)) {
        newJoiningEmployees.value = [...newJoiningEmployees.value, emp]
      }
    } else {
      // Add to coverage employees if not already there
      if (!coverageEmployees.value.find(e => getEmployeeId(e) === id)) {
        coverageEmployees.value = [...coverageEmployees.value, emp]
      }
    }
  }
}

const excludeAllNew = () => {
  const newIds = newEmployees.value.map(getEmployeeId).filter(Boolean)
  userExcludedIds.value = Array.from(new Set([...userExcludedIds.value, ...newIds]))
}

const includeAllExcludedNew = () => {
  const newIds = new Set(newEmployees.value.map(getEmployeeId).filter(Boolean))
  userExcludedIds.value = userExcludedIds.value.filter(id => !newIds.has(id))
}

const validatePayrollForEmployeeIds = async (employeeIds: string[]) => {
  if (!employeeIds?.length) return
  if (!payrollPeriod.value?.from_date || !payrollPeriod.value?.to_date || !payrollPeriod.value?.pay_date) return

  validating.value = true
  try {
    validationIssues.value = []
    validationErrorMessage.value = ''
    const payload: Record<string, any> = {
      payroll_id: payrollId.value,
      employee_ids: employeeIds,
      excluded_employee_ids: userExcludedIds.value,
      name: payrollName.value || 'Payroll validation',
      pay_date: payrollPeriod.value.pay_date,
      from_date: payrollPeriod.value.from_date,
      to_date: payrollPeriod.value.to_date,
      start_payroll: false,
      is_off_cycle: !!isOffCycle.value
    }

    const { error, status, data }: Record<string, any> = await payrollService.runPayroll(payload)

    if (error?.value?.data) {
      // Capture structured issues
      validationIssues.value = error.value?.data?.data?.issues ?? []
      // Capture top-level error message (e.g., "No employees have jobs overlapping...")
      if (error.value?.data?.message && !validationIssues.value.length) {
        validationErrorMessage.value = error.value.data.message
      }
      return
    }

    if (status.value === 'success' && data.value) {
      validationIssues.value = data.value?.data?.issues ?? []
    }
  } catch (err: any) {
    toast.add({
      title: 'Validation failed',
      description: err?.message || 'Failed to validate payroll',
      color: 'error'
    })
  } finally {
    validating.value = false
  }
}

const validateCurrentDraft = async (): Promise<boolean> => {
  const ids = Array.from(currentlyIncludedIds.value)
  if (!ids.length) {
    validationIssues.value = []
    hasValidated.value = true
    return true
  }

  await validatePayrollForEmployeeIds(ids)
  await nextTick()

  if ((blockingIssues.value.length > 0 || validationErrorMessage.value) && import.meta.client) {
    issuesBlockRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    toast.add({
      title: 'Payroll issues detected',
      description: validationErrorMessage.value || 'Fix the issues (or exclude the employee) before rerunning.',
      color: 'error'
    })
    hasValidated.value = false
    return false
  }

  if (warningIssues.value.length > 0 && import.meta.client) {
    toast.add({
      title: 'Payroll warnings detected',
      description: 'Some employees will be rerun with warnings. Review them before confirming.',
      color: 'warning'
    })
  }

  hasValidated.value = true
  return true
}

const handleValidate = async () => {
  await validateCurrentDraft()
}

const readDraftFromSession = (): RerunDraft | null => {
  try {
    if (!import.meta.client) return null
    const raw = sessionStorage.getItem(draftStorageKey.value)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RerunDraft
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.excludedIds)) return null
    if (typeof parsed.updatedAt !== 'number') return null
    if (Date.now() - parsed.updatedAt > DRAFT_TTL_MS) return null
    return { ...parsed, excludedIds: parsed.excludedIds.map(String) }
  } catch {
    return null
  }
}

const writeDraftToSession = (ids: string[]) => {
  try {
    if (!import.meta.client) return
    const payload: RerunDraft = { v: 1, updatedAt: Date.now(), excludedIds: ids.map(String) }
    sessionStorage.setItem(draftStorageKey.value, JSON.stringify(payload))
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

const clearDraftFromSession = () => {
  try {
    if (!import.meta.client) return
    sessionStorage.removeItem(draftStorageKey.value)
  } catch {
    // ignore
  }
}

watch(
  () => userExcludedIds.value,
  (ids) => {
    writeDraftToSession(ids)
    // Reset validation when user changes inclusions/exclusions
    if (hasValidated.value) {
      hasValidated.value = false
    }
  },
  { deep: true }
)

// Reset validation when included employees change
watch(
  () => coverageEmployees.value,
  () => {
    if (hasValidated.value) {
      hasValidated.value = false
    }
  },
  { deep: true }
)

// Reset validation when new joining employees change
watch(
  () => newJoiningEmployees.value,
  () => {
    if (hasValidated.value) {
      hasValidated.value = false
    }
  },
  { deep: true }
)

// Fetch payroll coverage (single-shot)
onMounted(async () => {
  try {
    loading.value = true
    
    const headers = useAuthHeader()
    const base = useBaseUrl()

    // Fetch coverage - contains all needed data
    const {data, error}: any = await payrollService.getPayrollCoverage({
      body: {
        payroll_id: payrollId.value,
        include_excluded_details: true
      }
    })
    if (error.value) {
      throw new Error(error.value.data?.message || 'Failed to load payroll coverage data')
    }

    const coverageData = data.value?.data || {}
    // Extract period and metadata from coverage response
    payrollPeriod.value = coverageData?.period || {}
    payrollName.value = coverageData?.payroll_name || ''
    isOffCycle.value = coverageData?.is_off_cycle || false
    // Set period context for this payroll
    if (payrollPeriod.value?.from_date && payrollPeriod.value?.to_date && payrollPeriod.value?.pay_date) {
      payrollStore.setCurrentPeriod(
        payrollPeriod.value.from_date,
        payrollPeriod.value.to_date,
      )
      const periodKey = payrollStore.generatePeriodKey(
        payrollPeriod.value.from_date,
        payrollPeriod.value.to_date,
      )
      const initial = (coverageData?.excluded_employee_ids || []) as string[]
      payrollStore.setEmployeesExcluded(initial.map(String), periodKey)
    }

    const employeesPayload = coverageData?.employees || {}
    
    // Set coverage employees (all valid employees)
    coverageEmployees.value = employeesPayload.included || []
    
    // Store ALL backend excluded employees (both locked and manual)
    backendExcludedEmployees.value = employeesPayload.excluded || []
    
    // Track original backend excluded for restoration
    originalBackendExcluded.value = new Map()
    backendExcludedEmployees.value.forEach(emp => {
      const id = getEmployeeId(emp)
      if (id) {
        originalBackendExcluded.value.set(id, emp)
      }
    })
    
    // Set new joining employees (from backend)
    newJoiningEmployees.value = employeesPayload.new_joining || []
    
    // Set validation issues
    validationIssues.value = coverageData?.validation?.issues || []
    hasValidated.value = validationIssues.value.length === 0

    // Initialize user exclusions from session draft
    // User exclusions are separate from backend exclusions
    const draft = readDraftFromSession()
    userExcludedIds.value = draft?.excludedIds || []
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to load payroll data',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
})

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

// Handle rerun payroll
const handleRerunPayroll = async () => {
  try {
    // Validate first if not yet validated (safety check)
    if (rerunning.value || validating.value) return
    if (needsValidation.value) {
      const ok = await validateCurrentDraft()
      if (!ok) return
    }

    const warnNote = warningIssues.value.length
      ? ` ${warningIssues.value.length} warning(s) will remain visible after rerun.`
      : ''
    const ok = confirm(
      `Rerun payroll for “${payrollName.value}”? This clears current payroll data, reverses deductions, and recalculates payslips.${warnNote}`
    )
    if (!ok) return

    rerunning.value = true

    // Build excluded IDs: user exclusions + currently backend excluded employees
    const backendExcludedIds = backendExcludedEmployees.value
      .map(emp => getEmployeeId(emp))
      .filter(Boolean)
    
    const allExcludedIds = Array.from(new Set([...userExcludedIds.value, ...backendExcludedIds]))

    const payload: any = {
      payroll_id: route.params.id,
      employee_ids: Array.from(currentlyIncludedIds.value),
      excluded_employee_ids: allExcludedIds,
      start_payroll: true,
    }

    const { data, error } = await payrollService.rerunPayroll({ body: payload })

    if (error.value) {
      const errorMessage = error.value.data?.message || 'An unexpected error occurred during rerun. Please try again.'
      
      // Show error alert in the UI (similar to validation issues)
      validationErrorMessage.value = errorMessage
      
      // Clear stale validation issues so button is not disabled
      validationIssues.value = []
      hasValidated.value = false
      
      // Scroll to error
      await nextTick()
      if (issuesBlockRef.value && import.meta.client) {
        issuesBlockRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      
      
      rerunning.value = false
      return
    }

    // const payrollId = route.params.id
    
    // Clear store states before navigation
    payrollStore.clearEmployeesExcluded()
    payrollStore.selectedPayPeriod = {}
    clearDraftFromSession()
    await nextTick()

    // Show success toast (async started)
    toast.add({
      title: 'Payroll Rerun Started',
      description: `${payrollName.value} is being rerun. Monitoring progress...`,
      color: 'info',
      icon: 'i-heroicons-clock'
    })

    const outcome = await waitForRerunOutcome(String(route.params.id))

    if (outcome?.issues?.length) {
      validationIssues.value = outcome.issues
      validationErrorMessage.value = ''
      hasValidated.value = true
      rerunning.value = false

      await nextTick()
      if (issuesBlockRef.value && import.meta.client) {
        issuesBlockRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }

      toast.add({
        title: 'Payroll rerun completed with warnings',
        description: 'Payslips were generated, but some employees need review before approval.',
        color: 'warning',
        icon: 'i-heroicons-exclamation-circle'
      })
      return
    }

    await navigateTo(ROUTE_LIST.payroll.history)
  } catch (err: any) {
    
    const errorMessage = err?.message || 'An unexpected error occurred. Please try again or contact support.'
    
    // Show error alert in the UI
    validationErrorMessage.value = errorMessage
    
    // Clear stale validation issues so button is not disabled
    validationIssues.value = []
    hasValidated.value = false
    
    // Scroll to error
    await nextTick()
    if (issuesBlockRef.value && import.meta.client) {
      issuesBlockRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    
    rerunning.value = false
  } finally {
    rerunning.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-white rounded-lg p-3">
    <UButton @click="router.back()" variant="link" size="sm" icon="i-heroicons-chevron-left" label="back" class="ml-4 mt-4" />
    <UProgress v-if="loading" animation="carousel" />

    <div v-else class="p-4 md:p-6 max-w-7xl mx-auto pb-24">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-2">
        <div>
          <h1 class="text-lg font-semibold text-gray-900">Rerun Payroll</h1>
          <p class="text-sm text-gray-500">{{ payrollName }}</p>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="mb-4">
        <UAlert
          v-if="backendExcludedEmployees.length > 0 && displayedIncludedEmployees.length === 0"
          color="info"
          variant="soft"
          icon="i-heroicons-information-circle"
          title="Rerun Information"
          :description="`${backendExcludedEmployees.length} employee${backendExcludedEmployees.length > 1 ? 's have' : ' has'} been auto-excluded.`"
        />
      </div>

      <div class="grid grid-cols-2 gap-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
        <div class="text-center p-3 bg-white rounded-lg shadow-sm border border-green-100 hover:shadow-md transition-shadow">
          <div class="text-xl font-bold text-green-600">{{ includedCount }}</div>
          <div class="text-xs font-medium text-gray-600">Included Employees</div>
          <div v-if="newJoiningIncludedCount > 0" class="text-xs text-amber-600 mt-0.5">
            {{ newJoiningIncludedCount }} new joining
          </div>
        </div>
        <div class="text-center p-3 bg-white rounded-lg shadow-sm border border-red-100 hover:shadow-md transition-shadow">
          <div class="text-xl font-bold text-red-600">{{ excludedCount }}</div>
          <div class="text-xs font-medium text-gray-600">Excluded Employees</div>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="mt-4 flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="searchQuery"
          placeholder="Search by name, employee number, position..."
          icon="i-heroicons-magnifying-glass"
          size="sm"
          class="flex-1"
        >
          <template #trailing>
            <UButton
              v-if="searchQuery"
              color="neutral"
              variant="link"
              icon="i-heroicons-x-mark"
              :padded="false"
              @click="searchQuery = ''"
            />
          </template>
        </UInput>
        <USelectMenu
          v-model="selectedDepartment"
          :options="[{ label: 'All Departments', value: null }, ...departments.map(d => ({ label: d, value: d }))]"
          placeholder="Filter by department"
          size="sm"
          class="w-full sm:w-48"
          value-attribute="value"
          option-attribute="label"
        />
        <!-- <UTooltip text="Clear all filters">
          <UButton
            v-if="hasActiveFilter"
            icon="i-mdi-filter-remove-outline"
            color="neutral"
            variant="soft"
            size="sm"
            @click="() => { searchQuery = ''; selectedDepartment = undefined }"
          />
        </UTooltip> -->
        <UTooltip text="Clear all filters ">
          <UButton icon="i-mdi-filter-remove-outline" color="neutral" @click="() => { searchQuery = ''; selectedDepartment = undefined }" />
        </UTooltip>
      </div>

      <div class="mt-4 space-y-3">
        <UAlert
          v-if="validating"
          title="Validating…"
          description="Checking payroll requirements for included employees."
          color="primary"
          variant="soft"
          icon="i-heroicons-arrow-path"
        />

        <div ref="issuesBlockRef">
          <UAlert
            v-if="validationErrorMessage"
            title="An unexpected error occurred during payroll rerun. Please try again or contact support if the problem persists."
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
          >
            <template #description>
              <p class="text-sm text-gray-600">
                {{ validationErrorMessage }}
              </p>
            </template>
          </UAlert>

          <UAlert
            v-if="blockingIssues.length > 0"
            title="Issues detected"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
          >
            <template #description>
              <div class="space-y-2">
                <p class="text-sm text-gray-600">
                  Fix the issues below (or exclude the employee) before rerunning.
                </p>
                <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li v-for="(issue, idx) in blockingIssues" :key="idx">
                    <span class="font-medium">{{ issue?.name }}</span>
                    <span v-if="issue?.issues?.length"> — </span>
                    <span v-for="(iss, jIndex) in issue?.issues" :key="jIndex" class="capitalize">
                      {{ iss?.issue_name }}<span v-if="Number(jIndex) < issue.issues.length - 1">, </span>
                    </span>
                  </li>
                </ul>
              </div>
            </template>
          </UAlert>

          <UAlert
            v-if="warningIssues.length > 0"
            title="Negative Net Pay Warning"
            color="warning"
            variant="soft"
            icon="i-heroicons-exclamation-circle"
            class="mt-3"
          >
            <template #description>
              <div class="space-y-3 text-sm text-gray-700">
                <div
                  v-for="(issue, idx) in warningIssues"
                  :key="`warning-${idx}`"
                  class="space-y-1"
                >
                  <template v-for="(iss, jIndex) in issue?.issues" :key="`issue-${idx}-${jIndex}`">
                    <div
                      v-if="getIssueCode(iss) === 'negative_net_pay' && iss?.meta?.breakdown"
                      class="space-y-1"
                    >
                      <p>
                        <span class="font-medium">{{ issue?.name }}</span>:
                        Custom deductions <span class="font-medium">KES {{ formatMoney(iss.meta.breakdown.custom_deductions) }}</span>
                        caused net pay to fall to <span class="font-medium">KES {{ formatMoney(Number(iss.meta.breakdown.net_pay || 0)) }}</span>.
                      </p>
                      <UButton
                        variant="link"
                        color="warning"
                        class="px-0 text-xs font-medium"
                        label="View details"
                        @click="openWarningPayslipDetails(iss)"
                      />
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </UAlert>
        </div>
      </div>

      <!-- Two-Column Layout: Included & Excluded -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <!-- Included Employees -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <UIcon name="i-heroicons-check-circle" class="text-green-500 mr-1" />
              Included ({{ displayedIncludedEmployees.length }}<span v-if="searchQuery || selectedDepartment" class="text-gray-400"> of {{ [...originallyIncludedEmployees, ...newEmployees].filter(emp => !userExcludedSet.has(getEmployeeId(emp))).length }}</span>)
            </h2>
            <div v-if="newJoiningIncludedCount > 0" class="flex items-center gap-2">
              <UBadge color="warning" variant="soft" size="xs">
                <UIcon name="i-heroicons-user-plus" class="mr-1" />
                {{ newJoiningIncludedCount }} New Joining
              </UBadge>
            </div>
          </div>

          <div v-if="displayedIncludedEmployees.length === 0" class="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
            <UIcon name="i-heroicons-users" class="mx-auto text-gray-300 text-3xl mb-2" />
            <p v-if="searchQuery || selectedDepartment" class="text-gray-400 text-sm">No employees match your search</p>
            <p v-else class="text-gray-400 text-sm">No employees included</p>
            <p v-if="!searchQuery && !selectedDepartment" class="text-gray-400 text-xs mt-1">Include employees from the excluded or new joining sections</p>
          </div>
          <div v-else class="space-y-2 max-h-96 overflow-y-auto pr-1">
            <div
              v-for="employee in displayedIncludedEmployees"
              :key="getEmployeeId(employee) || employee.id"
              class="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 hover:border-green-300 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <UIcon name="i-heroicons-user" class="text-green-600 text-sm" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ employee.name || employee.full_name || 'Unknown' }}
                    </p>
                    <UBadge 
                      v-if="employee.is_new_joining"
                      color="warning" 
                      variant="soft" 
                      size="xs"
                    >
                      <UIcon name="i-heroicons-user-plus" class="mr-1" />
                      New Joining
                    </UBadge>
                  </div>
                  <p class="text-xs text-gray-500 truncate">
                    {{ employee.employee_number || '--' }} · {{ employee.department || '--' }}
                  </p>
                </div>
              </div>
              <UButton 
                v-if="employee.can_exclude !== false"
                @click="excludeEmployee(employee)" 
                variant="ghost" 
                color="error" 
                size="xs" 
                icon="i-heroicons-x-mark" 
                square 
              />
            </div>
          </div>
        </div>

        <!-- Excluded Employees -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <UIcon name="i-heroicons-x-circle" class="text-red-500 mr-1" />
              Excluded ({{ filteredExcludedEmployees.length }}<span v-if="searchQuery || selectedDepartment" class="text-gray-400"> of {{ excludedCount }}</span>)
            </h2>
          </div>

          <div v-if="filteredExcludedEmployees.length === 0" class="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center text-gray-400 text-sm">
            <span v-if="searchQuery || selectedDepartment">No excluded employees match your search</span>
            <span v-else>No employees excluded</span>
          </div>
          <div v-else class="space-y-2 max-h-96 overflow-y-auto pr-1">
            <div
              v-for="employee in filteredExcludedEmployees"
              :key="getEmployeeId(employee) || employee.id"
              class="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 hover:border-red-300 transition-colors"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <UIcon name="i-heroicons-user" class="text-red-600 text-sm" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ employee.name || employee.full_name || 'Unknown' }}
                    </p>
                    <p class="text-xs text-gray-500 truncate">
                      {{ employee.employee_number || '--' }} · {{ employee.department || '--' }}
                    </p>
                  </div>
                </div>
                <UButton 
                  v-if="employee.can_include !== false"
                  @click="includeEmployee(employee)" 
                  variant="ghost" 
                  color="success" 
                  size="xs" 
                  icon="i-heroicons-plus" 
                  square 
                />
                <UTooltip 
                  v-else
                  text="This employee cannot be included due to system constraints"
                >
                  <UIcon name="i-heroicons-lock-closed" class="text-gray-400 text-sm" />
                </UTooltip>
              </div>
              
              <!-- Exclusion type and reason -->
              <div class="flex items-start gap-2 text-xs">
                <UBadge 
                  :color="employee.exclusion_type === 'previously_excluded' ? 'warning' : 'info'"
                  variant="soft"
                  size="xs"
                >
                  {{ employee.exclusion_type === 'previously_excluded' ? 'Previously Excluded' : 'Newly Excluded' }}
                </UBadge>
                <span class="text-gray-600 flex-1">{{ employee.exclusion_type === 'previously_excluded' ? 'Excluded in the last payroll run' : 'To be excluded in this rerun' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="fixed bottom-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg" style="left: 256px;">
        <div class="max-w-7xl mx-auto flex gap-3 justify-end">
          <UButton @click="router.back()" variant="outline" color="error" label="Cancel" />
          <UButton
            v-if="needsValidation"
            @click="handleValidate"
            :loading="validating"
            :disabled="validating || rerunning"
            icon="i-heroicons-clipboard-document-check"
            label="Validate"
          />
          <UButton
            v-else
            @click="handleRerunPayroll"
            :loading="rerunning"
            :disabled="rerunning || validating || blockingIssues.length > 0"
            icon="i-heroicons-arrow-path"
            label="Confirm & Rerun"
          />
        </div>
      </div>
    </div>
  </div>
</template>
