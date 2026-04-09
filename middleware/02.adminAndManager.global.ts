import { ROUTE_LIST } from "~/constants/routeList";

const adminAndManagerRoutes = [
    // SETTING PAGES
    ROUTE_LIST.settings.index,
    ROUTE_LIST.settings.billing,
    ROUTE_LIST.settings.rolesPerms,

    // PAYROLL PAGES
    '/payroll',
    ROUTE_LIST.payroll.index,
    ROUTE_LIST.payroll.history,

    // Time Off PAGES
    ROUTE_LIST.timeOff.applications,
    ROUTE_LIST.timeOff.leaveBalances,

    // Reports PAGES
    ROUTE_LIST.reports,

    // Employee pages
    ROUTE_LIST.employees.add,
    ROUTE_LIST.employees.import,

    // Events PAGES
    ROUTE_LIST.events.index,

    // Hiring PAGES
    ROUTE_LIST.hiring.index,
    ROUTE_LIST.hiring.jobPostings,
    ROUTE_LIST.hiring.createJobPosting,
    ROUTE_LIST.hiring.applicants,

]

export default defineNuxtRouteMiddleware((to, from) => {
    const { session } = useAuthSession();
    const user = (session.value.user ?? {}) as Record<string, any>;

    // Check if the current route is one of the admin routes
    if (!adminAndManagerRoutes.includes(to.path)) {
        // Allow navigation for non-admin routes
        return true;
    }

    // Define required roles for admin routes
    const requiredRoles = ['Admin', 'HR Manager'];

    // Extract user role from the store
    const userRole = String(user?.group?.name || "");

    // Check if the user's role matches any of the required roles
    const hasRequiredRole = requiredRoles.includes(userRole);

    if (hasRequiredRole) {
        return 
    } else {
        if (import.meta.dev) {
            void 0 /* console.warn('[02.adminAndManager.global] redirecting to /home', {
                to: to.fullPath,
                from: from.fullPath,
                requiredRoles,
                userRole,
                current_subscription: user?.company?.current_subscription ?? null,
            }) */
        }
        navigateTo(ROUTE_LIST.home);
    }
});
