export const useRegistrationStore = () => {
  const {
    registrationFlow,
    setEmail,
    setStep,
    setAffiliateCode,
    setRegisterDraft,
    setVerifyCodeExpiry,
    completeRegistration,
    resetRegistration,
    initializeFromCookie
  } = useRegistrationFlow()

  const email = computed({
    get: () => registrationFlow.value.email,
    set: (value: string) => setEmail(value)
  })

  const currentStep = computed({
    get: () => registrationFlow.value.currentStep,
    set: (value: 'register' | 'verify' | 'password') => setStep(value)
  })

  const affiliateCode = computed({
    get: () => registrationFlow.value.affiliateCode,
    set: (value: string | null) => setAffiliateCode(value)
  })

  const registerDraft = computed({
    get: () => registrationFlow.value.registerDraft,
    set: (value: Record<string, unknown> | null) => setRegisterDraft(value)
  })

  const verifyCodeExpiry = computed({
    get: () => registrationFlow.value.verifyCodeExpiry,
    set: (value: string | null) => setVerifyCodeExpiry(value)
  })

  const isCompleted = computed(() => registrationFlow.value.isCompleted)

  return {
    email,
    currentStep,
    affiliateCode,
    registerDraft,
    verifyCodeExpiry,
    isCompleted,
    setEmail,
    setStep,
    setAffiliateCode,
    setRegisterDraft,
    setVerifyCodeExpiry,
    completeRegistration,
    resetRegistration,
    initializeFromCookie
  }
}
