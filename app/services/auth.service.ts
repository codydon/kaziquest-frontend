import { useApi, type UseApiOptions } from '~/composables/useApi'
import { AUTH_API_PATHS } from '~/constants/auth'

type ApiOptions = UseApiOptions<Record<string, unknown>>

export const authService = {
  login,
  register,
  whmcsSSO,
  passwordResetRequest,
  linkTokenCheck,
  passwordResetComplete,
  verifyLoginOTP,
  resendLoginOTP,
  fetchAuthUser,
  verifyActivationCode,
  resendActivationCode,
  updateUserData,
  createCareerSite
}

function login(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.login, {
    ...options,
    method: 'POST',
    secured: false
  })
}

function register(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.register, {
    ...options,
    method: 'POST',
    secured: false
  })
}

function whmcsSSO(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.whmcsSso, {
    ...options,
    method: 'POST',
    secured: false
  })
}

function passwordResetRequest(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.passwordResetRequest, {
    ...options,
    method: 'POST',
    secured: false
  })
}

function linkTokenCheck(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.linkTokenCheck, {
    ...options,
    method: 'POST',
    secured: false
  })
}

function passwordResetComplete(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.passwordResetComplete, {
    ...options,
    method: 'PATCH',
    secured: false
  })
}

function verifyLoginOTP(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.verifyLoginOtp, {
    ...options,
    method: 'POST',
    secured: false
  })
}

function resendLoginOTP(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.resendLoginOtp, {
    ...options,
    method: 'POST',
    secured: false
  })
}

function fetchAuthUser(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.authUser, {
    ...options,
    method: 'GET'
  })
}

function verifyActivationCode(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.verifyActivationCode, {
    ...options,
    method: 'POST',
    secured: false
  })
}

function resendActivationCode(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.resendActivationCode, {
    ...options,
    method: 'POST',
    secured: false
  })
}

function updateUserData(id: string, options: ApiOptions = {}) {
  if (!id) {
    throw new Error('User id is required to update user data.')
  }

  return useApi(`/accounts/users/${id}/`, {
    ...options,
    method: 'PATCH'
  })
}

function createCareerSite(options: ApiOptions = {}) {
  return useApi(AUTH_API_PATHS.createCareerSite, {
    ...options,
    method: 'POST'
  })
}
