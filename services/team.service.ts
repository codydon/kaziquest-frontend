import { useApi, type UseApiOptions } from "~/composables/useApi";

type ApiOptions = UseApiOptions<Record<string, any>>;

export const teamService = {
  addTeamMember,
  addRole,
  // getRoles,
  updateUserRole,
  removeUserFromGroup,
  getTeam,
  resendInvite,
  // addEmployee,
  // UpdateEmployeePersonalInfo,
  // updateAssets,
  // updateJobData,
  // getAssets,
  // updateEmployeeAsset,
  // deleteAsset
};

// function updateJobData(job){
//   const API_URL = useRuntimeConfig().public.apiBase;
//   return $fetch(API_URL + `/employeejobs/`, {
//     method: "POST",
//     headers: useAuthHeader(),
//     body: job,
//   });
// }
// function deleteAsset(id){
//   const API_URL = useRuntimeConfig().public.apiBase;
//   return $fetch(API_URL + `/assets/${id}/`, {
//     method: "DELETE",
//     headers: useAuthHeader(),
//   });
// }


// function updateEmployeeAsset(asset,id){
//   const {asset_category,asset_name,
//     asset_description, serial_number, 
//     date_assigned, date_returned, employee_assigned} = asset
//   const API_URL = useRuntimeConfig().public.apiBase;
//   return $fetch(API_URL + `/assets/${id}/`, {
//     method: "PUT",
//     headers: useAuthHeader(),
//     body: {
//       asset_category,asset_name,
//       asset_description, serial_number, 
//       date_assigned, date_returned, employee_assigned
//     },
//   });

// }

function getTeam() {
    return useApi(`/account/team/`, {
    handler: '$fetch',
    method: "GET",
  });
}

function addTeamMember(options: ApiOptions | Record<string, any>) {
  const normalizedOptions =
    'body' in (options as Record<string, any>) || 'handler' in (options as Record<string, any>)
      ? options as ApiOptions
      : { body: options as Record<string, any> };
  return useApi(`/add-team-member/`, {
    ...normalizedOptions,
    handler: normalizedOptions.handler ?? '$fetch',
    method: "POST",
  });
}

function addRole(options: ApiOptions | Record<string, any>) {
  const normalizedOptions =
    'body' in (options as Record<string, any>) || 'handler' in (options as Record<string, any>)
      ? options as ApiOptions
      : { body: options as Record<string, any> };
  return useApi(`/roles/`, {
    ...normalizedOptions,
    handler: normalizedOptions.handler ?? '$fetch',
    method: "POST",
  });
}

function updateUserRole(options: ApiOptions | Record<string, any>) {
  const normalizedOptions =
    'body' in (options as Record<string, any>) || 'handler' in (options as Record<string, any>)
      ? options as ApiOptions
      : { body: options as Record<string, any> };
  return useApi(`/roles/add-user-to-group/`, {
    ...normalizedOptions,
    handler: normalizedOptions.handler ?? '$fetch',
    method: "POST",
  });
}

// function getRoles() {
//   const API_URL = useRuntimeConfig().public.apiBase;
//   return $fetch(API_URL + `/company-groups/`, {
//     method: "GET",
//     headers: useAuthHeader(),
//   });
// }

function removeUserFromGroup(options: ApiOptions | Record<string, any>) {
  const normalizedOptions =
    'body' in (options as Record<string, any>) || 'handler' in (options as Record<string, any>)
      ? options as ApiOptions
      : { body: options as Record<string, any> };
  return useApi(`/accounts/team/remove-team-member/`, {
    ...normalizedOptions,
    handler: normalizedOptions.handler ?? '$fetch',
    method: "DELETE",
  });
}

function resendInvite(options: ApiOptions | string | Record<string, any>) {
  const normalizedOptions =
    typeof options === 'string'
      ? { body: options }
      : 'body' in (options as Record<string, any>) || 'handler' in (options as Record<string, any>)
        ? options as ApiOptions
        : { body: options as Record<string, any> };
  return useApi(`/accounts/team/resend-team-invite/`, {
    ...normalizedOptions,
    handler: normalizedOptions.handler ?? '$fetch',
    method: "POST",
  });
}
