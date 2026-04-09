import type { RegistrationFlowState, RegistrationStep } from '~/types'

const REGISTRATION_STATE_KEY = 'kq-registration-flow'
const AFFILIATE_CODE_COOKIE = 'affiliate_code'

function createDefaultRegistrationState(): RegistrationFlowState {
  return {
    email: '',
    currentStep: 'register',
    affiliateCode: null,
    registerDraft: null,
    verifyCodeExpiry: null,
    isCompleted: false
  }
}

export const useRegistrationFlow = () => {
  const registrationFlow = useState<RegistrationFlowState>(REGISTRATION_STATE_KEY, createDefaultRegistrationState)

  const affiliateCodeCookie = useCookie<string | null>(AFFILIATE_CODE_COOKIE, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    default: () => null
  })

  const setEmail = (email: string) => {
    registrationFlow.value.email = email
  }

  const setStep = (step: RegistrationStep) => {
    registrationFlow.value.currentStep = step
  }

  const setAffiliateCode = (code: string | null) => {
    registrationFlow.value.affiliateCode = code
    affiliateCodeCookie.value = code
  }

  const setRegisterDraft = (draft: Record<string, unknown> | null) => {
    registrationFlow.value.registerDraft = draft
  }

  const setVerifyCodeExpiry = (expiry: string | null) => {
    registrationFlow.value.verifyCodeExpiry = expiry
  }

  const completeRegistration = () => {
    registrationFlow.value.isCompleted = true
    registrationFlow.value.registerDraft = null
    registrationFlow.value.verifyCodeExpiry = null
    affiliateCodeCookie.value = null
  }

  const resetRegistration = () => {
    registrationFlow.value = createDefaultRegistrationState()
    affiliateCodeCookie.value = null
  }

  const initializeFromCookie = () => {
    if (affiliateCodeCookie.value && !registrationFlow.value.affiliateCode) {
      registrationFlow.value.affiliateCode = affiliateCodeCookie.value
    }
  }

  return {
    registrationFlow: readonly(registrationFlow),
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