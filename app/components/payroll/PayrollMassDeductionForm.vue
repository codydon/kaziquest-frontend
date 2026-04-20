<script setup lang="ts">
import { z } from 'zod'
import { payrollService } from '~~/services/payroll.service'
import { companyService } from '~~/services/company.service'
import { employeeService } from '~~/services/employee.service'
import { getDepartmentName, getPositionName } from '~/utils/getDepartmentPosition'
import { useAuthStore } from '~/stores/auth'

const props = defineProps({
  editMode: {
    type: Boolean,
    default: false
  },
  massDeductionData: {
    type: Object,
    required: false,
    default: null
  }
})

const emit = defineEmits(['close', 'success'])

const toast = useToast()
const { user } = useAuthStore()

// Employee Selection State
const selectionMode = ref<'all' | 'select'>('all')
const selectedEmployees = ref<any[]>([])
const selectedEmployeeIds = ref<string[]>([])

// Filter State
const filterDepartment = ref<any>(null)
const filterStatus = ref<any>(null)
const filterPosition = ref<any>(null)
const isLoadingInitialData = ref(false)
const pendingPositionValue = ref<string | null>(null)
const showFilterEditMode = ref(false)
const displayedFilterCriteria = ref<any>(null)

// Fetch departments
const { data: departments } = await companyService.fetchDepartments()
const departmentsList = computed<any[]>(() => (departments.value as any[]) || [])

// Fetch positions when department is selected
const positions = ref<any[]>([])
const gettingPositions = ref(false)
const fetchPositions = async () => {
  if (filterDepartment.value && filterDepartment.value.name) {
    try {
      gettingPositions.value = true
      const res = await companyService.fetchPositions({ department: filterDepartment.value.name })
      if (Array.isArray(res)) {
        positions.value = res
      } else {
        positions.value = []
      }
    } catch (error) {
      void 0 /* console.error('Error fetching positions:', error) */
      positions.value = []
    } finally {
      gettingPositions.value = false
    }
  } else {
    positions.value = []
  }
}

watch(filterDepartment, () => {
  fetchPositions()
  // Only clear position if not loading initial data (to allow position to be set during edit mode load)
  if (!isLoadingInitialData.value) {
    filterPosition.value = null
    pendingPositionValue.value = null
  }
})

// Watch positions array to set pending position when it's loaded
watch(positions, (newPositions) => {
  if (isLoadingInitialData.value && pendingPositionValue.value) {
    if (newPositions.length > 0) {
      const pos = newPositions.find((p: any) => p.job_title === pendingPositionValue.value)
      if (pos) {
        filterPosition.value = pos
      } else {
        // Fallback: create object with job_title if position not found
        filterPosition.value = { job_title: pendingPositionValue.value }
      }
    } else if (!gettingPositions.value) {
      // Positions fetch completed but no positions found, set fallback
      filterPosition.value = { job_title: pendingPositionValue.value }
    }
    // Only clear flag if fetch is complete
    if (!gettingPositions.value) {
      pendingPositionValue.value = null
      isLoadingInitialData.value = false
    }
  }
})

// Also watch gettingPositions to handle case where positions array doesn't change but fetch completes
watch(gettingPositions, (isLoading) => {
  if (!isLoading && isLoadingInitialData.value && pendingPositionValue.value) {
    // Fetch completed, check if we can set the position
    if (positions.value.length > 0) {
      const pos = positions.value.find((p: any) => p.job_title === pendingPositionValue.value)
      if (pos) {
        filterPosition.value = pos
      } else {
        filterPosition.value = { job_title: pendingPositionValue.value }
      }
    } else {
      // No positions found, use fallback
      filterPosition.value = { job_title: pendingPositionValue.value }
    }
    pendingPositionValue.value = null
    isLoadingInitialData.value = false
  }
})

// Status options
const statusOptions = [
  { name: 'All', value: 'all' },
  { name: 'Active', value: 'active' },
  { name: 'Inactive', value: 'inactive' }
]

// Deduction types and frequencies
const types = [
  { name: "Pension", value: "pension" },
  { name: "Custom", value: "custom" },
  { name: "HELB", value: "helb" },
  { name:"Advance", value:"advance"},
  { name: "Mortgage", value: "mortgage"},
  { name: "Home Ownership", value: "home_ownership" },
  { name: 'Insurance', value: 'insurance' }
]

const frequencies = ["monthly"]

// Recurring choices
const recurringChoices = [
  { name: 'Recurring', value: 'recurring', description: 'Permanent ongoing deduction with optional end date' },
  { name: 'One Time Only', value: 'non-recurring', description: 'Single deduction for one pay period' },
  { name: 'Until Paid', value: 'till-paid', description: 'Continues until balance is fully paid' }
]

// Pension-specific options
const contributionType = [
  { name: 'Employee Only', value: 'employee_only' },
  { name: 'Employer Only', value: 'employer_only' },
  { name: 'Both', value: 'both' }
]

const amountTypes = [
  { name: 'Amount', value: 'amount' },
  { name: 'Percentage', value: 'percentage' }
]

const selectedAmountType = ref('amount')
const selectedEmployerAmountType = ref('amount')
const contributionTypeValue = ref('employee_only')

// Insurance types
const insuranceTypes = [
  'health',
  'life',
  'education',
  'vehicle',
  'property',
  'travel',
  'other'
]

// Deduction Form State
const deductionData = ref({
  name: '',
  amount: 0,
  total_amount: 0,
  percentage: undefined as number | undefined,
  type: 'custom',
  frequency: 'monthly',
  start_date: '',
  end_date: undefined as string | undefined,
  recurring_type: 'recurring',
  description: '',
  comments: '',
  active: true,
  contribution_type: 'employee_only',
  pension_upper_limit: undefined as number | undefined,
  amount_paid_by_employer: undefined as number | undefined,
  percentage_paid_by_employer: undefined as number | undefined,
})

