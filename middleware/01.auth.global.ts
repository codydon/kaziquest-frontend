import { publicPages } from "~/constants/publicRoutes"
import { ROUTE_LIST } from "~/constants/routeList"

//Purpose: Middleware to check if user is authenticated or not
export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server) return
  if (to.path?.startsWith('/post-a-job')) return navigateTo(ROUTE_LIST.auth.register)

  const { isAuthenticated, isHydrating } = useAuth()
  if (isHydrating.value) return

  if (isAuthenticated.value) return
  else if(to.path?.startsWith('/auth/')) return
  else if (publicPages.includes(to.path) || to.path?.startsWith('/jobs/') || to.path?.startsWith('/affiliate-program'))  return
  else return navigateTo({ path: ROUTE_LIST.auth.login, query: { redirect: to.fullPath } })
})
