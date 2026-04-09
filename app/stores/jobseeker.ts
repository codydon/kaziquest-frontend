export const useJobSeekerStore = () => {
  const { jobseekerState, setCurrentJobseeker, resetJobseekerState } = useJobseekerState()

  const current_jobseeker = computed({
    get: () => jobseekerState.value.currentJobseeker,
    set: (value: Record<string, unknown> | null) => setCurrentJobseeker(value)
  })

  return {
    current_jobseeker,
    setCurrentJobseeker,
    resetJobseekerState
  }
}
