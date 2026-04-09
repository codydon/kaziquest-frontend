export const useRegistrationStore = () => {
  const {
    registrationFlow,
    setEmail,
    setStep,
    setAffiliateCode,
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

  const isCompleted = computed(() => registrationFlow.value.isCompleted)

  return {
    email,
    currentStep,
    affiliateCode,
    isCompleted,
    setEmail,
    setStep,
    setAffiliateCode,
    completeRegistration,
    resetRegistration,
    initializeFromCookie
  }
}
