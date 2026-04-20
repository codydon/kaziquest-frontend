import { reactive } from 'vue'

/**
 * Payroll store — reactive facade over `usePayrollState()` so migrated code can use
 * Pinia-like property access (`store.selectedPayPeriod = …`, `store.validationData.totalEmployees = …`).
 */
export const usePayrollStore = () => {
  const ctx = usePayrollState()

  return reactive({
    get employeePayrollHistory() {
      return ctx.payrollState.value.employeePayrollHistory
    },
    get payrollId() {
      return ctx.payrollState.value.payrollId
    },
    get payslipId() {
      return ctx.payrollState.value.payslipId
    },
    get payslipToView() {
      return ctx.payrollState.value.payslipToView
    },
    get payrollSetupData() {
      return ctx.payrollState.value.payrollSetupData
    },
    get employeesExcluded() {
      return ctx.payrollState.value.employeesExcluded
    },
    get currentPeriodKey() {
      return ctx.payrollState.value.currentPeriodKey
    },
    get employeesIncludedByPeriod() {
      return ctx.payrollState.value.employeesIncludedByPeriod
    },
    get employeesExcludedByPeriod() {
      return ctx.payrollState.value.employeesExcludedByPeriod
    },
    get employeesManuallyIncludedByPeriod() {
      return ctx.payrollState.value.employeesManuallyIncludedByPeriod
    },
    get selectedPayPeriod() {
      return ctx.payrollState.value.selectedPayPeriod
    },
    set selectedPayPeriod(v: Record<string, unknown>) {
      ctx.setSelectedPayPeriod(v)
    },
    get selectedPayMonth() {
      return ctx.payrollState.value.selectedPayMonth
    },
    set selectedPayMonth(v: number) {
      ctx.setSelectedPayMonth(v)
    },
    get selectedPayrollYear() {
      return ctx.payrollState.value.selectedPayrollYear
    },
    get validationData() {
      return ctx.payrollState.value.validationData
    },
    get getTotalEmployeesToBePartOfPayroll() {
      return ctx.getTotalEmployeesToBePartOfPayroll.value
    },
    generatePeriodKey: ctx.generatePeriodKey,
    setCurrentPeriod: ctx.setCurrentPeriod,
    getCurrentPeriodExclusions: ctx.getCurrentPeriodExclusions,
    getCurrentPeriodManualInclusions: ctx.getCurrentPeriodManualInclusions,
    clearCurrentPeriodExclusions: ctx.clearCurrentPeriodExclusions,
    savePayrollSetupData: ctx.savePayrollSetupData,
    clearPayrollSetupData: ctx.clearPayrollSetupData,
    setupPayslipId: ctx.setupPayslipId,
    fetchPayrollHistory: ctx.fetchPayrollHistory,
    setPayrollId: ctx.setPayrollId,
    removePayrollId: ctx.removePayrollId,
    setSelectedPayrollYear: ctx.setSelectedPayrollYear,
    setSelectedPayMonth: ctx.setSelectedPayMonth,
    setSelectedPayPeriod: ctx.setSelectedPayPeriod,
    setValidationTotalEmployees: ctx.setValidationTotalEmployees,
    setEmployeesExcluded: ctx.setEmployeesExcluded,
    clearEmployeesExcluded: ctx.clearEmployeesExcluded,
    addManualExclusion: ctx.addManualExclusion,
    removeManualExclusion: ctx.removeManualExclusion,
    addManualInclusion: ctx.addManualInclusion,
    removeManualInclusion: ctx.removeManualInclusion,
    excludeEmployee: ctx.excludeEmployee,
    removeEmployeeFromExcluded: ctx.removeEmployeeFromExcluded,
    setPayslipToView: ctx.setPayslipToView,
    clearPayslipToView: ctx.clearPayslipToView,
    resetPayrollState: ctx.resetPayrollState
  })
}
