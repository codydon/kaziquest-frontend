import type { UseFetchOptions } from "#app";
import type { IApplication } from "~/types";
import { useApi } from "~/composables/useApi";
import type { UseApiOptions } from "~/composables/useApi";
import { asCollectionOptions, asResourceOptions } from "./service-options";

export interface ApplicationStatusItem {
    id: string;
    name: string;
    description: string | null;
    color: string;
    order: number;
    hidden: boolean;
    company: string;
    created_at?: string;
    updated_at?: string;
}

export const applicationService = {
    getCompanyApplications,
    getJobApplications,
    getApplication,
    editApplication,
    applyJob,
    changeApplicationStatus,
    deleteApplication,
    addComment,
    deleteComment,
    batchStatusUpdate,
    sendmailToApplicant,
    batchMailApplicants,
    deleteMails,
    getApplicationStatuses,
    createApplicationStatus,
    updateApplicationStatus,
    deleteApplicationStatus,
};

function deleteMails(email_ids: string[]) {
    return useApi('/jobseekers/application-emails/delete_mails/', {
      handler: '$fetch',
      method: 'POST',
      body:{ email_ids:email_ids}
    })
  }

function sendmailToApplicant(
    optionsOrSubject: UseApiOptions<Record<string, any>> | { subject: string; message: string; application: string } | string = {},
    message?: string,
    application_id?: string,
) {
    const normalizedOptions =
        typeof optionsOrSubject === 'string'
            ? { body: { subject: optionsOrSubject, message, application: application_id } }
            : 'subject' in (optionsOrSubject as Record<string, any>)
                ? { body: optionsOrSubject as Record<string, any> }
                : optionsOrSubject;
    return useApi('/jobseekers/application-emails/', {
      ...asCollectionOptions(
        normalizedOptions,
        {
          handler: '$fetch',
          method: 'POST',
        },
      ),
    })
  }

function batchMailApplicants(
    optionsOrRecipients: UseApiOptions<Record<string, any>> | { recipients_data: any[]; subject: string; message: string } | any[] = {},
    subject?: string,
    message?: string,
) {
    const normalizedOptions =
        Array.isArray(optionsOrRecipients)
            ? { body: { recipients_data: optionsOrRecipients, subject, message } }
            : 'recipients_data' in (optionsOrRecipients as Record<string, any>)
                ? { body: optionsOrRecipients as Record<string, any> }
                : optionsOrRecipients;
    return useApi('/jobseekers/application-emails/batch_mails/', {
      ...asCollectionOptions(
        normalizedOptions,
        {
          handler: '$fetch',
          method: 'POST',
        },
      ),
    })
  }

function batchStatusUpdate(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/jobseekers/job-applications/batch_update/', {
        ...asCollectionOptions(options, {
            handler: '$fetch',
            method: 'PUT',
        }),
    })
}

function addComment(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/jobseekers/application-comments/', {
        ...asCollectionOptions(options, {
            handler: '$fetch',
            method: 'POST',
        }),
    })
}

function changeApplicationStatus(a_status: string, a_id: string){
    return useApi(`/jobseekers/job-applications/${a_id}/`, {
        handler: '$fetch',
        method: 'PATCH',
        body: {status:a_status}
    });
}

function deleteComment(comment_id: string){
    return useApi(`/jobseekers/application-comments/${comment_id}/`, {
        handler: '$fetch',
        method: 'DELETE',
    });
}

function deleteApplication(a_id: string){
    return useApi(`/jobseekers/job-applications/${a_id}/`, {
        handler: '$fetch',
        method: 'DELETE',
    });
}

function getApplicationStatuses(): Promise<{ custom_statuses: ApplicationStatusItem[] }> {
    return useApi('/jobseekers/application-statuses/', {
        handler: '$fetch',
    }).then((res: any) => ({ custom_statuses: res?.data?.custom_statuses ?? [] }));
}

function createApplicationStatus(options: UseApiOptions<Record<string, any>> | { name: string; description?: string; color: string; order?: number } = {}) {
    return useApi('/jobseekers/application-statuses/', {
        ...asCollectionOptions(options, {
            handler: '$fetch',
            method: 'POST',
        }),
    }).then((res: any) => res?.data);
}

function updateApplicationStatus(id: string, options: UseApiOptions<Record<string, any>> | Partial<{ name: string; description: string; color: string; order: number; hidden: boolean }> = {}) {
    return useApi(`/jobseekers/application-statuses/${id}/`, {
        ...asResourceOptions(options, {
            handler: '$fetch',
            method: 'PATCH',
        }),
    }).then((res: any) => res?.data ?? res);
}

function deleteApplicationStatus(id: string) {
    return useApi(`/jobseekers/application-statuses/${id}/`, {
        handler: '$fetch',
        method: 'DELETE',
    });
}

function getCompanyApplications(params?: string) {
    return useApi("/jobseekers/job-applications/"+params || '', {
        handler: '$fetch',
    });        
}

// function getJobApplications(job_id: string, params: string) {
//     const API_URL = useRuntimeConfig().public.apiBase;
//     return $fetch(API_URL + `/jobs/${job_id}/applications/${params}`, {
//         headers: useAuthHeader(),
//     });        
// }

function getJobApplications(job_id: string, options: UseFetchOptions<Record<string, any>>) {
    return useApi(`/jobs/${job_id}/applications`, options);
}

function getApplication(application_id?: string) {
    return useApi<IApplication>("/jobseekers/job-applications/" + application_id, {
    })
}

function applyJob(options: UseFetchOptions<Record<string, any>>) {
    return useApi("/jobseekers/apply-job/", {
        method: 'POST',
        ...options
    });
}

function editApplication(application: { id: string } & Record<string, any>) {
      return useApi("/jobseekers/job-applications/" + application.id, {
          handler: '$fetch',
          method: 'PATCH',
          body: application
      });      
}
