export const useTokenRefresh = () => {
  const { setAuthTokens } = useAuthSession()
  const baseUrl = useBaseUrl()

  const refreshAccessToken = async (): Promise<{ access: string }> => {
    const response = await $fetch<Record<string, any>>(`${baseUrl}/accounts/token/refresh/`, {
      method: 'POST',
      credentials: 'include'
    })

    const payload = response?.data || response
    const nextAccess = String(payload?.access || '')

    if (!nextAccess) {
      throw new Error('Token refresh failed')
    }

    setAuthTokens({
      accessToken: nextAccess
    })

    return {
      access: nextAccess
    }
  }

  return {
    refreshAccessToken
  }
}