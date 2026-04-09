export default defineNuxtRouteMiddleware((to, from) => {

  // Only allow access if coming from a /checkout/ route
  if(!from.path?.startsWith('/checkout/')){
    return navigateTo('/home')
  }

})