const PAYROLL_STATE_KEY = 'kq-payroll-state'

function createDefaultPayrollSetupData() {
  return {
    legal_name: '',
    dba: '',
    kra_pin: '',
    nssf_number: '',
    shif_number: '',
    headquarters_address: '',
    country: '',
    phone_number: '',
    website_uri: '',
    kaziquest_files_taxes: false
  }
}

function createDefaultPayrollState() {
  return {
    employeePayrollHistory: [] as unknown[],
    payrollId: '',
    payslipId: '',
    payslipToView: {} as Record<string, unknown>,
    payrollSetupData: createDefaultPayrollSetupData(),
    employeesExcluded: [] as string[],
    currentPeriodKey: '',
    employeesIncludedByPeriod: {} as Record<string, string[]>,
    employeesExcludedByPeriod: {} as Record<string, string[]>,
    employeesManuallyIncludedByPeriod: {} as Record<string, string[]>,
    selectedPayPeriod: {} as Record<string, unknown>,
    selectedPayMonth: new Date().getMonth() + 1,
    selectedPayrollYear: new Date().getFullYear(),
    validationData: {
      totalEmployees: 0
    }
  }
}

export const usePayrollState = () => {
  const payrollState = useState(PAYROLL_STATE_KEY, createDefaultPayrollState)

  const generatePeriodKey = (fromDate: string, toDate: string): string => `${fromDate}|${toDate}`

  const setCurrentPeriod = (fromDate: string, toDate: string) => {
    const key = generatePeriodKey(fromDate, toDate)
    payrollState.value.currentPeriodKey = key

    if (!payrollState.value.employeesExcludedByPeriod[key]) {
      payrollState.value.employeesExcludedByPeriod[key] = []
    }

    if (!payrollState.value.employeesManuallyIncludedByPeriod[key]) {
      payrollState.value.employeesManuallyIncludedByPeriod[key] = []
    }
  }

  const getCurrentPeriodExclusions = (): string[] => {
    return payrollState.value.employeesExcludedByPeriod[payrollState.value.currentPeriodKey] || []
  }

  const getCurrentPeriodManualInclusions = (): string[] => {
    return payrollState.value.employeesManuallyIncludedByPeriod[payrollState.value.currentPeriodKey] || []
  }

  const clearCurrentPeriodExclusions = () => {
    if (payrollState.value.currentPeriodKey) {
      payrollState.value.employeesExcludedByPeriod[payrollState.value.currentPeriodKey] = []
    }
  }

  const savePayrollSetupData = (data: Record<string, unknown>) => {
    payrollState.value.payrollSetupData = {
      ...createDefaultPayrollSetupData(),
      ...data
    }
  }

  const clearPayrollSetupData = () => {
    payrollState.value.payrollSetupData = createDefaultPayrollSetupData()
  }

  const setupPayslipId = (payslipId: string) => {
    payrollState.value.payslipId = payslipId
  }

  const fetchPayrollHistory = async (employeeId: string) => {
    const response = await useApi(`/payroll/payslips/employee?id=${employeeId}`, {
      handler: '$fetch',
      method: 'GET'
    }) as Record<string, any>
    payrollState.value.employeePayrollHistory = Array.isArray(response?.data) ? response.data : []
  }

  const setPayrollId = (payrollId: string) => {
    payrollState.value.payrollId = payrollId
  }

  const removePayrollId = () => {
    payrollState.value.payrollId = ''
  }

  const setSelectedPayrollYear = (year: number) => {
    payrollState.value.selectedPayrollYear = year
  }

  const setEmployeesExcluded = (employeesExcluded: string[], periodKey?: string) => {
    const key = periodKey || payrollState.value.currentPeriodKey

    if (key) {
      payrollState.value.employeesExcludedByPeriod[key] = employeesExcluded || []
      return
    }

    payrollState.value.employeesExcluded = employeesExcluded || []
  }

  const clearEmployeesExcluded = () => {
    clearCurrentPeriodExclusions()
  }

  const addManualExclusion = (id: string) => {
    if (!payrollState.value.currentPeriodKey) {
      return
    }

    const current = payrollState.value.employeesExcludedByPeriod[payrollState.value.currentPeriodKey] || []

    if (!current.includes(id)) {
      payrollState.value.employeesExcludedByPeriod[payrollState.value.currentPeriodKey] = [...current, id]
    }
  }

  const removeManualExclusion = (id: string) => {
    if (!payrollState.value.currentPeriodKey) {
      return
    }

    const current = payrollState.value.employeesExcludedByPeriod[payrollState.value.currentPeriodKey] || []
    payrollState.value.employeesExcludedByPeriod[payrollState.value.currentPeriodKey] = current.filter(employeeId => employeeId !== id)
  }

  const addManualInclusion = (id: string) => {
    if (!payrollState.value.currentPeriodKey) {
      return
    }

    const current = payrollState.value.employeesManuallyIncludedByPeriod[payrollState.value.currentPeriodKey] || []

    if (!current.includes(id)) {
      payrollState.value.employeesManuallyIncludedByPeriod[payrollState.value.currentPeriodKey] = [...current, id]
    }
  }

  const removeManualInclusion = (id: string) => {
    if (!payrollState.value.currentPeriodKey) {
      return
    }

    const current = payrollState.value.employeesManuallyIncludedByPeriod[payrollState.value.currentPeriodKey] || []
    payrollState.value.employeesManuallyIncludedByPeriod[payrollState.value.currentPeriodKey] = current.filter(employeeId => employeeId !== id)
  }

  const excludeEmployee = (id: string) => {
    if (!payrollState.value.currentPeriodKey) {
      return
    }

    const current = payrollState.value.employeesExcludedByPeriod[payrollState.value.currentPeriodKey] || []

    if (current.includes(id)) {
      payrollState.value.employeesExcludedByPeriod[payrollState.value.currentPeriodKey] = current.filter(employeeId => employeeId !== id)
      return
    }

    payrollState.value.employeesExcludedByPeriod[payrollState.value.currentPeriodKey] = [...current, id]
  }

  const removeEmployeeFromExcluded = (id: string) => {
    removeManualExclusion(id)
  }

  const setPayslipToView = (payslip: Record<string, unknown>) => {
    payrollState.value.payslipToView = payslip
  }

  const clearPayslipToView = () => {
    payrollState.value.payslipToView = {}
  }

  const getTotalEmployeesToBePartOfPayroll = computed(() => {
    const currentExclusions = payrollState.value.employeesExcludedByPeriod[payrollState.value.currentPeriodKey] || []
    return Number(payrollState.value.validationData?.totalEmployees || 0) - currentExclusions.length
  })

  const resetPayrollState = () => {
    payrollState.value = createDefaultPayrollState()
  }

  return {
    payrollState,
    getTotalEmployeesToBePartOfPayroll,
    generatePeriodKey,
    setCurrentPeriod,
    getCurrentPeriodExclusions,
    getCurrentPeriodManualInclusions,
    clearCurrentPeriodExclusions,
    savePayrollSetupData,
    clearPayrollSetupData,
    setupPayslipId,
    fetchPayrollHistory,
    setPayrollId,
    removePayrollId,
    setSelectedPayrollYear,
    setEmployeesExcluded,
    clearEmployeesExcluded,
    addManualExclusion,
    removeManualExclusion,
    addManualInclusion,
    removeManualInclusion,
    excludeEmployee,
    removeEmployeeFromExcluded,
    setPayslipToView,
    clearPayslipToView,
    resetPayrollState
  }
}
