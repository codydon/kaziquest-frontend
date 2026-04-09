import { useApi, type UseApiOptions } from "~/composables/useApi"

const dashboardService = {
  getActivities: function(options: UseApiOptions<Record<string, any>> = {}) {
    return useApi('/dashboard/activities', options)
  },

  getStatistics: function(urlparams: string = '', options: UseApiOptions<Record<string, any>> = {}) {
    return useApi(`/dashboard/statistics/${urlparams}`, options)
  },

  getEmployeeStatistics: function(year = '', job_title = '', options: UseApiOptions<Record<string, any>> = {}) {
    const { params, ...restOptions } = options

    return useApi('/dashboard/employee-dashboard/statistics/', {
      ...restOptions,
      params: {
        year,
        job_title,
        ...((params as Record<string, any>) || {}),
      },
    })
  },

  getTurnOver: function(year = '', job_title = '', options: UseApiOptions<Record<string, any>> = {}) {
    const { params, ...restOptions } = options

    return useApi('/dashboard/turn-over/statistics/', {
      ...restOptions,
      params: {
        year,
        job_title,
        ...((params as Record<string, any>) || {}),
      },
    })
  },
}

export { dashboardService }
