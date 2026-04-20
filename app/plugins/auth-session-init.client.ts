import { publicPages } from '~~/constants/publicRoutes'
import { ROUTE_LIST } from '~/constants/routeList'
import { authService } from '~/services/auth.service'

const isPublicRoute = (path: string) => {
  return (
    path.startsWith('/auth/') ||
    publicPages.includes(path) ||
    path.startsWith('/jobs/') ||
    path.startsWith('/affiliate-program')
  )
}

export default defineNuxtPlugin((nuxtApp) => {
  const route = useRoute()
  const {
    token,
    session,
    isAuthenticated,
    beginHydration,
    finishHydration,
    setAuthTokens,
    setUser
  } = useAuthSession()

  if (import.meta.server) {
    return
  }

  nuxtApp.hook('app:mounted', async () => {
    beginHydration()

    try {
      if (!token.value) {
        return
      }

      const hasUser = Boolean(session.value.user && Object.keys(session.value.user).length > 0)
      const persistedUser = session.value.user as { group?: { name?: string } } | null | undefined
      const groupReady = Boolean(persistedUser && String(persistedUser.group?.name ?? '').trim())
      if (hasUser && groupReady) {
        return
      }

      const response = await authService.fetchAuthUser({
        handler: '$fetch',
        secured: true
      })
      const payload = (response as Record<string, any>)?.data ?? (response as Record<string, any>)
      const userData = (payload?.data ?? payload) as Record<string, any>

      if (!userData || typeof userData !== 'object') {
        return
      }

      if (typeof userData.access === 'string' && userData.access) {
        setAuthTokens({
          accessToken: userData.access,
          refreshToken: typeof userData.refresh === 'string' ? userData.refresh : null
        })
      }

      const { access: _access, refresh: _refresh, ...user } = userData
      setUser(user)
    } catch {
      // Let the auth middleware route unauthenticated users after hydration.
    } finally {
      finishHydration()
    }

    if (isAuthenticated.value || isPublicRoute(route.path)) {
      return
    }

    await navigateTo({
      path: ROUTE_LIST.auth.login,
      query: { redirect: route.fullPath }
    })
  })
})