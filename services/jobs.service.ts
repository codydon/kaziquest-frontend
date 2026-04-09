import type { UseFetchOptions } from 'nuxt/app';
import { useApi } from "~/composables/useApi";
import type { UseApiOptions } from "~/composables/useApi";

export const jobService = {
  getJobs,
  getJob,
  addJob,
  editJob,
  deleteJob,
  deleteQuestion,
  deleteDocument,
  updateJobStatus,
  getJobStatistics, /* statistics for a specific job */
  batchDelete,
  indexJobGoogle,
  unindexJobGoogle,
  deleteQuestionChoice
};

export function getJobs(options: UseFetchOptions<Record<string, any>> = {}) {
  return useApi('/jobs', options);
}

function indexJobGoogle(options: UseApiOptions<Record<string, any>> = {}) {
  return useApi('/jobs/index/', {
    method: 'POST',
    ...options,
  })
}

function unindexJobGoogle(options: UseApiOptions<Record<string, any>> = {}) {
  return useApi('/jobs/index/', {
    method: 'DELETE',
    ...options,
  })
}

function batchDelete(options: UseApiOptions<Record<string, any>> = {}) {
  return useApi('/jobs/batch_delete/', {
    method: 'POST',
    ...options,
  })
}

function updateJobStatus(
  job_id: string,
  options: UseApiOptions<Record<string, any>> = {},
) {
  return useApi(`/jobs/change_job_status/${job_id}/`, {
    method: 'PATCH',
    ...options,
  })
}

function getJob(id: string, options: UseApiOptions<Record<string, any>> = {}) {
  return useApi(`/jobs/${id}/`, options);
}

function getJobStatistics(id: string, options: UseFetchOptions<Record<string, any>> = {}) {
  return useApi(`/jobs/${id}/statistics/`, options);
}

function addJob(options: UseApiOptions<Record<string, any>> = {}) {
  return useApi('/jobs/', {
    method: 'POST',
    ...options,
  });
}

function editJob(job_id: string, options: UseApiOptions<Record<string, any>> = {}) {
  return useApi(`/jobs/${job_id}/`, {
    method: 'PATCH',
    ...options,
  });
}


function deleteJob(id: string, options: UseApiOptions<Record<string, any>> = {}) {
  return useApi(`/jobs/${id}`, {
    method: 'DELETE',
    ...options,
  });
}

function deleteQuestion(id: string, options: UseApiOptions<Record<string, any>> = {}) {
  return useApi(`/jobs/questions/${id}`, {
    method: 'DELETE',
    ...options,
  });
}

function deleteQuestionChoice(
  job_slug: string,
  question_id: string,
  choice_id: string,
  options: UseApiOptions<Record<string, any>> = {},
) {
  return useApi(`/jobs/${job_slug}/questions/${question_id}/choices/${choice_id}`, {
    method: 'DELETE',
    ...options,
  });
}

function deleteDocument(id: string, options: UseApiOptions<Record<string, any>> = {}) {
  return useApi(`/jobs/job-documents/${id}/`, {
    method: 'DELETE',
    ...options,
  });
}
