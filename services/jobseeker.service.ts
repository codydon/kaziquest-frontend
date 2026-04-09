import { useApi, type UseApiOptions } from "~/composables/useApi";

const jobseekerService = {
  getJobseeker(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/jobseekers/${id}/`, options);
  }
}

export { jobseekerService }
