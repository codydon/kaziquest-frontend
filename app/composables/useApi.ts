import type { UseFetchOptions, AsyncData, AsyncDataOptions } from "#app"
import { AUTH_EXCLUDED_PATHS } from '~/constants/auth'
import { ROUTE_LIST } from '~/constants/routeList'

// USAGE PATTERNS
// Recommended: Use a service layer and pass `handler` from the component/page.
// 1. useFetch (default) - direct reactive state in components
// const { data, pending, error } = useApi('/dashboard/stats')

// 2. $fetch - imperative await (your pattern)
// const res = await useApi('/tst', {
//     handler: '$fetch',
//     method: 'POST',
//     body: { scenario: 'success' }
// })

// 3. useAsyncData - keyed caching
// const { data, refresh } = useApi('/items', {
//     handler: 'useAsyncData',
//     key: 'items-cache'
// })

// 4. Service layer example (recommended) - component controls handler for flexibility
// services/profile.service.ts
// export const profileService = {
//   updateProfile(payload: Record<string, any>, options: UseApiOptions = {}) {
//     return useApi('/accounts/users/me/', {
//       method: 'PATCH',
//       body: payload,
//       ...options
//     })
//   }
// }
//
// In component/page:
// const updated = await profileService.updateProfile(
//   { first_name: 'Ayo' },
//   { handler: '$fetch' }
// )

type FetchHandler = 'useFetch' | '$fetch' | 'useAsyncData'

let refreshInFlight: Promise<boolean> | null = null
let logoutInFlight: Promise<void> | null = null

const getRequestUrl = (request: RequestInfo | URL): string => {
  if (typeof request === "string") return request
  if (typeof URL !== "undefined" && request instanceof URL) return request.toString()
  if (typeof Request !== "undefined" && request instanceof Request) return request.url
  return String(request)
}

const shouldAttemptRefresh = (requestUrl: string, secured: boolean): boolean => {
  if (!secured) return false
  return !AUTH_EXCLUDED_PATHS.some(path => requestUrl.includes(path))
}

const shouldAttachAuthHeader = (requestUrl: string, secured: boolean): boolean => {
  if (!secured) return false
  return !AUTH_EXCLUDED_PATHS.some(path => requestUrl.includes(path))
}

// Options extending native UseFetchOptions with handler property
export type UseApiOptions<T = any> = UseFetchOptions<T> & {
  handler?: FetchHandler,
  secured?: boolean
}

// export type UseApiError = {
//   statusCode: number;
//   statusMessage: string;
//   stack: any;
//   message: string;
//   data: any;
// }

