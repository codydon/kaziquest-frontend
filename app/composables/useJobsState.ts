import type { JobFiltersState } from '~/types'

const JOBS_STATE_KEY = 'kq-jobs-state'

function createDefaultJobsState() {
  return {
    all: null as Record<string, unknown> | null,
    currentJob: {} as Record<string, unknown>,
    tempJob: {} as Record<string, unknown>,
    filters: {
      status: '',
      search: ''
    } as JobFiltersState,
    stats: null as Record<string, unknown> | null,
    statistics: {
      data: null as Record<string, unknown> | null,
      loading: false,
      loaded: false,
      error: null as string | null
    }
  }
}

export const useJobsState = () => {
  const jobsState = useState(JOBS_STATE_KEY, createDefaultJobsState)

  const setAllJobs = (all: Record<string, unknown> | null) => {
    jobsState.value.all = all
  }

  const setCurrentJob = (currentJob: Record<string, unknown>) => {
    jobsState.value.currentJob = currentJob
  }

  const setTempJob = (tempJob: Record<string, unknown>) => {
    jobsState.value.tempJob = tempJob
  }

  const setJobFilters = (filters: Partial<JobFiltersState>) => {
    jobsState.value.filters = {
      ...jobsState.value.filters,
      ...filters
    }
  }

  const setStats = (stats: Record<string, unknown> | null) => {
    jobsState.value.stats = stats
  }

  const setStatistics = (statistics: Partial<typeof jobsState.value.statistics>) => {
    jobsState.value.statistics = {
      ...jobsState.value.statistics,
      ...statistics
    }
  }

  const resetJobsState = () => {
    jobsState.value = createDefaultJobsState()
  }

  return {
    jobsState: readonly(jobsState),
    setAllJobs,
    setCurrentJob,
    setTempJob,
    setJobFilters,
    setStats,
    setStatistics,
    resetJobsState
  }
}