// Insurance Data
const insuranceData = ref({
  insurance_type: 'health',
  insurance_company_pin: '',
  insurance_company_name: '',
  insurance_policy_number: '',
  premium_payment_date: '',
  policy_purpose: '',
  policy_holder: '',
  child_age: undefined as number | undefined,
  sum_assured: 0,
})

// Computed properties
const isInsuranceType = computed(() => deductionData.value.type === 'insurance')
const isPensionType = computed(() => deductionData.value.type === 'pension')
const showTotalAmountField = computed(() => 
  deductionData.value.recurring_type === 'till-paid' && !isInsuranceType.value && !isPensionType.value
)
const showEndDateField = computed(() => deductionData.value.recurring_type !== 'till-paid')

const filteredRecurringChoices = computed(() => {
  if (isInsuranceType.value) {
    return recurringChoices.filter(choice => choice.value !== 'till-paid')
  }
  return recurringChoices
})

const typeSelectItems = computed(() =>
  types.map(t => ({ label: t.name, value: t.value }))
)

const frequencySelectItems = computed(() =>
  frequencies.map(f => ({ label: f, value: f }))
)

const recurringSelectItems = computed(() =>
  filteredRecurringChoices.value.map(c => ({
    label: `${c.name} — ${c.description}`,
    value: c.value
  }))
)

const contributionSelectItems = computed(() =>
  contributionType.map(c => ({ label: c.name, value: c.value }))
)

const amountTypeSelectItems = computed(() =>
  amountTypes.map(c => ({ label: c.name, value: c.value }))
)

const insuranceTypeItems = computed(() =>
  insuranceTypes.map(t => ({ label: t, value: t }))
)

// Employee count
const employeeCount = computed(() => {
  if (selectionMode.value === 'all') {
    return 'All Active Employees'
  }
  return `${selectedEmployees.value.length} employee(s) selected`
})

// Watch for employee selection
watch(selectedEmployees, (newVal) => {
  selectedEmployeeIds.value = newVal.map((emp: any) => emp.id || emp.user?.id)
})

// Set applicable employees from EmployeeSelect component
const setApplicableEmployee = (employees: unknown) => {
  const list = Array.isArray(employees)
    ? employees
    : employees && typeof employees === 'object'
      ? [employees as Record<string, unknown>]
      : []
  selectedEmployees.value = list as any[]
  selectedEmployeeIds.value = (list as any[]).map((emp: any) => emp.id || emp.user?.id).filter(Boolean) as string[]
}

// Remove employee from list
const removeEmployeeFromList = (id: string) => {
  selectedEmployees.value = selectedEmployees.value.filter((emp: any) => 
    (emp.id || emp.user?.id) !== id
  )
  selectedEmployeeIds.value = selectedEmployeeIds.value.filter((empId: string) => empId !== id)
}

// Handle toggle for selection mode
const handleSelectionModeToggle = (val: boolean) => {
  selectionMode.value = val ? 'all' : 'select'
  // Clear filters when switching to 'all' mode
  if (val) {
    filterDepartment.value = null
    filterPosition.value = null
    filterStatus.value = null
    displayedFilterCriteria.value = null
    showFilterEditMode.value = false
  }
}

// Watch for type changes to handle insurance-specific logic
watch(
  () => deductionData.value.type,
  (newType) => {
    if (newType === 'insurance' && deductionData.value.recurring_type === 'till-paid') {
      deductionData.value.recurring_type = 'recurring'
    }
  }
)

// Watch for recurring_type changes
watch(
  () => deductionData.value.recurring_type,
  (newRecurring, oldRecurring) => {
    if (newRecurring !== oldRecurring) {
      handleRecurringChange(newRecurring)
    }
  }
)

// Watch for start date changes to auto-update end date for non-recurring deductions
watch(
  () => deductionData.value.start_date,
  (newStartDate) => {
    if (deductionData.value.recurring_type === 'non-recurring' && newStartDate) {
      deductionData.value.end_date = getSameDayNextMonth(newStartDate)
    }
  }
)

// Watch for amount changes to sync total_amount for recurring and non-recurring types
watch(
  () => deductionData.value.amount,
  (newAmount) => {
    if ((deductionData.value.recurring_type === 'recurring' || deductionData.value.recurring_type === 'non-recurring') 
        && !isInsuranceType.value && !isPensionType.value) {
      deductionData.value.total_amount = newAmount
    }
  }
)

// Watch pension contribution type
watch(contributionTypeValue, (newVal) => {
  deductionData.value.contribution_type = newVal
})

// Watch amount types
watch(selectedAmountType, (newVal) => {
  if (newVal === 'amount') {
    deductionData.value.percentage = undefined
  } else {
    deductionData.value.amount = 0
  }
})

watch(selectedEmployerAmountType, (newVal) => {
  if (newVal === 'amount') {
    deductionData.value.percentage_paid_by_employer = undefined
  } else {
    deductionData.value.amount_paid_by_employer = undefined
  }
})

// Helper functions
const getSameDayNextMonth = (dateString: string): string => {
  const date = new Date(dateString)
  date.setMonth(date.getMonth() + 1)
  const iso = date.toISOString().split('T')[0]
  return iso ?? ''
}

