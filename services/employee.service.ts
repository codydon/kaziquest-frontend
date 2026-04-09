import { useApi } from "~/composables/useApi"
import type { UseApiOptions } from "~/composables/useApi"

export const employeeService = {
    getEmployees,
    getEmployee,
    getEmployeeRaw,
    createEmployee,
    updateEmployee,
    upload,
    resendActivationEmail,
    enableDisableAccess,
    streamFile,
    getEmployeePaymentMethods,
    addEmployeePaymentMethod,
    updateEmployeePaymentMethod,
    deleteEmployeePaymentMethod,
    getEmployeeJobs,
    addEmployeeJob,
    updateJob,
    deleteJob,
    getPayInfo,
    addPayInfo,
    updatePayInfo,
    deleteCompensation,
    getCompensationForEmployee,
    addCompensations,
    updateCompensation,
    getEmployeeExtraPay,
    addEmployeeExtraPayRequest,
    updateEmployeeExtraPayRequest,
    deleteEmployeeExtraPay,
    getDeductionForEmployee,
    getDeductionById,
    addEmployeeDeductions,
    updateEmployeeDeductions,
    deleteDeductionForEmployee,
    softDeleteDeduction,
    getEducationForEmployee,
    getEmployeesEducation,
    getEmployeesEducationById,
    addEducation,
    addEmployeeEducation,
    updateEducation,
    updateEducationForEmployee,
    deleteEducation,
    deleteEducationForEmployee,
    getContacts,
    addContacts,
    getAddresses,
    addAddress,
    getAddressesForEmployee,
    updateAddressForEmployee,
    deleteAddress,
    getSocials,
    addSocials,
    getSocialsForEmployee,
    updateSocialsForEmployee,
    deleteSocial,
    fetchEmployeeAssets,
    addEmployeeAsset,
    updateEmployeeAsset,
    deleteEmployeeAsset,
    getEmployeeDocuments,
    addEmployeeDocument,
    updateEmployeeDocument,
    deleteEmployeeDocument,
    getEmployeeNextOfKin,
    addEmployeeNextOfKin,
    updateEmployeeNextOfKin,
    deleteEmployeeNextOfKin,
    getEmployeeDisciplinary,
    getOneDisciplinary,
    getDisciplinaryActions,
    registerDisciplinary,
    addDisciplinaryAction,
    updateDisciplinary,
    changeStatus,
    deleteDisciplinary,
    processEmployeeExit,
    previewEmployeeExit,
    getEmployeeExitInfo,
    updateEmployeeExitInfo,
}

// ------------------ core employee ------------------
function getEmployees(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees', options);
}

function getEmployee(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/${id}`, options);
}

async function getEmployeeRaw(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return await useApi(`/employees/${id}`, options);
}

function createEmployee(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/',{
        method: 'POST',
        ...options,
    });
}

function updateEmployee(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/${id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function upload(options: UseApiOptions<Record<string, any>> = {}) {
    return useApi('/employees/upload/', {
        method: 'POST',
        ...options,
    });
}

// ------------------ access and utility ------------------
function resendActivationEmail(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/resend_activation_email/', {
        method: 'POST',
        ...options,
    })
}

function enableDisableAccess(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/enable-disable-access/', {
        method: 'POST',
        ...options,
    })
}

function streamFile(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/kaziquest/stream-file', {
        method: 'POST',
        ...options,
    })
}

// ------------------ payment methods ------------------
function getEmployeePaymentMethods(employee_id: string, options: UseApiOptions<Record<string, any>> = {}){
    const { params, ...restOptions } = options

    return useApi('/employees/payment-accounts/', {
        ...restOptions,
        params: {
            employee_id,
            ...((params as Record<string, any>) || {}),
        },
    })
}

function addEmployeePaymentMethod(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/payment-accounts/',{
        method: 'POST',
        ...options,
    })
}

function updateEmployeePaymentMethod(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/payment-accounts/${id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function deleteEmployeePaymentMethod(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/payment-accounts/${id}/`, {
        method: 'DELETE',
        ...options,
    })
}

// ------------------ employee jobs ------------------
function getEmployeeJobs(urlParams: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/jobs${urlParams}`, options)
}

function addEmployeeJob(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/jobs/', {
        method: 'POST',
        ...options,
    })
}

function updateJob(id: string, options: UseApiOptions<Record<string, any>> = {},){
    return useApi(`/employees/jobs/${id}/`, {
        method: "PATCH",
        ...options,
    });
}

function deleteJob(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/jobs/${id}/`, {
        method: "DELETE",
        ...options,
    });
}

