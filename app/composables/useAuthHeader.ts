export const useAuthHeader = (): Record<string, string> => {
  const { token } = useAuthSession()
  const { affiliateState } = useAffiliateState()

  const accessToken = token.value || affiliateState.value.accessToken

  if (!accessToken) {
    return {}
  }

  return {
    Authorization: `Bearer ${accessToken}`
  }
}