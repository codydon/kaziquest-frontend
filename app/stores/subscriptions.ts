export const useSubscriptionStore = () => {
  const { subscriptionState, setSelectedSubscription, resetSubscriptionState } = useSubscriptionState()

  const selectedSubscription = computed({
    get: () => subscriptionState.value.selectedSubscription,
    set: (value: Record<string, unknown> | null) => setSelectedSubscription(value)
  })

  return {
    selectedSubscription,
    setSelectedSubscription,
    resetSubscriptionState
  }
}