// ------------------ pay info and compensation ------------------
function getPayInfo(urlParams: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/pay-info/${urlParams}`, options)
}

function addPayInfo(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/pay-info/', {
        method: 'POST',
        ...options,
    })
}

function updatePayInfo(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/pay-info/${id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function deleteCompensation(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/pay-info/${id}/`, {
        method: 'DELETE',
        ...options,
    })
}

function getCompensationForEmployee(id:string, options: UseApiOptions<Record<string, any>> = {}){
    const { params, ...restOptions } = options

    return useApi('/employees/compensations', {
        ...restOptions,
        params: {
            employee_id: id,
            ...((params as Record<string, any>) || {}),
        },
    })
}

function addCompensations(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/compensations/', {
        method: 'POST',
        ...options,
    })
}

function updateCompensation(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/compensations/${id}/`, {
        method: "PATCH",
        ...options,
    });
}

// ------------------ extra pay ------------------
function getEmployeeExtraPay(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/extra-payments', options)
}

function addEmployeeExtraPayRequest(options: UseApiOptions<Record<string, any>> = {}) {
    return useApi('/employees/extra-payments/', {
        method: 'POST',
        ...options,
    })
}

function updateEmployeeExtraPayRequest(id: string, options: UseApiOptions<Record<string, any>> = {}) {
    return useApi(`/employees/extra-payments/${id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function deleteEmployeeExtraPay(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`employees/extra-payments/${id}/`, {
        method: 'DELETE',
        ...options,
    })
}

// ------------------ deductions ------------------
function getDeductionForEmployee(employeeId: string, options: UseApiOptions<Record<string, any>> = {}) {
    const { params, ...restOptions } = options

    return useApi('/employees/deductions/', {
        ...restOptions,
        params: {
            employee_id: employeeId,
            ...((params as Record<string, any>) || {}),
        },
    })
}

function getDeductionById(id: string, options: UseApiOptions<Record<string, any>> = {}) {
    return useApi(`/employees/deductions/${id}/`, options)
}

function addEmployeeDeductions(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/deductions/',{
        method: 'POST',
        ...options,
    })
}

function updateEmployeeDeductions(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/deductions/${id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function deleteDeductionForEmployee(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/deductions/${id}/`, {
        method: 'DELETE',
        ...options,
    })
}

function softDeleteDeduction(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/deductions/${id}/soft-delete/`, {
        method: 'POST',
        ...options,
    })
}

// ------------------ education ------------------
function getEducationForEmployee(id: string, options: UseApiOptions<Record<string, any>> = {}){
    const { params, ...restOptions } = options

    return useApi('/employees/educations', {
        ...restOptions,
        params: {
            employee_id: id,
            ...((params as Record<string, any>) || {}),
        },
    })
}

function getEmployeesEducation(_employee_id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/educations/', options)
}

function getEmployeesEducationById(employee_id: string, options: UseApiOptions<Record<string, any>> = {}){
    const { params, ...restOptions } = options

    return useApi('/employees/educations/', {
        ...restOptions,
        params: {
            employee_id,
            ...((params as Record<string, any>) || {}),
        },
    })
}

function addEducation(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/educations/',{
        method: 'POST',
        ...options,
    })
}

function addEmployeeEducation(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/educations/',{
        method: 'POST',
        ...options,
    });
}

function updateEducation(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/educations/${id}/`, {
        method: "PATCH",
        ...options,
    });
}

function updateEducationForEmployee(education_id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/educations/${education_id}/`,{
        method: 'PATCH',
        ...options,
    });
}

function deleteEducation(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/educations/${id}/`, {
        method: "DELETE",
        ...options,
    });
}

function deleteEducationForEmployee(education_id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/educations/${education_id}/`,{
        method: 'DELETE',
        ...options,
    });
}

// ------------------ contacts, addresses, socials ------------------
function getContacts(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/contacts/', options)
}

function addContacts(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/contacts/', {
        method: 'POST',
        ...options,
    })
}

function getAddresses(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/addresses/', options)
}

function addAddress(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/addresses/', {
        method: 'POST',
        ...options,
    })
}

function getAddressesForEmployee(employee_id: string, options: UseApiOptions<Record<string, any>> = {}){
    const { params, ...restOptions } = options

    return useApi('/employees/addresses/', {
        ...restOptions,
        params: {
            employee_id,
            ...((params as Record<string, any>) || {}),
        },
    })
}

