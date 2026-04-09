const JOBSEEKER_STATE_KEY = 'kq-jobseeker-state'

function createDefaultJobseekerState() {
  return {
    currentJobseeker: null as Record<string, unknown> | null
  }
}

export const useJobseekerState = () => {
  const jobseekerState = useState(JOBSEEKER_STATE_KEY, createDefaultJobseekerState)

  const setCurrentJobseeker = (currentJobseeker: Record<string, unknown> | null) => {
    jobseekerState.value.currentJobseeker = currentJobseeker
  }

  const resetJobseekerState = () => {
    jobseekerState.value = createDefaultJobseekerState()
  }

  return {
    jobseekerState: readonly(jobseekerState),
    setCurrentJobseeker,
    resetJobseekerState
  }
}