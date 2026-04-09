import { ROUTE_LIST } from "~/constants/routeList";

export default defineNuxtRouteMiddleware((to, from) => {
    const { session, isHydrating } = useAuthSession();
    if (isHydrating.value) return

    const user = (session.value.user ?? {}) as Record<string, any>;

    // Get the required roles and permissions from the route meta
    const requiredRoles = to?.meta?.roles as string[] || [];
    // // console.log('requiredRoles: ', requiredRoles);
    const requiredPermissions = to?.meta?.permissions as string[] || [];
    // // console.log('requiredPermissions: ', requiredPermissions);

    // Check if the user has the required roles or permissions
    // // console.log('authStore.user.group.name: ', authStore.user.group.name);
    const hasRole = requiredRoles.length === 0 || requiredRoles.includes(String(user?.group?.name || ""));
    const hasPermission = requiredPermissions.length === 0 || requiredPermissions.some(permission =>
        user?.group?.permissions?.some((p: { codename: string }) => p.codename.includes(permission))
    );

    // // console.log('hasRole, hasPermission: ', hasRole, hasPermission);

    // Redirect if the user does not have access
    if (!hasRole || !hasPermission) {
        // // console.log('Unauthorized access');
        return navigateTo(ROUTE_LIST.home); // Redirect to an unauthorized page
    }
});