export const useJobStore = () => {
  const {
    jobsState,
    setAllJobs,
    setCurrentJob,
    setTempJob,
    setJobFilters,
    setStats,
    setStatistics,
    resetJobsState
  } = useJobsState()

  const all = computed({
    get: () => jobsState.value.all,
    set: (value: Record<string, unknown> | null) => setAllJobs(value)
  })

  const currentJob = computed({
    get: () => jobsState.value.currentJob,
    set: (value: Record<string, unknown>) => setCurrentJob(value)
  })

  const tempJob = computed({
    get: () => jobsState.value.tempJob,
    set: (value: Record<string, unknown>) => setTempJob(value)
  })

  const filters = computed({
    get: () => jobsState.value.filters,
    set: (value: { status?: string; search?: string }) => setJobFilters(value)
  })

  const stats = computed({
    get: () => jobsState.value.stats,
    set: (value: Record<string, unknown> | null) => setStats(value)
  })

  const statistics = computed({
    get: () => jobsState.value.statistics,
    set: (value: Partial<typeof jobsState.value.statistics>) => setStatistics(value)
  })

  return {
    all,
    currentJob,
    tempJob,
    filters,
    stats,
    statistics,
    setAllJobs,
    setCurrentJob,
    setTempJob,
    setJobFilters,
    setStats,
    setStatistics,
    resetJobsState
  }
}
