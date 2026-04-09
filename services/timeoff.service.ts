import type { UseFetchOptions } from "#app";
import { useApi } from "~/composables/useApi";
import type { UseApiOptions } from "~/composables/useApi";
import { asCollectionOptions, asResourceOptions } from "./service-options";

export const timeOffService = {
  applyLeave,
  deleteLeaveCategory,
  createLeaveCategory,
  getLeaveCategories,
  // getLeaveBalance,
  getLeaveEntitlement,
  getLeaveLog,
  getLeaveRequests,
  getLeaveDetail,
  updateLeaveCateories,
  getLeaves,
  approveLeave,
  rejectLeave,
  reopenLeave,
  getLeaveTimeline,
  getLeaveLogs,
  // getLeaveHistory,
  getLeaveBalances,
  getEmployeeLeaveActivity,
  updateLeaveBalances,
  updateLeaveCategory,
  changeLeaveCategoryStatus,
  addComment,
  deleteComment,
  getLeaveComents,
  getActiveLeaves,
  getCompanyCategories,
  removeEmployeesFromCategory,
  getCompanyHoliday,
  getCompanyNonWorkDays,
  updateCompanyNonWorkDays,
  addCompanyHoliday,
  updateCompanyHoliday,
  AddNonWorkignDay,
  getCustomCompanyNonWorkDays,
  updateLeave,
  calculateRequestedDays,
  getCCSettings,
  updateCCSettings,
  getLeaveYearInfo,
  getCompanyLeaveYearSettings,
  updateCompanyLeaveYearSettings,
    
}

function updateLeave(leaveId: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi(`/timeoffs/leaves/${leaveId}/`, {
    ...asResourceOptions(options, {
      handler: "$fetch",
      method: "PATCH",
    }),
  });
}

function getActiveLeaves(){
  return useApi('/timeoffs/active-leaves/', {
  })
}

function getLeaveComents(options: UseFetchOptions<Record<string, any>> = {}) {
  return useApi(`timeoffs/leave-comments`, options);
}

function getCCSettings() {
  return useApi('/timeoffs/cc-settings/', {
    method: "GET",
  });
}

function updateCCSettings(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi('/timeoffs/cc-settings/', {
    ...asCollectionOptions(options, {
      handler: "$fetch",
      method: "PATCH",
    }),
  });
}

function addComment(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/timeoffs/leave-comments/', {
    ...asCollectionOptions(options, {
      handler: "$fetch",
      method: "POST",
    }),
  })
}

function deleteComment(comment_id: string){
  return useApi(`/timeoffs/leave-comments/${comment_id}/`, {
    method: "DELETE",
  })
} 

function getLeaveBalances(options?: Record<string, any>) {
  return useApi('/timeoffs/leave-balances', {
    ...options
  })
}

function getEmployeeLeaveActivity(options?: Record<string, any>) {
  return useApi('/timeoffs/leave-balances/activity', {
    ...options,
  })
}

function updateLeaveBalances(
  leaveIdOrData: string | number,
  optionsOrLeaveId: UseApiOptions<Record<string, any>> | { available_balance: number; reason: string } | string | number = {},
  reason?: string,
){
  const isLegacyCall = typeof leaveIdOrData === 'number' && typeof optionsOrLeaveId === 'string';
  const leaveId = isLegacyCall ? optionsOrLeaveId : String(leaveIdOrData);
  const normalizedOptions =
    isLegacyCall
      ? { body: { available_balance: leaveIdOrData, reason } }
      : typeof optionsOrLeaveId === 'number'
        ? { body: { available_balance: optionsOrLeaveId, reason } }
        : 'body' in (optionsOrLeaveId as Record<string, any>) || 'handler' in (optionsOrLeaveId as Record<string, any>)
          ? optionsOrLeaveId as UseApiOptions<Record<string, any>>
          : { body: optionsOrLeaveId as Record<string, any> };
  return useApi(`/timeoffs/leave-balances/${leaveId}/`, {
    ...asResourceOptions(normalizedOptions, {
      handler: "$fetch",
      method: "PATCH",
    }),
  });
}

function getLeaveLogs(){
  return useApi('/timeoffs/leave-logs/', {
    handler: "$fetch",
    method: "GET",
  });

}

function approveLeave(id: string){
  return useApi(`/timeoffs/leaves/${id}/approve/`, {
    handler: "$fetch",
    method: "PATCH",
  });

}

function rejectLeave(id: string){
  return useApi(`/timeoffs/leaves/${id}/reject/`, {
    handler: "$fetch",
    method: "PATCH",
  });

}

function reopenLeave(id: string, reason: string){
  return useApi(`/timeoffs/leaves/${id}/reopen/`, {
    handler: "$fetch",
    method: "PATCH",
    body: { reason },
  });
}

function getLeaveTimeline(id: string){
  return useApi(`/timeoffs/leaves/${id}/timeline/`, {
    handler: "$fetch",
    method: "GET",
  });
}

