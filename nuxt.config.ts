// https://nuxt.com/docs/api/configuration/nuxt-config
const parseBooleanEnv = (value: string | undefined, fallback = false) => {
  if (value == null || value === '') {
    return fallback
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}

const publicRuntimeConfig = {
  currentEnvironment: env.NUXT_PUBLIC_CURRENT_ENVIRONMENT || env.NODE_ENV || 'development',
  apiBase: env.NUXT_PUBLIC_API_BASE || env.BACKEND_URL || '',
  mainAppUrl: env.NUXT_PUBLIC_MAIN_APP_URL || env.MAIN_APP_URL || '',
  excludedSubdomains: env.NUXT_PUBLIC_EXCLUDED_SUBDOMAINS || env.EXCLUDED_SUBDOMAINS || 'app,beta-test,alpha-test,jobs',
  siteUrl: env.NUXT_PUBLIC_SITE_URL || '',
  useMockPayments: parseBooleanEnv(env.NUXT_PUBLIC_USE_MOCK_PAYMENTS, false),
  sentryDsn: env.NUXT_PUBLIC_SENTRY_DSN || env.SENTRY_DSN || ''
}

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    apiSecret: env.NUXT_API_SECRET || '',
    public: publicRuntimeConfig
  },

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  experimental: {
    checkOutdatedBuildInterval: 1000 * 60 * 5
  },

  compatibilityDate: '2026-04-08',

  typescript: {
    strict: true,
    typeCheck: true
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
