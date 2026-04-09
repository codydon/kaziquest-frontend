import type { CompanyState } from '~/types'

const COMPANY_STATE_KEY = 'kq-company-state'

function createDefaultCompanyState(): CompanyState {
  return {
    company: null,
    providers: [],
    companyId: '',
    companyInfo: {},
    referredCompany: '',
    noWorkdays: [],
    departments: [],
    positions: [],
    currentCurrency: 'KES',
    selectedPlan: null,
    selectedBillingCycle: 'MONTHLY'
  }
}

export const useCompanyState = () => {
  const companyState = useState<CompanyState>(COMPANY_STATE_KEY, createDefaultCompanyState)

  const setCompanyId = (companyId: string) => {
    companyState.value.companyId = companyId
  }

  const setCompanyInfo = (companyInfo: Record<string, unknown>) => {
    companyState.value.companyInfo = companyInfo
  }

  const setReferredCompany = (referredCompany: string) => {
    companyState.value.referredCompany = referredCompany
  }

  const setNoWorkdays = (noWorkdays: unknown[]) => {
    companyState.value.noWorkdays = noWorkdays
  }

  const setDepartments = (departments: unknown[]) => {
    companyState.value.departments = departments
  }

  const setPositions = (positions: unknown[]) => {
    companyState.value.positions = positions
  }

  const setCurrentCurrency = (currentCurrency: string) => {
    companyState.value.currentCurrency = currentCurrency
  }

  const setSelectedPlan = (selectedPlan: Record<string, unknown> | null) => {
    companyState.value.selectedPlan = selectedPlan
  }

  const setSelectedBillingCycle = (selectedBillingCycle: string) => {
    companyState.value.selectedBillingCycle = selectedBillingCycle
  }

  const setProviders = (providers: unknown[]) => {
    companyState.value.providers = providers
  }

  const resetCompanyState = () => {
    companyState.value = createDefaultCompanyState()
  }

  return {
    companyState: readonly(companyState),
    setCompanyId,
    setCompanyInfo,
    setReferredCompany,
    setNoWorkdays,
    setDepartments,
    setPositions,
    setCurrentCurrency,
    setSelectedPlan,
    setSelectedBillingCycle,
    setProviders,
    resetCompanyState
  }
}