function applyLeave(options: UseFetchOptions<Record<string, any>>){
  return useApi(`timeoffs/leaves/`, {
    method: "POST",
    ...options
  });
}

function getLeaves(options?: UseFetchOptions<Record<string, any>>){
  return useApi('/timeoffs/leaves', options);
}

// function getLeaveRequests(params: string) {
//   const API_URL = useRuntimeConfig().public.apiBase;
//   return $fetch(API_URL + `/timeoffs/leaves/leave-requests${params}`, {
//     headers: useAuthHeader(),
//   });
// }

function getLeaveRequests(options?: UseFetchOptions<Record<string, any>>) {
  return useApi('timeoffs/leaves/leave-requests', options);
}

function getLeaveDetail(id: string) {
  return useApi(`/timeoffs/leaves/${id}/`, {
    handler: "$fetch",
    method: "GET",
  });
}

function createLeaveCategory(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/timeoffs/leave-categories/', {
    ...asCollectionOptions(options, {
      handler: "$fetch",
      method: "POST",
    }),
  });
}

function getCompanyCategories() {
  return useApi('/timeoffs/leave-categories', {
    handler: "$fetch",
    method: "GET",
  });
}

function removeEmployeesFromCategory(id: number, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi(`/timeoffs/leave-categories/${id}/remove-employees/`, {
    ...asResourceOptions(options, {
      handler: "$fetch",
      method: "POST",
    }),
  });
}

function getCompanyNonWorkDays() {
  return useApi('/timeoffs/non-workdays', {
    method: "GET",
  });
}

function getCustomCompanyNonWorkDays(params: string) {
  return useApi(`/timeoffs/non-workdays${params}`, {
    method: "GET",
  });
}

function AddNonWorkignDay(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/timeoffs/non-workdays/', {
    ...asCollectionOptions(options, {
      handler: "$fetch",
      method: "POST",
    }),
  })
}

function updateCompanyNonWorkDays(id: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi(`/timeoffs/non-workdays/${id}/`, {
    ...asResourceOptions(options, {
      handler: "$fetch",
      method: "PATCH",
    }),
  });
}

function addCompanyHoliday(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi('/timeoffs/public-holidays/', {
    ...asCollectionOptions(options, {
      handler: "$fetch",
      method: "POST",
    }),
  });
}

function getCompanyHoliday() {
  return useApi('/timeoffs/public-holidays', {
    method: "GET",
  });
}

function updateCompanyHoliday(id: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
  return useApi(`/timeoffs/public-holidays/${id}/`, {
    ...asResourceOptions(options, {
      handler: "$fetch",
      method: "PATCH",
    }),
  });
}

function deleteLeaveCategory(categoryId: string) {
  return useApi(`/timeoffs/leave-categories/${categoryId}/`, {
    handler: "$fetch",
    method: "DELETE",
  });
}


function updateLeaveCateories(leaveId: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi(`/timeoffs/leave-categories/${leaveId}/`, {
    ...asResourceOptions(options, {
      handler: "$fetch",
      method: "PATCH",
    }),
  });
}

function getLeaveCategories(options?: UseFetchOptions<Record<string, any>>) {
  return useApi('timeoffs/leave-categories/', options);
}

function updateLeaveCategory(id: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
  return useApi(`/timeoffs/leave-categories/${id}/`, {
    ...asResourceOptions(options, {
      handler: "$fetch",
      method: "PATCH",
    }),
  })
}

function changeLeaveCategoryStatus(id: string, status: boolean){
  return useApi(`/timeoffs/leave-categories/${id}/`, {
    handler: "$fetch",
    method: "PATCH",
    body: {
      enabled: status
    },
  });
}

function getLeaveEntitlement() {
  return useApi('/timeoffs/leave-entitlements/', {
    handler: "$fetch",
    method: "GET",
  });
}

function getLeaveLog() {
  return useApi('/timeoffs/leave-log/', {
    handler: "$fetch",
    method: "GET",
  });
}

function calculateRequestedDays(options: UseFetchOptions<Record<string, any>>) {
  return useApi(`timeoffs/leaves/calculate-requested-days/`, {
    method: "POST",
    ...options
  });
}

function checkOverlappingLeaves(options: UseFetchOptions<Record<string, any>>) {
  return useApi(`timeoffs/leaves/check-overlapping/`, {
    method: "POST",
    ...options
  });
}

function getLeaveYearInfo() {
  return useApi(`timeoffs/leave-year-info/`);
}

function getCompanyLeaveYearSettings() {
  return useApi(`timeoffs/company-leave-year-settings/`);
}

function updateCompanyLeaveYearSettings(options: UseFetchOptions<Record<string, any>>) {
  return useApi(`timeoffs/company-leave-year-settings/`, {
    method: "PATCH",
    ...options
  });
}
