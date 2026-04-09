import type { PaymentState } from '~/types'

const PAYMENT_STATE_KEY = 'kq-payment-state'

function createDefaultPaymentState(): PaymentState {
  return {
    response: null,
    error: null
  }
}

export const usePaymentState = () => {
  const paymentState = useState<PaymentState>(PAYMENT_STATE_KEY, createDefaultPaymentState)

  const setResponse = (response: unknown | null) => {
    paymentState.value.response = response
  }

  const setError = (error: unknown | null) => {
    paymentState.value.error = error
  }

  const resetPaymentState = () => {
    paymentState.value = createDefaultPaymentState()
  }

  return {
    paymentState: readonly(paymentState),
    setResponse,
    setError,
    resetPaymentState
  }
}