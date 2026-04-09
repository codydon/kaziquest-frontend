import { publicPages } from "~/constants/publicRoutes"
import { ROUTE_LIST } from "~/constants/routeList"

const BILLING_HASHES = new Set([
    "#billing",
    "#subscriptions",
    "#invoices",
    "#plans",
    "#plansandbilling",
])

export default defineNuxtRouteMiddleware(async (to, from) => {
    if (import.meta.server) return

    const { isAuthenticated } = useAuth()
    if(!isAuthenticated.value) return

    if (to.path?.startsWith('/checkout') || to.path?.startsWith('/jobs/')) return

    const isPublicRoute = publicPages.some(route => to.fullPath === route)
    if (isPublicRoute) return

    // If subscription is expired and trying to access restricted route
    const { session } = useAuthSession()
    const user = (session.value.user ?? {}) as Record<string, any>
    const isCompanySuspended = Boolean(user?.company?.suspended)
    const suspensionReason = String(user?.company?.suspension_reason || "OTHER")

    const isHomeRoute = to.path === ROUTE_LIST.home
    const isPaymentSuccessRoute = to.path === ROUTE_LIST.paymentSuccess
    const isCheckoutRoute = to.path?.startsWith("/checkout")
    const isBillingRoute =
        to.path === "/settings" && BILLING_HASHES.has(to.hash || "")

    if (isCompanySuspended && suspensionReason === "BILLING") {
        if (isHomeRoute || isBillingRoute || isCheckoutRoute || isPaymentSuccessRoute) return
        return navigateTo(ROUTE_LIST.settings.billing)
    }

    if (isCompanySuspended && suspensionReason === "OTHER") {
        if (isHomeRoute) return
        return navigateTo(ROUTE_LIST.home)
    }

})
