export default defineNuxtRouteMiddleware((to, from) => {

    // disallow access if coming from a /payment-success route
    if(from.path?.startsWith('/payment-success')){
      return navigateTo('/home')
    }
  
  })