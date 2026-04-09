export const AUTH_API_PATHS = {
  login: '/accounts/login/',
  refreshToken: '/accounts/token/refresh/',
  register: '/accounts/users/',
  authUser: '/accounts/users/auth-user/',
  whmcsSso: '/accounts/whmcs-sso/',
  passwordResetRequest: '/accounts/password-reset-request/',
  linkTokenCheck: '/accounts/link-token-check/',
  passwordResetComplete: '/accounts/password-reset-complete/',
  verifyLoginOtp: '/accounts/verify-login-otp/',
  resendLoginOtp: '/accounts/login/otp/resend/',
  verifyActivationCode: '/accounts/verify/verify_activation_code/',
  resendActivationCode: '/accounts/verify/resend_activation_code/',
  createCareerSite: '/companies/create-subdomain/'
} as const

export const AUTH_EXCLUDED_PATHS: readonly string[] = [
  AUTH_API_PATHS.login,
  AUTH_API_PATHS.refreshToken,
  AUTH_API_PATHS.passwordResetRequest,
  AUTH_API_PATHS.passwordResetComplete,
  '/accounts/check-email/',
  '/accounts/verify-domain/',
  AUTH_API_PATHS.verifyLoginOtp,
  AUTH_API_PATHS.resendLoginOtp
]
