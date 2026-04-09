interface AuthRefreshMetrics {
  attempts: number
  successes: number
  failures: number
  retries: number
}

const defaultMetrics = (): AuthRefreshMetrics => ({
  attempts: 0,
  successes: 0,
  failures: 0,
  retries: 0
})

export const useAuthRefreshMetrics = () => {
  const metrics = useState<AuthRefreshMetrics>('kq-auth-refresh-metrics', defaultMetrics)

  const reset = () => {
    metrics.value = defaultMetrics()
  }

  return {
    metrics: readonly(metrics),
    reset
  }
}
