export const useCompanyStore = () => {
  const {
    companyState,
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
  } = useCompanyState()

  const company = computed(() => companyState.value.company)
  const providers = computed(() => companyState.value.providers)
  const companyId = computed({
    get: () => companyState.value.companyId,
    set: (value: string) => setCompanyId(value)
  })
  const companyInfo = computed({
    get: () => companyState.value.companyInfo,
    set: (value: Record<string, unknown>) => setCompanyInfo(value)
  })
  const referredCompany = computed({
    get: () => companyState.value.referredCompany,
    set: (value: string) => setReferredCompany(value)
  })
  const noWorkdays = computed({
    get: () => companyState.value.noWorkdays,
    set: (value: unknown[]) => setNoWorkdays(value)
  })
  const departments = computed({
    get: () => companyState.value.departments,
    set: (value: unknown[]) => setDepartments(value)
  })
  const positions = computed({
    get: () => companyState.value.positions,
    set: (value: unknown[]) => setPositions(value)
  })
  const currentCurrency = computed({
    get: () => companyState.value.currentCurrency,
    set: (value: string) => setCurrentCurrency(value)
  })
  const selectedPlan = computed({
    get: () => companyState.value.selectedPlan,
    set: (value: Record<string, unknown> | null) => setSelectedPlan(value)
  })
  const selectedBillingCycle = computed({
    get: () => companyState.value.selectedBillingCycle,
    set: (value: string) => setSelectedBillingCycle(value)
  })

  const changeCurrency = (currency: string) => {
    setCurrentCurrency(currency)
  }

  const setNoWorkingDays = async (payload: Record<string, unknown>) => {
    return await useApi('/companies/non-workdays/', {
      handler: '$fetch',
      method: 'POST',
      body: payload
    })
  }

  const updateDrivers = async (payload: Record<string, unknown>) => {
    return await useApi(`/companies/sms-drivers/${String((payload as any)?.id || '')}/`, {
      handler: '$fetch',
      method: 'PATCH',
      body: payload
    })
  }

  const getProviders = async () => {
    const smsProviders = await useApi('/sms/drivers', {
      handler: '$fetch',
      method: 'GET'
    })
    setProviders((smsProviders as any) || [])
    return smsProviders
  }

  const setSMSDrivers = async (payload: Record<string, unknown>) => {
    return await useApi('/companies/sms-drivers/', {
      handler: '$fetch',
      method: 'POST',
      body: payload
    })
  }

  const getSMSDrivers = () => useApi('/sms/drivers', {
    handler: '$fetch',
    method: 'GET'
  })

  const getSMSdriver = async (id: string) => {
    return await useApi(`/companies/sms-drivers/${id}/`, {
      handler: '$fetch',
      method: 'GET'
    })
  }

  const sendSMS = async (payload: Record<string, unknown>) => {
    return await useApi('/sms/messages/', {
      handler: '$fetch',
      method: 'POST',
      body: payload
    })
  }

  return {
    company,
    providers,
    companyId,
    companyInfo,
    referredCompany,
    noWorkdays,
    departments,
    positions,
    currentCurrency,
    selectedPlan,
    selectedBillingCycle,
    setCompanyId,
    setCompanyInfo,
    setReferredCompany,
    setNoWorkdays,
    setDepartments,
    setPositions,
    setSelectedPlan,
    setSelectedBillingCycle,
    setProviders,
    changeCurrency,
    setNoWorkingDays,
    updateDrivers,
    getProviders,
    setSMSDrivers,
    getSMSDrivers,
    getSMSdriver,
    sendSMS,
    resetCompanyState
  }
}
