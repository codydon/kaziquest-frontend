const SESSION_TIMEOUT_STORAGE_KEYS = [
  'timedout',
  'timeoutHash',
  'timeoutTimestamp',
  'manuallyLoggedOut',
  'logoutInProgress'
] as const

export const useSessionTimeoutState = () => {
  const resetSessionTimeoutState = () => {
    if (import.meta.server) {
      return
    }

    try {
      for (const key of SESSION_TIMEOUT_STORAGE_KEYS) {
        localStorage.removeItem(key)
      }

      localStorage.setItem('lastActivity', String(Date.now()))
      localStorage.setItem('manuallyLoggedOut', 'false')
      localStorage.setItem('logoutInProgress', 'false')
    } catch {
      // Ignore storage access failures in restricted browser contexts.
    }
  }

  return {
    resetSessionTimeoutState
  }
}