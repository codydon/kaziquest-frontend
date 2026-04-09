import type { ApplicationFormState, ApplicationStatusItem } from '~/types'

const APPLICATIONS_STATE_KEY = 'kq-applications-state'

function createDefaultApplicationFormState(): ApplicationFormState {
  return {
    job: '',
    status: '',
    name: '',
    salutation: '',
    yob: '',
    gender: '',
    phone: '',
    email: '',
    linkedin_url: '',
    seen: '',
    cover_letter: '',
    cv: ''
  }
}

function createDefaultApplicationsState() {
  return {
    all: null as Record<string, unknown> | null,
    currentApplication: null as Record<string, unknown> | null,
    applicationStatuses: [] as ApplicationStatusItem[],
    newApplication: createDefaultApplicationFormState()
  }
}

export const useApplicationsState = () => {
  const applicationsState = useState(APPLICATIONS_STATE_KEY, createDefaultApplicationsState)

  const applicantStagesForDropdown = computed(() => {
    return applicationsState.value.applicationStatuses.filter((status) => !status.hidden)
  })

  const getApplicantStageByName = (name: string) => {
    return applicationsState.value.applicationStatuses.find((status) => status.name === name)
  }

  const setAllApplications = (all: Record<string, unknown> | null) => {
    applicationsState.value.all = all
  }

  const setCurrentApplication = (currentApplication: Record<string, unknown> | null) => {
    applicationsState.value.currentApplication = currentApplication
  }

  const setApplicationStatuses = (applicationStatuses: ApplicationStatusItem[]) => {
    applicationsState.value.applicationStatuses = applicationStatuses
  }

  const setNewApplication = (newApplication: ApplicationFormState) => {
    applicationsState.value.newApplication = newApplication
  }

  const resetNewApplication = () => {
    applicationsState.value.newApplication = createDefaultApplicationFormState()
  }

  return {
    applicationsState: readonly(applicationsState),
    applicantStagesForDropdown,
    getApplicantStageByName,
    setAllApplications,
    setCurrentApplication,
    setApplicationStatuses,
    setNewApplication,
    resetNewApplication
  }
}