export const useAuthHeader = (): Record<string, string> => {
  const route = useRoute()
  const { token } = useAuthSession()
  const { affiliateState } = useAffiliateState()

  const routeToken = route.path.startsWith('/auth/') ? String(route.query.t ?? '') : ''
  const accessToken = token.value || routeToken || affiliateState.value.accessToken

  if (!accessToken) {
    return {}
  }

  return {
    Authorization: `Bearer ${accessToken}`
  }
}