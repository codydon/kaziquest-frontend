const SUBSCRIPTION_STATE_KEY = 'kq-subscription-state'

function createDefaultSubscriptionState() {
  return {
    selectedSubscription: null as Record<string, unknown> | null
  }
}

export const useSubscriptionState = () => {
  const subscriptionState = useState(SUBSCRIPTION_STATE_KEY, createDefaultSubscriptionState)

  const setSelectedSubscription = (selectedSubscription: Record<string, unknown> | null) => {
    subscriptionState.value.selectedSubscription = selectedSubscription
  }

  const resetSubscriptionState = () => {
    subscriptionState.value = createDefaultSubscriptionState()
  }

  return {
    subscriptionState: readonly(subscriptionState),
    setSelectedSubscription,
    resetSubscriptionState
  }
}