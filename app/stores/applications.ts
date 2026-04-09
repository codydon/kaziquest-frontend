export const useApplicationsStore = () => {
  const {
    applicationsState,
    applicantStagesForDropdown,
    getApplicantStageByName,
    setAllApplications,
    setCurrentApplication,
    setApplicationStatuses,
    setNewApplication,
    resetNewApplication
  } = useApplicationsState()

  const all = computed({
    get: () => applicationsState.value.all,
    set: (value: Record<string, unknown> | null) => setAllApplications(value)
  })

  const currentApplication = computed({
    get: () => applicationsState.value.currentApplication,
    set: (value: Record<string, unknown> | null) => setCurrentApplication(value)
  })

  const applicationStatuses = computed({
    get: () => applicationsState.value.applicationStatuses,
    set: (value: any[]) => setApplicationStatuses(value as any)
  })

  const newApplication = computed({
    get: () => applicationsState.value.newApplication,
    set: (value: any) => setNewApplication(value)
  })

  const applicantStageByName = () => (name: string) => getApplicantStageByName(name)

  const deleteMails = async (emailIds: string[]) => await useApi('/jobseekers/application-emails/delete_mails/', {
    handler: '$fetch',
    method: 'POST',
    body: { email_ids: emailIds }
  })

  const sendmailToApplicant = async (subject: string, message: string, application: string) => {
    return await useApi('/jobseekers/application-emails/', {
      handler: '$fetch',
      method: 'POST',
      body: { subject, message, application }
    })
  }

  const batchMailApplicants = async (recipientsData: any[], subject: string, message: string) => {
    return await useApi('/jobseekers/application-emails/batch_mails/', {
      handler: '$fetch',
      method: 'POST',
      body: { recipients_data: recipientsData, subject, message }
    })
  }

  const batchStatusUpdate = async (body: Record<string, unknown>) => {
    return await useApi('/jobseekers/job-applications/batch_update/', {
      handler: '$fetch',
      method: 'PUT',
      body
    })
  }

  const addComment = async (comment: string, applicationId: string) => {
    const { session } = useAuthSession()
    const userId = (session.value.user as any)?.id

    if (!userId) {
      throw new Error('User ID is undefined')
    }

    return await useApi('/jobseekers/application-comments/', {
      handler: '$fetch',
      method: 'POST',
      body: {
        comment,
        application: applicationId,
        user: userId
      }
    })
  }

  const deleteComment = async (commentId: string) => await useApi(`/jobseekers/application-comments/${commentId}/`, {
    handler: '$fetch',
    method: 'DELETE'
  })

  const changeApplicationStatus = async (status: string, applicationId: string) => {
    return await useApi(`/jobseekers/job-applications/${applicationId}/`, {
      handler: '$fetch',
      method: 'PATCH',
      body: { status }
    })
  }

  const deleteApplication = async (applicationId: string) => await useApi(`/jobseekers/job-applications/${applicationId}/`, {
    handler: '$fetch',
    method: 'DELETE'
  })

  const rateAnswer = async (question: Record<string, unknown>) => {
    return await useApi(`/jobs/answers/${String((question as any)?.id || '')}/`, {
      handler: '$fetch',
      method: 'PATCH',
      body: { rating: (question as any)?.rating }
    })
  }

  const rateDocument = async (data: Record<string, unknown>) => {
    return await useApi(`/jobs/job-documents-answers/${String((data as any)?.id || '')}/`, {
      handler: '$fetch',
      method: 'PATCH',
      body: {
        name: (data as any)?.name,
        rating: (data as any)?.rating
      }
    })
  }

  const rateScore = async (data: Record<string, unknown>) => {
    return await useApi(`/jobseekers/job-applications/${String((data as any)?.id || '')}/`, {
      handler: '$fetch',
      method: 'PATCH',
      body: { score: (data as any)?.score }
    })
  }

  const getApplication = async (slug?: string) => {
    try {
      return await useApi(`/jobseekers/job-applications/${slug || ''}`, {
        handler: '$fetch',
        method: 'GET'
      })
    } catch {
      return null
    }
  }

  const editApplication = async (application: { id: string } & Record<string, unknown>) => {
    try {
      await useApi(`/jobseekers/job-applications/${application.id}`, {
        handler: '$fetch',
        method: 'PATCH',
        body: application
      })
      await navigateTo('/job-postings')
    } catch {
      return null
    }
  }

  const fetchApplicationStatuses = async () => {
    try {
      const data = await useApi('/jobseekers/application-statuses/', {
        handler: '$fetch',
        method: 'GET'
      }) as Record<string, any>
      applicationStatuses.value = (data?.custom_statuses || data?.data?.custom_statuses || []) as any[]
      return applicationStatuses.value
    } catch {
      applicationStatuses.value = []
      return []
    }
  }

  const createApplicationStatus = async (body: { name: string; description?: string; color: string; order?: number }) => {
    const created = await useApi('/jobseekers/application-statuses/', {
      handler: '$fetch',
      method: 'POST',
      body
    })
    await fetchApplicationStatuses()
    return created
  }

  const updateApplicationStatus = async (id: string, body: Partial<{ name: string; description: string; color: string; order: number; hidden: boolean }>) => {
    const updated = await useApi(`/jobseekers/application-statuses/${id}/`, {
      handler: '$fetch',
      method: 'PATCH',
      body
    })
    await fetchApplicationStatuses()
    return updated
  }

  const deleteApplicationStatus = async (id: string) => {
    await useApi(`/jobseekers/application-statuses/${id}/`, {
      handler: '$fetch',
      method: 'DELETE'
    })
    await fetchApplicationStatuses()
  }

  return {
    all,
    currentApplication,
    applicationStatuses,
    newApplication,
    applicantStagesForDropdown,
    applicantStageByName,
    setAllApplications,
    setCurrentApplication,
    setApplicationStatuses,
    setNewApplication,
    resetNewApplication,
    deleteMails,
    sendmailToApplicant,
    batchMailApplicants,
    batchStatusUpdate,
    addComment,
    deleteComment,
    changeApplicationStatus,
    deleteApplication,
    rateAnswer,
    rateDocument,
    rateScore,
    getApplication,
    editApplication,
    fetchApplicationStatuses,
    createApplicationStatus,
    updateApplicationStatus,
    deleteApplicationStatus
  }
}
