import { useApi } from "~/composables/useApi"

const reportsService = {
  timeToHire: function timeToHire() {
    return useApi(`/jobseekers/reports/time_to_hire/`, {
      handler: '$fetch',
      method: "GET",
    });
  },
};

export { reportsService };
