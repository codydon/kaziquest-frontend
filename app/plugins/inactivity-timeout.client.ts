import { ROUTE_LIST } from '~/constants/routeList'

const STORAGE_LAST_ACTIVITY = 'lastActivity'
const CHECK_INTERVAL_MS = 5000
const WARNING_BEFORE_MS = 60 * 1000
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'focus'] as const

export default defineNuxtPlugin(() => {
  const {
    session,
    isAuthenticated,
    isHydrating,
    logout
  } = useAuthSession()

  let timer: ReturnType<typeof setInterval> | null = null
  let warningShown = false

  const getTimeoutMs = () => {
    const userTimeout = Number((session.value.user as Record<string, any> | null)?.inactivity_timeout_minutes)
    if (Number.isFinite(userTimeout) && userTimeout > 0) {
      return userTimeout * 60 * 1000
    }

    return DEFAULT_TIMEOUT_MS
  }

  const setLastActivity = () => {
    try {
      localStorage.setItem(STORAGE_LAST_ACTIVITY, String(Date.now()))
    } catch {
      // Ignore storage failures in privacy-restricted contexts.
    }

    warningShown = false
  }

  const getLastActivity = () => {
    try {
      const value = localStorage.getItem(STORAGE_LAST_ACTIVITY)
      if (!value) {
        return Date.now()
      }

      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : Date.now()
    } catch {
      return Date.now()
    }
  }

  const clearTimer = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const performLogout = async () => {
    await logout()
    await navigateTo(ROUTE_LIST.auth.login)
  }

  const checkInactivity = async () => {
    if (!isAuthenticated.value || isHydrating.value) {
      return
    }

    const now = Date.now()
    const lastActivity = getLastActivity()
    const elapsed = now - lastActivity
    const timeoutMs = getTimeoutMs()

    if (!warningShown && elapsed >= timeoutMs - WARNING_BEFORE_MS && elapsed < timeoutMs) {
      warningShown = true
      const shouldContinue = window.confirm('Your session is about to expire due to inactivity. Stay signed in?')

      if (shouldContinue) {
        setLastActivity()
        return
      }
    }

    if (elapsed >= timeoutMs) {
      await performLogout()
    }
  }

  const start = () => {
    clearTimer()
    setLastActivity()
    timer = setInterval(() => {
      void checkInactivity()
    }, CHECK_INTERVAL_MS)
  }

  const stop = () => {
    clearTimer()
    warningShown = false
  }

  const onActivity = () => {
    if (!isAuthenticated.value || isHydrating.value) {
      return
    }

    setLastActivity()
  }

  if (import.meta.client) {
    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, onActivity, { passive: true })
    }

    watch(
      () => isAuthenticated.value,
      (loggedIn) => {
        if (loggedIn) {
          start()
          return
        }

        stop()
      },
      { immediate: true }
    )

    watch(
      () => isHydrating.value,
      (hydrating) => {
        if (hydrating) {
          stop()
        } else if (isAuthenticated.value) {
          start()
        }
      }
    )

    onNuxtReady(() => {
      if (isAuthenticated.value && !isHydrating.value) {
        start()
      }
    })
  }
})