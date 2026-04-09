export const useCompleteProfileStore = () => {
  const { profileTasks, totalValue, completedValue, profileCompletion, updateTaskStatus, resetProfileTasks } = useProfileCompletionState()

  const progress = computed(() => profileCompletion.value)
  const normalUser = computed(() => profileTasks.value)

  const updateProgress = () => profileCompletion.value

  return {
    progress,
    normalUser,
    totalValue,
    completedValue,
    profileCompletion,
    updateTaskStatus,
    updateProgress,
    resetProfileTasks
  }
}
