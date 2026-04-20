import { ROUTE_LIST } from '~/constants/routeList'

const adminAndManagerRoutes = [
  // SETTING PAGES
  ROUTE_LIST.settings.index,
  ROUTE_LIST.settings.billing,

  // PAYROLL PAGES
  '/payroll',
  ROUTE_LIST.payroll.index,
  ROUTE_LIST.payroll.history,

  // Time Off PAGES (`/settings` + `#timeoffs` is allow-listed under SETTING PAGES)
  ROUTE_LIST.timeOff.applications,
  ROUTE_LIST.timeOff.leaveBalances,
  '/time-off/settings',

  // Reports PAGES
  ROUTE_LIST.reports,

  // Employee pages
  ROUTE_LIST.employees.add,
  ROUTE_LIST.employees.import,

  // Events PAGES
  ROUTE_LIST.events.index,

  // Hiring PAGES (legacy flat paths kept for deep links)
  ROUTE_LIST.hiring.index,
  ROUTE_LIST.hiring.jobPostings,
  ROUTE_LIST.hiring.createJobPosting,
  ROUTE_LIST.hiring.applicants,

  // Hiring PAGES (Nuxt 4 app routes under `/hiring/*`)
  '/hiring/dashboard',
  '/hiring/postings',
  '/hiring/career-site',
  '/hiring/settings',
  '/hiring/talent-network',
  '/hiring/applicants'

]

function isRolesPermissionsPath(path: string): boolean {
  return path === '/settings/roles-permissions' || path.startsWith('/settings/roles-permissions/')
}

function isHiringNestedAdminPath(path: string): boolean {
  return (
    path.startsWith('/hiring/postings/')
    || path.startsWith('/hiring/applicants/')
    || path.startsWith('/hiring/talent-network/')
  )
}

function isPayrollAdminPath(path: string): boolean {
  if (path === '/payroll/run') {
    return true
  }
  if (path === '/payroll/settings') {
    return true
  }
  if (path === '/payroll/off-cycle') {
    return true
  }
  if (path === '/payroll/wallet-balance') {
    return true
  }
  if (/^\/payroll\/[^/]+\/(review|rerun)$/.test(path)) {
    return true
  }
  if (path.startsWith('/payroll/payslip/')) {
    return true
  }
  return false
}

export default defineNuxtRouteMiddleware((to, _from) => {
  const { session, isHydrating } = useAuthSession()
  if (isHydrating.value) return

  const user = (session.value.user ?? {}) as Record<string, unknown>

  const isRestrictedPath
    = adminAndManagerRoutes.includes(to.path)
      || isRolesPermissionsPath(to.path)
      || isHiringNestedAdminPath(to.path)
      || isPayrollAdminPath(to.path)

  // Check if the current route is one of the admin routes
  if (!isRestrictedPath) {
    // Allow navigation for non-admin routes
    return true
  }

  // Define required roles for admin routes
  const requiredRoles = ['Admin', 'HR Manager']

  // Extract user role from the store
  const group = user.group as { name?: string } | undefined
  const userRole = String(group?.name || '')

  // Check if the user's role matches any of the required roles
  const hasRequiredRole = requiredRoles.includes(userRole)

  if (hasRequiredRole) {
    return
  } else {
    if (import.meta.dev) {
      void 0 /* console.warn('[02.adminAndManager.global] redirecting to /home', {
                to: to.fullPath,
                from: _from.fullPath,
                requiredRoles,
                userRole,
                current_subscription: user?.company?.current_subscription ?? null,
            }) */
    }
    return navigateTo(ROUTE_LIST.home)
  }
})
