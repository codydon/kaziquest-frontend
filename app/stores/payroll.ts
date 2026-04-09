export const usePayrollStore = () => {
  const {
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
  } = usePayrollState()

  const employeePayrollHistory = computed(() => payrollState.value.employeePayrollHistory)
  const payrollId = computed(() => payrollState.value.payrollId)
  const payslipId = computed(() => payrollState.value.payslipId)
  const payslipToView = computed(() => payrollState.value.payslipToView)
  const payrollSetupData = computed(() => payrollState.value.payrollSetupData)
  const employeesExcluded = computed(() => payrollState.value.employeesExcluded)
  const currentPeriodKey = computed(() => payrollState.value.currentPeriodKey)
  const employeesIncludedByPeriod = computed(() => payrollState.value.employeesIncludedByPeriod)
  const employeesExcludedByPeriod = computed(() => payrollState.value.employeesExcludedByPeriod)
  const employeesManuallyIncludedByPeriod = computed(() => payrollState.value.employeesManuallyIncludedByPeriod)
  const selectedPayPeriod = computed(() => payrollState.value.selectedPayPeriod)
  const selectedPayMonth = computed(() => payrollState.value.selectedPayMonth)
  const selectedPayrollYear = computed(() => payrollState.value.selectedPayrollYear)
  const validationData = computed(() => payrollState.value.validationData)

  return {
    employeePayrollHistory,
    payrollId,
    payslipId,
    payslipToView,
    payrollSetupData,
    employeesExcluded,
    currentPeriodKey,
    employeesIncludedByPeriod,
    employeesExcludedByPeriod,
    employeesManuallyIncludedByPeriod,
    selectedPayPeriod,
    selectedPayMonth,
    selectedPayrollYear,
    validationData,
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
