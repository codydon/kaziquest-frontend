export const useTokenRefresh = () => {
  const { refreshToken, setAuthTokens } = useAuthSession()
  const baseUrl = useBaseUrl()

  const refreshAccessToken = async (): Promise<{ access: string; refresh: string }> => {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    const response = await $fetch<Record<string, any>>(`${baseUrl}/accounts/token/refresh/`, {
      method: 'POST',
      body: {
        refresh: refreshToken.value
      }
    })

    const payload = response?.data || response
    const nextAccess = String(payload?.access || '')
    const nextRefresh = String(payload?.refresh || refreshToken.value || '')

    if (!nextAccess) {
      throw new Error('Token refresh failed')
    }

    setAuthTokens({
      accessToken: nextAccess,
      refreshToken: nextRefresh
    })

    return {
      access: nextAccess,
      refresh: nextRefresh
    }
  }

  return {
    refreshToken: refreshAccessToken
  }
}