const handleRecurringChange = (recurringType: string) => {
  switch (recurringType) {
    case 'recurring':
      if (!isInsuranceType.value && !isPensionType.value) {
        if (deductionData.value.amount > 0) {
          deductionData.value.total_amount = deductionData.value.amount
        }
      }
      if (!deductionData.value.end_date) {
        deductionData.value.end_date = undefined
      }
      break
      
    case 'non-recurring':
      if (!isInsuranceType.value && !isPensionType.value) {
        if (deductionData.value.amount > 0) {
          deductionData.value.total_amount = deductionData.value.amount
        }
      }
      if (deductionData.value.start_date) {
        deductionData.value.end_date = getSameDayNextMonth(deductionData.value.start_date)
      }
      break
      
    case 'till-paid':
      if (!isInsuranceType.value && !isPensionType.value) {
        if (!deductionData.value.total_amount || deductionData.value.total_amount === 0) {
          deductionData.value.total_amount = deductionData.value.amount || 0
        }
      }
      deductionData.value.end_date = undefined
      break
  }
}

// Generate dynamic schema
const generateDynamicSchema = () => {
  const commonFields: any = {
    name: z.string().min(1, "Name is required"),
    type: z.enum(["pension", "custom", "advance", "mortgage", "home_ownership", "insurance"]),
    frequency: z.enum(["monthly"]),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().optional().refine((value) => {
      if (value && deductionData.value.start_date) {
        return new Date(value) >= new Date(deductionData.value.start_date)
      }
      return true
    }, {
      message: 'End date should not be less than start date'
    }),
    recurring_type: z.enum(['recurring', 'non-recurring', 'till-paid']),
    description: z.string().optional(),
    comments: z.string().optional(),
    active: z.boolean(),
  }

  // Add amount/percentage validation
  if (selectedAmountType.value === 'percentage') {
    commonFields.percentage = z.number().min(0.01, "Percentage is required").max(100, "Percentage cannot exceed 100")
    commonFields.amount = z.number().optional()
  } else {
    commonFields.amount = z.number().min(1, "Amount is required")
    commonFields.percentage = z.number().optional()
  }

  // Add total_amount validation for till-paid
  if (showTotalAmountField.value) {
    commonFields.total_amount = z.number().min(1, "Total amount is required for till-paid deductions")
  } else {
    commonFields.total_amount = z.number().optional()
  }

  // Add pension-specific validation
  if (isPensionType.value) {
    commonFields.contribution_type = z.string()
    commonFields.pension_upper_limit = z.number().optional()
    
    if (contributionTypeValue.value === 'both' || contributionTypeValue.value === 'employer_only') {
      if (selectedEmployerAmountType.value === 'percentage') {
        commonFields.percentage_paid_by_employer = z.number().min(0.01, "Employer percentage is required")
        commonFields.amount_paid_by_employer = z.number().optional()
      } else {
        commonFields.amount_paid_by_employer = z.number().min(1, "Employer amount is required")
        commonFields.percentage_paid_by_employer = z.number().optional()
      }
    }
  }

  return z.object(commonFields)
}

// Function to load employee details by IDs
const loadSelectedEmployees = async (employeeIds: string[]) => {
  if (!employeeIds || employeeIds.length === 0) {
    selectedEmployees.value = []
    return
  }
  
  try {
    // Fetch employees by IDs
    const { data: employeesData } = await employeeService.getEmployees()
    const employees = Array.isArray(employeesData.value) 
      ? employeesData.value 
      : (employeesData.value as any)?.results || []
    
    // Filter to only include employees with matching IDs
    // Convert both to strings for comparison to handle UUID/string mismatches
    const employeeIdStrings = employeeIds.map(id => String(id))
    selectedEmployees.value = employees.filter((emp: any) => 
      employeeIdStrings.includes(String(emp.id))
    )
  } catch (error) {
    void 0 /* console.error('Error loading selected employees:', error) */
    selectedEmployees.value = []
  }
}

// Helper function to load department and position filters
const loadDepartmentAndPosition = (dept: any, positionValue: string | undefined) => {
  // Store position value to be set after positions are loaded
  if (positionValue) {
    pendingPositionValue.value = positionValue
  }
  
  // Set flag before setting department to prevent watch from clearing position
  isLoadingInitialData.value = true
  
  // Set department - this will trigger watch and fetch positions
  filterDepartment.value = dept
  
  // If no position to load, clear flag immediately
  if (!positionValue) {
    isLoadingInitialData.value = false
  }
  // Otherwise, the positions watcher will handle setting the position and clearing the flag
}

// Handle changing filters - load filters into dropdowns and show edit mode
const handleChangeFilters = async () => {
  if (!displayedFilterCriteria) {
    showFilterEditMode.value = true
    return
  }
  
  const criteria = displayedFilterCriteria.value
  
  // Load status filter
  if (criteria.status) {
    let status = statusOptions.find((s: any) => s.value === criteria.status)
    if (!status) {
      status = statusOptions.find((s: any) => s.value.toLowerCase() === String(criteria.status).toLowerCase())
    }
    if (status) {
      filterStatus.value = status
    }
  }
  
  // Load department filter and position filter
  // Support both ID-based (new) and name-based (backward compatibility) filters
  const departmentValue = criteria.department_id || criteria.department
  const positionValue = criteria.position_id || criteria.position
  
  if (departmentValue) {
    // Ensure departmentsList is populated
    if (!departmentsList.value || departmentsList.value.length === 0) {
      await nextTick()
    }
    
    // Try to find by ID first (new format), then by name (backward compatibility)
    let dept = null
    if (criteria.department_id) {
      // New format: search by ID
      dept = departmentsList.value.find((d: any) => d.id === criteria.department_id || d.id === Number(criteria.department_id))
    } else if (criteria.department) {
      // Old format: search by name
      dept = departmentsList.value.find((d: any) => d.name === criteria.department)
      if (!dept) {
        dept = departmentsList.value.find((d: any) => 
          d.name && d.name.toLowerCase() === String(criteria.department).toLowerCase()
        )
      }
    }
    
    if (dept) {
      filterDepartment.value = dept
      // Fetch positions for the department
      await fetchPositions()
      // Set position filter if it exists
      if (positionValue) {
        let pos = null
        if (criteria.position_id) {
          // New format: search by ID
          pos = positions.value.find((p: any) => p.id === criteria.position_id || p.id === Number(criteria.position_id))
        } else if (criteria.position) {
          // Old format: search by job_title
          pos = positions.value.find((p: any) => p.job_title === criteria.position)
        }
        
        if (pos) {
          filterPosition.value = pos
        } else if (criteria.position) {
          // Fallback: create object with job_title if position not found
          filterPosition.value = { job_title: criteria.position }
        }
      }
    }
  } else if (positionValue) {
    // If position is specified but no department, we can't load it properly
    if (criteria.position) {
      filterPosition.value = { job_title: criteria.position }
    }
  }
  
  // Clear displayed filters and show edit mode
  displayedFilterCriteria.value = null
  showFilterEditMode.value = true
}

