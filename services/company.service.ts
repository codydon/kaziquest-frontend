import type { UseFetchOptions } from "#app"
import { useApi } from "~/composables/useApi"
import type { UseApiOptions } from "~/composables/useApi"
import { asCollectionOptions, asResourceOptions } from "./service-options"

export const companyService = {
  getCompany,
  updateCompany,
  // fetchCompany,
  createRole,
  removeRole,
  addSMSDrivers,
  updateDrivers,
  getSMSdriver,
  getCompanyByDomain,
  setNoWorkDays,
  fetchDepartments,
  updateDepartment,
  deleteDepartment,
  createDepartment,
  createPosition,
  fetchPositions,
  // fetchPositionsByDept,
  updatePosition,
  deletePosition,
  getDocumentCategories,
  addDocumentCaterogry,
  getAssetsCategories,
  addAssetsCaterogry,
  saveCompanyMeta,
  addApprovers,
  getApprovers,
  removeApprover,
  bulkDeleteApprovers,
  getLogs,
}

// -------------------------Logs----------------------------
function getLogs(urlParams: string){
  return useApi(`/kaziquest/log-actions/${urlParams}`,{
    handler: '$fetch',
  })
}

// --------------------------approvers-----------------------------

function addApprovers(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/companies/approvers/',{
      ...asCollectionOptions(options, {
        method: 'POST',
      }),
  })
}

function removeApprover(appId: string){
  return useApi(`/companies/approvers/${appId}/`,{
      method: 'DELETE',
  })
}

function getApprovers(){
  return useApi('/companies/approvers/', {
  })
}

function bulkDeleteApprovers(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/companies/approvers/bulk-delete/', {
      ...asCollectionOptions(options, {
        method: 'POST',
      }),
  })
}

// -------------------------Asset Cateogories---------------------
function getAssetsCategories(){
  return useApi('/companies/asset-categories/', {
      handler: '$fetch',
      method: 'GET',
  })
}

function addAssetsCaterogry(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/companies/asset-categories/', {
      ...asCollectionOptions(options, {
        handler: '$fetch',
        method: 'POST',
      }),
  })
}

// -------------------------Document categories---------------------
function getDocumentCategories(){
  return useApi('/companies/document-categories/', {
      handler: '$fetch',
      method: 'GET',
  })
}

function addDocumentCaterogry(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/companies/document-categories/', {
      ...asCollectionOptions(options, {
        handler: '$fetch',
        method: 'POST',
      }),
  })
}
function createDepartment(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi('/companies/departments/', {
    ...asCollectionOptions(options, {
      method: 'POST',
    }),
  });
}

function fetchDepartments() {
  return useApi('/companies/departments/', {
    method: 'GET',
  });

}

function updateDepartment(deptId: number, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi(`/companies/departments/${deptId}/`, {
    ...asResourceOptions(options, {
      method: 'PATCH',
    }),
  });
}

function deleteDepartment(deptId: number) {
  return useApi(`/companies/departments/${deptId}/`, {
    method: 'DELETE',
  });
}

function createPosition(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi('/companies/positions/', {
    ...asCollectionOptions(options, {
      method: 'POST',
    }),
  });
}

//DEPRECATED function fetchPositionsByDept(dept_name: string) {
//   const API_URL = useRuntimeConfig().public.apiBase;
//   return $fetch(API_URL + `/companies/positions/?department=${dept_name}`, {
//     method: 'GET',
//     headers: useAuthHeader()
//   });

// }

function fetchPositions(urlParams?: Record<string, string|number>) {
  return useApi(`/companies/positions/${urlParamsExtensionUtil(urlParams ?? {})}`, {
    handler: '$fetch',
    method: 'GET',
  });

}

//update position
function updatePosition(positionId: number, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi(`/companies/positions/${positionId}/`, {
    ...asResourceOptions(options, {
      method: 'PATCH',
    }),
  });
}

//delete position
function deletePosition(positionId: number) {
  return useApi(`/companies/positions/${positionId}/`, {
    method: 'DELETE',
  });
}

function setNoWorkDays(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi('/companies/non-workdays/', {
    ...asCollectionOptions(options, {
      handler: '$fetch',
      method: 'POST',
    }),
  });
}

// TODO: refactor to use one function for one endpoint
function getCompanyByDomain(subdomain: string) {
  return useApi(`/companies?subdomain=${subdomain}`, { handler: '$fetch' })
}

function getSMSdriver(id: string | number) {
  return useApi(`/companies/sms-drivers/${id}/`, {
    handler: '$fetch',
    method: 'GET',
  });
}

function addSMSDrivers(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  const resolvedOptions = asCollectionOptions(options, {
    handler: '$fetch',
    method: 'POST',
  })
  const { username, sender_id, api_key, client_secret, provider_id } = resolvedOptions.body || {}

  return useApi('/companies/sms-drivers/', {
    ...resolvedOptions,
    body: {
      username: username,
      provider: provider_id,
      sender_id: sender_id,
      api_key: api_key,
      client_secret: client_secret,
    }
  });
}

function updateDrivers(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  const resolvedOptions = asCollectionOptions(options, {
    handler: '$fetch',
    method: 'PATCH',
  })
  const { username, sender_id, api_key, client_secret, id, provider_id } = resolvedOptions.body || {}

  return useApi(`/companies/sms-drivers/${id}/`, {
    ...resolvedOptions,
    body: {
      username: username,
      provider: provider_id,
      sender_id: sender_id,
      api_key: api_key,
      client_secret: client_secret,
    }
  });
}

function createRole(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi('/companies/add-custom-group/', {
    ...asCollectionOptions(options, {
      handler: '$fetch',
      method: 'POST',
    }),
  });
}

function removeRole(company_id: string, group_id: string) {
  return useApi('/companies/group/delete/', {
    handler: '$fetch',
    method: 'DELETE',
    body: { company_id, group_id }
  });
}

function getCompany(options?: UseFetchOptions<Record<string, any>>) {
  return useApi('/companies', options)
}

function updateCompany(company_id: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi(`/companies/${company_id}/`, {
    ...asResourceOptions(options, {
      handler: '$fetch',
      method: 'PATCH',
    }),
  });
}

// function getFormData(object) {
//   const formData = new FormData();
//   Object.keys(object).forEach(key => {
//     if (typeof object[key] !== 'object') {
//       formData.append(key, object[key])
//     }
//     //   else formData.append(key, JSON.stringify(object[key]))
//   })
//   return formData;
// }

// function formatError(data) {
//   let result = '<ul>'
//   let keys = Object.keys(data);
//   let values = Object.values(data);
//   for (let i = 0; i < values.length; i++) {
//     result += `<li><b>${keys[i]}</b>: ${values[i][0]}</li>`
//   }
//   result += '</ul>'
//   return result;
// }


function saveCompanyMeta(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi('/kaziquest/meta/', {
    ...asCollectionOptions(options, {
      method: 'POST',
    }),
  });
  }