function updateAddressForEmployee(address_id: number, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/addresses/${address_id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function deleteAddress(address_id: number, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/addresses/${address_id}/`, {
        method: 'DELETE',
        ...options,
    })
}

function getSocials(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/social_media/', options)
}

function addSocials(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/social_media/', {
        method: 'POST',
        ...options,
    })
}

function getSocialsForEmployee(employee_id: string, options: UseApiOptions<Record<string, any>> = {}){
    const { params, ...restOptions } = options

    return useApi('/employees/social_media/', {
        ...restOptions,
        params: {
            employee_id,
            ...((params as Record<string, any>) || {}),
        },
    })
}

function updateSocialsForEmployee(social_id: number, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/social_media/${social_id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function deleteSocial(social_id: number, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/social_media/${social_id}/`, {
        method: 'DELETE',
        ...options,
    })
}

// ------------------ assets ------------------
function fetchEmployeeAssets(urlParams: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/assets${urlParams}`, options)
}

function addEmployeeAsset(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/assets/', {
        method: 'POST',
        ...options,
    })
}

function updateEmployeeAsset(asset_id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/assets/${asset_id}/`, {
        method: "PATCH",
        ...options,
    });
}

function deleteEmployeeAsset(asset_id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/assets/${asset_id}/`, {
        method: "DELETE",
        ...options,
    });
}

// ------------------ documents ------------------
function getEmployeeDocuments(id: string, options: UseApiOptions<Record<string, any>> = {}){
    const { params, ...restOptions } = options

    return useApi('/employees/documents', {
        ...restOptions,
        params: {
            employee_id: id,
            ...((params as Record<string, any>) || {}),
        },
    })
}

function addEmployeeDocument(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/documents/', {
        method: 'POST',
        ...options,
    })
}

function updateEmployeeDocument(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/documents/${id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function deleteEmployeeDocument(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/documents/${id}/`, {
        method: 'DELETE',
        ...options,
    })
}

// ------------------ next of kin ------------------
function getEmployeeNextOfKin(id: string, options: UseApiOptions<Record<string, any>> = {}){
    const { params, ...restOptions } = options

    return useApi('/employees/next-of-kins', {
        ...restOptions,
        params: {
            employee_id: id,
            ...((params as Record<string, any>) || {}),
        },
    })
}

function addEmployeeNextOfKin(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/next-of-kins/', {
        method: 'POST',
        ...options,
    })
}

function updateEmployeeNextOfKin(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/next-of-kins/${id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function deleteEmployeeNextOfKin(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/next-of-kins/${id}/`, {
        method: 'DELETE',
        ...options,
    })
}

// ------------------ disciplinary ------------------
function getEmployeeDisciplinary(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/disciplinary-cases', options)
}

function getOneDisciplinary(urlParams: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/disciplinary-cases/${urlParams}`, options)
}

function getDisciplinaryActions(urlParams: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/disciplinary-case-actions/${urlParams}`, options)
}

function registerDisciplinary(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/disciplinary-cases/', {
        method: 'POST',
        ...options,
    })
}

function addDisciplinaryAction(options: UseApiOptions<Record<string, any>> = {}){
    return useApi('/employees/disciplinary-case-actions/', {
        method: 'POST',
        ...options,
    })
}

function updateDisciplinary(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/disciplinary-cases/${id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function changeStatus(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/disciplinary-cases/${id}/`, {
        method: 'PATCH',
        ...options,
    })
}

function deleteDisciplinary(id: string, options: UseApiOptions<Record<string, any>> = {}){
    return useApi(`/employees/disciplinary-cases/${id}/`, {
        method: 'DELETE',
        ...options,
    })
}

// ------------------ exit flow ------------------
function processEmployeeExit(employeeId: string, options: UseApiOptions<Record<string, any>> = {}) {
    return useApi(`/employees/${employeeId}/exit/`, {
        method: 'POST',
        ...options,
    });
}

async function previewEmployeeExit(employeeId: string, options: UseApiOptions<Record<string, any>> = {}) {
    return await useApi(`/employees/${employeeId}/exit/?preview=true`, {
        method: 'POST',
        ...options,
        body: {
            ...((options.body as Record<string, any>) || {}),
            preview: true,
        },
    });
}

async function getEmployeeExitInfo(employeeId: string, options: UseApiOptions<Record<string, any>> = {}) {
    return await useApi(`/employees/${employeeId}/exit_info/`, options);
}

async function updateEmployeeExitInfo(employeeId: string, options: UseApiOptions<Record<string, any>> = {}) {
    return await useApi(`/employees/${employeeId}/exit_info/`, {
        method: 'PATCH',
        ...options,
    });
}