// Reset form function - defined early so watchers can use it
const resetForm = () => {
  selectionMode.value = 'all'
  selectedEmployees.value = []
  selectedEmployeeIds.value = []
  filterDepartment.value = null
  filterStatus.value = null
  filterPosition.value = null
  isLoadingInitialData.value = false
  pendingPositionValue.value = null
  showFilterEditMode.value = false
  displayedFilterCriteria.value = null
  deductionData.value = {
    name: '',
    amount: 0,
    total_amount: 0,
    percentage: undefined,
    type: 'custom',
    frequency: 'monthly',
    start_date: '',
    end_date: undefined,
    recurring_type: 'recurring',
    description: '',
    comments: '',
    active: true,
    contribution_type: 'employee_only',
    pension_upper_limit: undefined,
    amount_paid_by_employer: undefined,
    percentage_paid_by_employer: undefined,
  }
  insuranceData.value = {
    insurance_type: 'health',
    insurance_company_pin: '',
    insurance_company_name: '',
    insurance_policy_number: '',
    premium_payment_date: '',
    policy_purpose: '',
    policy_holder: '',
    child_age: undefined,
    sum_assured: 0,
  }
  selectedAmountType.value = 'amount'
  selectedEmployerAmountType.value = 'amount'
  contributionTypeValue.value = 'employee_only'
}

// Load data for edit mode
watch(() => props.massDeductionData, async (data) => {
  if (data && props.editMode) {
    const template = data.deduction_template
    if (template) {
      deductionData.value = {
        name: template.name || '',
        amount: template.amount || 0,
        total_amount: template.total_amount || 0,
        percentage: template.percentage,
        type: template.type || 'custom',
        frequency: template.frequency || 'monthly',
        start_date: template.start_date || '',
        end_date: template.end_date,
        recurring_type: template.recurring_type || 'recurring',
        description: template.description || '',
        comments: template.comments || '',
        // Prefer mass deduction active flag; fall back to template
        active: data.active !== undefined ? data.active : (template.active !== undefined ? template.active : true),
        contribution_type: template.contribution_type || 'employee_only',
        pension_upper_limit: template.pension_upper_limit,
        amount_paid_by_employer: template.amount_paid_by_employer,
        percentage_paid_by_employer: template.percentage_paid_by_employer,
      }

      // Set amount type based on data
      if (template.percentage !== undefined && template.percentage !== null) {
        selectedAmountType.value = 'percentage'
      } else {
        selectedAmountType.value = 'amount'
      }

      // Set employer amount type
      if (template.percentage_paid_by_employer !== undefined && template.percentage_paid_by_employer !== null) {
        selectedEmployerAmountType.value = 'percentage'
      } else {
        selectedEmployerAmountType.value = 'amount'
      }

      contributionTypeValue.value = template.contribution_type || 'employee_only'

      // Load insurance data if applicable
      if (template.insurance) {
        insuranceData.value = {
          insurance_type: template.insurance.insurance_type || 'health',
          insurance_company_pin: template.insurance.insurance_company_pin || '',
          insurance_company_name: template.insurance.insurance_company_name || '',
          insurance_policy_number: template.insurance.insurance_policy_number || '',
          premium_payment_date: template.insurance.premium_payment_date || '',
          policy_purpose: template.insurance.policy_purpose || '',
          policy_holder: template.insurance.policy_holder || '',
          child_age: template.insurance.child_age,
          sum_assured: template.insurance.sum_assured || 0,
        }
      }

      // Load employee selection
      // Check if filter_criteria exists even when apply_to is 'all'
      const hasFilterCriteria = data.filter_criteria && Object.keys(data.filter_criteria).length > 0
      
      if (data.apply_to === 'all') {
        selectionMode.value = 'all'
        selectedEmployees.value = []
        selectedEmployeeIds.value = []
        
        // If filter_criteria exists, display it even though apply_to is 'all'
        if (hasFilterCriteria) {
          displayedFilterCriteria.value = data.filter_criteria
          showFilterEditMode.value = false // Start in display mode
        }
      } else if (data.apply_to === 'selected') {
        selectionMode.value = 'select'
        selectedEmployeeIds.value = data.employee_ids || []
        // Fetch employee details to populate selectedEmployees
        if (selectedEmployeeIds.value.length > 0) {
          loadSelectedEmployees(selectedEmployeeIds.value)
        } else {
          selectedEmployees.value = []
        }
      } else if (data.apply_to === 'filtered' || hasFilterCriteria) {
        // Keep selectionMode as 'all' when using filters - filters work independently
        selectionMode.value = 'all'
        selectedEmployees.value = []
        selectedEmployeeIds.value = []
        const criteria = data.filter_criteria || {}
        
        // Store criteria for display - always show in display mode first
        if (Object.keys(criteria).length > 0) {
          displayedFilterCriteria.value = { ...criteria }
          showFilterEditMode.value = false // Start in display mode
          // Don't load into dropdowns - user will click "Change Filters" to edit
          
          // If we have department_id, fetch positions so getPositionName can work
          if (criteria.department_id) {
            const dept = departmentsList.value.find((d: any) => d.id === criteria.department_id || d.id === Number(criteria.department_id))
            if (dept) {
              filterDepartment.value = dept
              await fetchPositions()
            }
          }
        }
      }
    }
  } else if (!props.editMode) {
    // Reset form when in create mode
    resetForm()
  }
}, { immediate: true })