// Single flexible signature - use generic param or 'as' for specific return types
export function useApi<T = any>(
  url: string | (() => string),
  options?: UseApiOptions<T>
): any {
  const config = useRuntimeConfig();
  // const { buildHeaders } = useHeaders('app');
  // const { getBaseURL } = useBaseUrl();
  const toast = useToast();
  const { clearSession, logout } = useAuthSession();
  const refreshMetrics = useState('kq-auth-refresh-metrics', () => ({
    attempts: 0,
    successes: 0,
    failures: 0,
    retries: 0
  }))
  
  const handler = options?.handler ?? 'useFetch'
  const secured = options?.secured ?? true

  const refreshAccessToken = async (): Promise<boolean> => {
    if (refreshInFlight) return refreshInFlight

    refreshInFlight = (async () => {
      refreshMetrics.value.attempts += 1
      try {
        const { useTokenRefresh } = await import("~/composables/useTokenRefresh")
        const { refreshAccessToken } = useTokenRefresh()
        await refreshAccessToken()
        refreshMetrics.value.successes += 1
        return true
      } catch {
        refreshMetrics.value.failures += 1
        return false
      } finally {
        refreshInFlight = null
      }
    })()

    return refreshInFlight
  }

  const logoutOnce = async () => {
    if (!logoutInFlight) {
      logoutInFlight = (async () => {
        await logout()
        await navigateTo(ROUTE_LIST.auth.login)
      })().finally(() => {
        logoutInFlight = null
      })
    }

    await logoutInFlight
  }
  
  // Extract and remove custom 'handler' and 'key' from options before passing to native composables
  const { handler: _handler, secured: _secured, key: _key, ...nativeOptions } = options || {}
  
  // Shared $fetch instance with interceptors
  const $customFetch: any = $fetch.create({
    baseURL: useBaseUrl(),
    onRequest({ options, request }) {
      const requestUrl = getRequestUrl(request)
      const headers = shouldAttachAuthHeader(requestUrl, secured) ? useAuthHeader() : {};
      if (options.body instanceof FormData) {
        const { 'Content-Type': _, ...headersWithoutContentType } = headers;
        options.headers = { ...options.headers, ...headersWithoutContentType };
      } else {
        options.headers = { ...options.headers, ...headers };
      }
      
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;
      if (isTauri || config.public.currentEnvironment === 'development') {
        const url = typeof request === 'string' ? request : request.url;
        void 0 /* console.debug('[API Request]', { url, method: options.method || 'GET', baseURL: useBaseUrl() }); */
      }
    },
    onResponse({ response }) {
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;
      if (isTauri || config.public.currentEnvironment === 'development') {
        void 0 /* console.debug('[API Response]', { url: response.url, status: response.status }); */
      }
    },
    async onResponseError({ response, request, options: requestOptions }): Promise<any> {
      const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__;
      const requestUrl = getRequestUrl(request)
      const requestMeta = requestOptions as Record<string, any>
      const hasRetriedAfterRefresh = Boolean(requestMeta._retryAfterRefresh)
      
      if (isTauri || config.public.currentEnvironment === 'development') {
        void 0 /* console.debug('[API Error]', { 
          url: response.url, 
          status: response.status,
          error: response._data 
        }); */
      }

      if (
        response.status === 401 &&
        shouldAttemptRefresh(requestUrl, secured) &&
        !hasRetriedAfterRefresh
      ) {
        const refreshed = await refreshAccessToken()

        if (refreshed) {
          refreshMetrics.value.retries += 1
          const retryOptions = {
            ...requestMeta,
            _retryAfterRefresh: true,
            headers: { ...(requestMeta.headers || {}), ...useAuthHeader() },
          }

          return $customFetch(request, retryOptions)
        }
      }

      if (response.status === 401 && shouldAttemptRefresh(requestUrl, secured)) {
        clearSession()
        toast.add({
          icon: "i-heroicons-x-circle",
          title: "Authentication failed",
          description: "Please log in again.",
          color: "error"
        })
        await logoutOnce()
      }

      const errorData = response._data || {};

      throw createError({
        statusCode: response.status,
        statusMessage: response.statusText,
        stack: errorData,
        message: errorData?.message || errorData?.error || 'An error occurred',
        data: errorData // Preserve full response data including debug_info
       });
    }
  })
  
  // Handler: 'useFetch' - Standard useFetch behavior (default)
  if (handler === 'useFetch') {
    return useFetch(url, { ...(nativeOptions as any), $fetch: $customFetch })
  }
  
  // Handler: '$fetch' - Execute immediately (native $fetch behavior, returns Promise<T>)
  if (handler === '$fetch') {
    const finalUrl = typeof url === 'function' ? url() : url
    return $customFetch(finalUrl, nativeOptions as any) as Promise<T>
  }
  
  // Handler: 'useAsyncData' - useAsyncData with custom key
  if (handler === 'useAsyncData') {
    const asyncKey = options?.key ?? (typeof url === 'string' ? url : url())
    return useAsyncData<T>(asyncKey as string, () => $customFetch(
      typeof url === 'function' ? url() : url,
      nativeOptions as any
    ) as Promise<T>, {
      server: false,  // SPA mode
      ...(nativeOptions as any)
    })
  }
  
  throw new Error(`Unknown handler: ${handler}`)
}

export default useApi
