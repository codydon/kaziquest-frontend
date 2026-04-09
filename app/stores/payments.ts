export const usePaymentStore = () => {
  const { paymentState, setResponse, setError, resetPaymentState } = usePaymentState()

  const m_response = computed({
    get: () => paymentState.value.response,
    set: (value: unknown | null) => setResponse(value)
  })

  const m_error = computed({
    get: () => paymentState.value.error,
    set: (value: unknown | null) => setError(value)
  })

  return {
    m_response,
    m_error,
    setResponse,
    setError,
    resetPaymentState
  }
}
