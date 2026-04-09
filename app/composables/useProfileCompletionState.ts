import type { ProfileCompletionTask } from '~/types'

const PROFILE_COMPLETION_STATE_KEY = 'kq-profile-completion-state'

function createDefaultProfileTasks(): ProfileCompletionTask[] {
  return [
    { name: 'Setup Account', value: 10, isCompleted: true, link: '' },
    { name: 'Upload your photo', value: 10, isCompleted: false, link: '' },
    { name: 'Personal Information', value: 5, isCompleted: false, link: 'personal' },
    { name: 'Update Job Infomation', value: 15, isCompleted: false, link: 'job' },
    { name: 'Location', value: 5, isCompleted: false, link: '' }
  ]
}

export const useProfileCompletionState = () => {
  const profileTasks = useState<ProfileCompletionTask[]>(PROFILE_COMPLETION_STATE_KEY, createDefaultProfileTasks)

  const totalValue = computed(() => {
    return profileTasks.value.reduce((sum, task) => sum + task.value, 0)
  })

  const completedValue = computed(() => {
    return profileTasks.value
      .filter((task) => task.isCompleted)
      .reduce((sum, task) => sum + task.value, 0)
  })

  const profileCompletion = computed(() => {
    return totalValue.value ? (completedValue.value / totalValue.value) * 100 : 0
  })

  const updateTaskStatus = (taskName: string, isCompleted: boolean) => {
    const task = profileTasks.value.find((item) => item.name === taskName)

    if (task) {
      task.isCompleted = isCompleted
    }
  }

  const resetProfileTasks = () => {
    profileTasks.value = createDefaultProfileTasks()
  }

  return {
    profileTasks: readonly(profileTasks),
    totalValue,
    completedValue,
    profileCompletion,
    updateTaskStatus,
    resetProfileTasks
  }
}