// Watch for editMode changes to reset form when switching to create mode
watch(() => props.editMode, (isEditMode) => {
  if (!isEditMode) {
    // Reset form when switching to create mode
    resetForm()
  }
})

// Reset form on mount if in create mode
onMounted(() => {
  if (!props.editMode) {
    resetForm()
  }
})

// Form submission
const loading = ref(false)

const handleClose = () => {
  resetForm()
  emit('close')
}

const normalizeDate = (value: string | undefined) => {
  if (!value) return value
  // If already ISO-like, keep
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value
  const parsed = new Date(value)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  return value
}

const onSubmit = async () => {
  void 0 /* console.log('onSubmit called - Form submission started') */
  void 0 /* console.log('Form data:', deductionData.value) */
  void 0 /* console.log('Edit mode:', props.editMode) */
  void 0 /* console.log('Mass deduction ID:', props.massDeductionData?.id) */

  // Manual validation before proceeding
  if (!deductionData.value.name || deductionData.value.name.trim() === '') {
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Validation Error',
      description: 'Name is required',
      color: 'error'
    })
    return
  }

  if (!deductionData.value.start_date) {
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Validation Error',
      description: 'Start date is required',
      color: 'error'
    })
    return
  }

  if (selectedAmountType.value === 'amount' && (!deductionData.value.amount || deductionData.value.amount < 1)) {
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Validation Error',
      description: 'Amount must be at least 1',
      color: 'error'
    })
    return
  }

  if (selectedAmountType.value === 'percentage' && (!deductionData.value.percentage || deductionData.value.percentage < 0.01)) {
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Validation Error',
      description: 'Percentage must be at least 0.01',
      color: 'error'
    })
    return
  }

  try {
    loading.value = true
    void 0 /* console.log('Loading state set to true') */

    // Build payload
    const payload: any = {
      deduction_data: {
        name: deductionData.value.name,
        type: deductionData.value.type,
        frequency: deductionData.value.frequency,
        start_date: normalizeDate(deductionData.value.start_date),
        end_date: normalizeDate(deductionData.value.end_date),
        recurring_type: deductionData.value.recurring_type,
        description: deductionData.value.description,
        comments: deductionData.value.comments,
        active: deductionData.value.active,
      }
    }
    // Mass deduction active flag (top-level)
    payload.active = deductionData.value.active

    // Add amount or percentage
    if (selectedAmountType.value === 'percentage' && deductionData.value.percentage !== undefined) {
      payload.deduction_data.percentage = deductionData.value.percentage
    } else {
      payload.deduction_data.amount = deductionData.value.amount
    }

    // Add total_amount for till-paid
    if (showTotalAmountField.value) {
      payload.deduction_data.total_amount = deductionData.value.total_amount
    }

    // Add pension-specific fields
    if (isPensionType.value) {
      payload.deduction_data.contribution_type = deductionData.value.contribution_type
      payload.deduction_data.pension_upper_limit = deductionData.value.pension_upper_limit
      
      if (contributionTypeValue.value === 'both' || contributionTypeValue.value === 'employer_only') {
        if (selectedEmployerAmountType.value === 'percentage') {
          payload.deduction_data.percentage_paid_by_employer = deductionData.value.percentage_paid_by_employer
        } else {
          payload.deduction_data.amount_paid_by_employer = deductionData.value.amount_paid_by_employer
        }
      }
    }

    // Add insurance data if insurance type
    if (isInsuranceType.value) {
      payload.insurance_data = insuranceData.value
    }

    // Add employee selection
    if (selectionMode.value === 'all') {
      payload.employee_ids = ['all']
    } else {
      payload.employee_ids = selectedEmployeeIds.value
    }

    // Add filters if provided
    // If we have displayedFilterCriteria and not in edit mode, use those
    // Otherwise, use the current filter selections
    const filters: any = {}
    if (displayedFilterCriteria && !showFilterEditMode) {
      // Use displayed filters
      Object.assign(filters, displayedFilterCriteria)
    } else {
      // Use current filter selections - send IDs instead of names
      if (filterDepartment.value?.id) filters.department_id = filterDepartment.value.id
      if (filterStatus.value?.value && filterStatus.value.value !== 'all') filters.status = filterStatus.value.value
      if (filterPosition.value?.id) filters.position_id = filterPosition.value.id
    }
    
    if (Object.keys(filters).length > 0) {
      payload.filters = filters
    }

    // Validate employee selection
    const hasFilters = Object.keys(filters).length > 0 || (displayedFilterCriteria && Object.keys(displayedFilterCriteria).length > 0)
    if (selectionMode.value === 'select' && selectedEmployeeIds.value.length === 0 && !hasFilters) {
      toast.add({
        icon: 'i-heroicons-x-circle',
        title: 'Please select at least one employee or apply filters',
        color: 'error'
      })
      loading.value = false
      return
    }

    if (props.editMode && props.massDeductionData?.id) {
      // Update existing mass deduction
      // Include deduction_data in the payload - backend should handle nested update
      const massDeductionUpdateData: any = {
        active: deductionData.value.active,
        deduction_data: payload.deduction_data  // Include deduction template data
      }
      
      // Add employee selection (reuse filters already built above)
      // Build filters for update
      const updateFilters: any = {}
      if (displayedFilterCriteria && !showFilterEditMode) {
        // Use displayed filters
        Object.assign(updateFilters, displayedFilterCriteria)
      } else {
        // Use current filter selections - send IDs instead of names
        if (filterDepartment.value?.id) updateFilters.department_id = filterDepartment.value.id
        if (filterStatus.value?.value && filterStatus.value.value !== 'all') updateFilters.status = filterStatus.value.value
        if (filterPosition.value?.id) updateFilters.position_id = filterPosition.value.id
      }
      
      if (selectionMode.value === 'all') {
        // If filters exist, use 'filtered', otherwise use 'all'
        if (Object.keys(updateFilters).length > 0) {
          massDeductionUpdateData.apply_to = 'filtered'
          massDeductionUpdateData.filter_criteria = updateFilters
        } else {
          massDeductionUpdateData.apply_to = 'all'
          massDeductionUpdateData.employee_ids = []
        }
      } else if (Object.keys(updateFilters).length > 0) {
        massDeductionUpdateData.apply_to = 'filtered'
        massDeductionUpdateData.filter_criteria = updateFilters
      } else {
        massDeductionUpdateData.apply_to = 'select'
        massDeductionUpdateData.employee_ids = selectedEmployeeIds.value
      }
      
      // Add insurance data if insurance type
      if (isInsuranceType.value) {
        massDeductionUpdateData.insurance_data = insuranceData.value
      }
      
      void 0 /* console.log('Updating mass deduction with full payload:', JSON.stringify(massDeductionUpdateData, null, 2)) */
      void 0 /* console.log('Start date:', massDeductionUpdateData.deduction_data.start_date) */
      void 0 /* console.log('End date:', massDeductionUpdateData.deduction_data.end_date) */
      
      try {
        const response = await $fetch(`${useBaseUrl()}/employees/mass-deductions/${props.massDeductionData.id}/`, {
          method: 'PATCH',
          headers: useAuthHeader(),
          body: massDeductionUpdateData
        })
        
        void 0 /* console.log('Mass deduction update response:', response) */
        
        // Handle response
        if (response && (response as any).success !== false) {
          const responseData = response as any
          const massDeductionId = responseData.mass_deduction_id || responseData.id || props.massDeductionData.id
          toast.add({
            icon: 'i-heroicons-check-circle',
            title: 'Mass deduction updated successfully',
            color: 'success'
          })
          resetForm()
          emit('success')
          handleClose()
        } else {
          const responseData = response as any
          void 0 /* console.error('Update failed - response indicates failure:', responseData) */
          toast.add({
            icon: 'i-heroicons-x-circle',
            title: 'Failed to update mass deduction',
            description: responseData?.message || 'An error occurred',
            color: 'error'
          })
        }
      } catch (fetchError: any) {
        void 0 /* console.error('Error in update request:', fetchError) */
        void 0 /* console.error('Error details:', {
          status: fetchError?.status,
          statusText: fetchError?.statusText,
          data: fetchError?.data,
          message: fetchError?.message
        }) */
        toast.add({
          icon: 'i-heroicons-x-circle',
          title: 'Failed to update mass deduction',
          description: fetchError?.data?.message || fetchError?.message || 'An error occurred while updating',
          color: 'error'
        })
      }
    } else {
      // Create new mass deduction (uses $fetch)
      const response = await payrollService.createMassDeduction({ body: payload })
      
      // $fetch returns data directly or throws error
      if (response && (response as any).success !== false) {
        const responseData = response as any
        const massDeductionId = responseData.mass_deduction_id || responseData.id
        toast.add({
          icon: 'i-heroicons-check-circle',
          title: 'Mass deduction created successfully',
          color: 'success'
        })
        resetForm()
        emit('success')
        handleClose()
      } else {
        const responseData = response as any
        toast.add({
          icon: 'i-heroicons-x-circle',
          title: 'Failed to create mass deduction',
          description: responseData?.message || 'An error occurred',
          color: 'error'
        })
      }
    }
  } catch (error: any) {
    void 0 /* console.error('Error saving mass deduction:', error) */
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'An error occurred',
      description: error?.data?.message || error?.message || 'Please try again',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-h-[80vh] overflow-y-auto px-1">
    <!-- Employee Selection Section -->
    <UCard class="my-1">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-user-group" class="text-kaziquest-600 text-xl" />
          <h3 class="text-lg font-semibold text-gray-900">Employee Selection</h3>
        </div>
      </template>

      <div class="grid grid-cols-1">
        <p class="text-sm font-semibold text-gray-600">Applicable To:</p>
        <div class="flex gap-4 items-center">
          <UToggle 
            on-icon="i-heroicons-check-20-solid" 
            off-icon="i-heroicons-x-mark-20-solid"
            :model-value="selectionMode === 'all'"
            @update:model-value="handleSelectionModeToggle"
          />
          <span>All Active and Suspended Employees</span>
        </div>
        <div v-if="selectionMode === 'all'" class="mt-2">
          <UAlert
            color="info"
            variant="soft"
            icon="i-heroicons-information-circle"
            title="This deduction will apply to all active and suspended employees"
            description="Use 'Selected Employees' mode to apply filters or select specific employees."
          />
        </div>
        <div v-if="selectionMode === 'select'" class="flex flex-col mt-4">
          <EmployeeSelect
            :title="'Select Applicable Employees'"
            @selected="setApplicableEmployee"
          />
        </div>
        <div v-if="selectedEmployees.length > 0" class="grid grid-cols-3 gap-2 mt-4">
          <UButtonGroup 
            v-for="employee in selectedEmployees" 
            :key="employee.id || employee.user?.id"
            class="items-center flex justify-between p-2 bg-gray-200" 
            size="sm" 
            orientation="horizontal"
          >
            <span>{{ employee?.user?.full_name || employee?.first_name || employee?.name || 'Unknown' }}</span>
            <UButton
              class="rounded-full"
              icon="i-heroicons-x-mark"
              variant="link"
              :padded="false"
              color="error"
              @click="removeEmployeeFromList(employee?.id || employee?.user?.id || '')"
            />
          </UButtonGroup>
        </div>
      </div>
    </UCard>

    <!-- Optional Filters Section - Only show when not applying to all employees -->
    <UCard v-if="selectionMode !== 'all'" class="my-1">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-funnel" class="text-kaziquest-600 text-xl" />
            <h3 class="text-lg font-semibold text-gray-900">Optional Filters</h3>
          </div>
          <UButton
            v-if="displayedFilterCriteria && !showFilterEditMode"
            size="xs"
            color="neutral"
            variant="outline"
            label="Change Filters"
            @click="handleChangeFilters"
          />
        </div>
      </template>

      <!-- Display Mode: Show existing filters -->
      <div v-if="displayedFilterCriteria && !showFilterEditMode" class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <UBadge
            v-if="getDepartmentName(displayedFilterCriteria, departmentsList)"
            color="info"
            variant="subtle"
            size="lg"
          >
            <span class="font-medium">Department:</span> {{ getDepartmentName(displayedFilterCriteria, departmentsList) }}
          </UBadge>
          <!-- <UBadge
            v-if="displayedFilterCriteria.status"
            color="success"
            variant="subtle"
            size="lg"
          >
            <span class="font-medium">Status:</span> {{ displayedFilterCriteria.status }}
          </UBadge> -->
          <UBadge
            v-if="getPositionName(displayedFilterCriteria, positions)"
            color="secondary"
            variant="subtle"
            size="lg"
          >
            <span class="font-medium">Position:</span> {{ getPositionName(displayedFilterCriteria, positions) }}
          </UBadge>
        </div>
      </div>

      <!-- Edit Mode: Show dropdowns -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UFormGroup label="Department" name="filter_department">
          <USelectMenu
            v-model="filterDepartment"
            :items="departmentsList"
            label-key="name"
            searchable
            placeholder="Select department"
            clearable
            class="w-full"
          />
        </UFormGroup>

        <!-- <UFormGroup label="Status" name="filter_status">
          <USelectMenu
            v-model="filterStatus"
            :options="statusOptions"
            option-attribute="name"
            placeholder="Select status"
            clearable
          />
        </UFormGroup> -->

        <UFormGroup label="Position" name="filter_position">
          <USelectMenu
            v-model="filterPosition"
            :items="positions"
            label-key="job_title"
            searchable
            placeholder="Select position"
            :disabled="!filterDepartment || !filterDepartment.name"
            :loading="gettingPositions"
            clearable
            class="w-full"
          />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Deduction Form Section -->
    <UCard class="my-1">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-document-text" class="text-kaziquest-600 text-xl" />
          <h3 class="text-lg font-semibold text-gray-900">Deduction Details</h3>
        </div>
      </template>

      <UForm :schema="generateDynamicSchema()" :state="deductionData" class="space-y-4" @submit="onSubmit">
        <div class="flex justify-between gap-4 items-center">
          <UFormGroup class="w-1/2" label="Type" name="type" required>
            <USelect
              v-model="deductionData.type"
              :items="typeSelectItems"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormGroup>
          <UFormGroup class="w-1/2" label="Frequency" name="frequency" required>
            <USelect
              v-model="deductionData.frequency"
              :items="frequencySelectItems"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormGroup>
        </div>
        
        <UFormGroup label="Name" name="name" required>
          <UInput 
            v-model="deductionData.name" 
            type="text"
            placeholder="Enter deduction name" 
          />
        </UFormGroup>
        
        <!-- Amount Fields -->
        <div class="flex justify-between gap-4 items-center">
          <!-- Total Amount Field (Only shown for till-paid type) -->
          <UFormGroup 
            v-if="showTotalAmountField"
            class="w-1/2" 
            label="Total Amount" 
            name="total_amount" 
            required
          >
            <UInput 
              v-model.number="deductionData.total_amount" 
              type="number" 
              placeholder="Enter total loan amount" 
              help="Total loan amount to be repaid"
            />
          </UFormGroup>
          
          <!-- Monthly Amount Field -->
          <UFormGroup 
            :class="showTotalAmountField ? 'w-1/2' : 'w-full'" 
            :label="isInsuranceType ? 'Monthly Premium' : (isPensionType ? 'Monthly Contribution' : 'Monthly Amount')" 
            name="amount" 
            required
          >
            <UInput 
              v-model.number="deductionData.amount" 
              type="number" 
              :placeholder="isInsuranceType ? 'Enter monthly premium' : (isPensionType ? 'Enter monthly contribution' : 'Enter monthly installment')"
            />
          </UFormGroup>
        </div>

        <!-- Deduction Type -->
        <UFormGroup label="Deduction Type" name="recurring_type" required>
          <USelect
            v-model="deductionData.recurring_type"
            :items="recurringSelectItems"
            value-key="value"
            label-key="label"
            placeholder="Select deduction type"
            class="w-full"
          />
        </UFormGroup>

        <!-- PENSION-SPECIFIC FIELDS -->
        <template v-if="isPensionType">
          <UFormGroup label="Pension Contribution Responsibility" name="contribution_type">
            <USelect
              v-model="contributionTypeValue"
              :items="contributionSelectItems"
              value-key="value"
              label-key="label"
              placeholder="Select contribution type"
              class="w-full"
            />
          </UFormGroup>
          
          <div class="flex justify-between gap-4 items-center">
            <UFormGroup label="Contribution Type" name="amount_type">
              <USelect
                v-model="selectedAmountType"
                :items="amountTypeSelectItems"
                value-key="value"
                label-key="label"
                placeholder="Select amount type"
                class="w-full"
              />
            </UFormGroup>
            <UFormGroup label="Pension Upper Limit" name="pension_upper_limit">
              <UInput v-model.number="deductionData.pension_upper_limit" type="number" placeholder="Enter upper limit" />
            </UFormGroup>
          </div>
          
          <div>
            <div v-if="selectedAmountType === 'percentage'" class="flex justify-between gap-4 items-center">
              <UFormGroup class="w-full" label="Employee Percentage" name="percentage">
                <UInput v-model.number="deductionData.percentage" type="number" placeholder="Enter percentage" />
              </UFormGroup>
            </div>
            
            <div v-if="contributionTypeValue === 'both' || contributionTypeValue === 'employer_only'">
              <UFormGroup label="Employer Contribution Type" name="employer_amount_type">
                <USelect
                  v-model="selectedEmployerAmountType"
                  :items="amountTypeSelectItems"
                  value-key="value"
                  label-key="label"
                  placeholder="Select employer amount type"
                  class="w-full"
                />
              </UFormGroup>
              
              <div v-if="selectedEmployerAmountType === 'percentage'" class="flex justify-between gap-4 items-center mt-4">
                <UFormGroup class="w-full" label="Employer Percentage" name="percentage_paid_by_employer">
                  <UInput v-model.number="deductionData.percentage_paid_by_employer" type="number" placeholder="Enter employer percentage" />
                </UFormGroup>
              </div>
              <div v-else class="flex justify-between gap-4 items-center mt-4">
                <UFormGroup class="w-full" label="Employer Amount" name="amount_paid_by_employer">
                  <UInput v-model.number="deductionData.amount_paid_by_employer" type="number" placeholder="Enter employer amount" />
                </UFormGroup>
              </div>
            </div>
          </div>
        </template>

        <!-- Date Fields -->
        <div class="flex justify-between gap-4 items-center">
          <UFormGroup class="w-1/2" label="Start Date" name="start_date" required>
            <UInput v-model="deductionData.start_date" type="date" />
          </UFormGroup>
          
          <UFormGroup v-if="showEndDateField" class="w-1/2" label="End Date" name="end_date">
            <UInput v-model="deductionData.end_date" type="date" placeholder="Optional" />
          </UFormGroup>
        </div>

        <!-- Insurance Section -->
        <template v-if="isInsuranceType">
          <div class="border-t pt-4 space-y-4">
            <h4 class="font-semibold text-gray-900">Insurance Details</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormGroup label="Insurance Type" name="insurance_type">
                <USelect
                  v-model="insuranceData.insurance_type"
                  :items="insuranceTypeItems"
                  value-key="value"
                  label-key="label"
                  class="w-full"
                />
              </UFormGroup>
              
              <UFormGroup label="Insurance Company Name" name="insurance_company_name">
                <UInput v-model="insuranceData.insurance_company_name" placeholder="Enter company name" />
              </UFormGroup>
              
              <UFormGroup label="Insurance Company PIN" name="insurance_company_pin">
                <UInput v-model="insuranceData.insurance_company_pin" placeholder="Enter PIN" />
              </UFormGroup>
              
              <UFormGroup label="Policy Number" name="insurance_policy_number">
                <UInput v-model="insuranceData.insurance_policy_number" placeholder="Enter policy number" />
              </UFormGroup>
              
              <UFormGroup label="Policy Holder" name="policy_holder">
                <UInput v-model="insuranceData.policy_holder" placeholder="Enter policy holder" />
              </UFormGroup>
              
              <UFormGroup label="Sum Assured" name="sum_assured">
                <UInput v-model.number="insuranceData.sum_assured" type="number" placeholder="Enter sum assured" />
              </UFormGroup>
              
              <UFormGroup label="Premium Payment Date" name="premium_payment_date">
                <UInput v-model="insuranceData.premium_payment_date" type="date" />
              </UFormGroup>
              
              <UFormGroup label="Child Age" name="child_age">
                <UInput v-model.number="insuranceData.child_age" type="number" placeholder="Enter child age (if applicable)" />
              </UFormGroup>
            </div>
            
            <UFormGroup label="Policy Purpose" name="policy_purpose">
              <UTextarea v-model="insuranceData.policy_purpose" placeholder="Enter policy purpose" />
            </UFormGroup>
          </div>
        </template>

        <!-- Additional Fields -->
        <UFormGroup label="Description" name="description">
          <UTextarea v-model="deductionData.description" placeholder="Enter description" />
        </UFormGroup>

        <UFormGroup label="Comments" name="comments">
          <UTextarea v-model="deductionData.comments" placeholder="Enter comments" />
        </UFormGroup>

        <UFormGroup label="Active" name="active">
          <UToggle v-model="deductionData.active" />
        </UFormGroup>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-4">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            label="Cancel"
            @click="handleClose"
          />
          <UButton
            type="button"
            color="primary"
            :loading="loading"
            :label="editMode ? 'Update' : 'Create'"
            @click="onSubmit"
          />
        </div>
      </UForm>
    </UCard>
  </div>
</template>
