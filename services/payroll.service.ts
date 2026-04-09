import type { UseFetchOptions } from "#app"
import { useApi } from "~/composables/useApi"
import type { UseApiOptions } from "~/composables/useApi"
import { asCollectionOptions, asResourceOptions } from "./service-options"

export const payrollService = {
    getEmployeePayrollHistory,
    getPaye,
    getNetPay,
    getGrossPay,
    runPayroll,
    getPayrolls,
    getPayrollDetail,
    approvePayslips,
    dissapprovePayslip,
    getPayslip,
    rerunPayroll,
    editPayroll,
    mailPayslips,
    destributePayslips,
    getEmployeePayslips,
    generateP9,
    generateP10,
    generatePayslipPdf,
    fetchPayslips,
    createMassDeduction,
    getMassDeductions,
    getMassDeduction,
    updateMassDeduction,
    deleteMassDeduction,
    deactivateMassDeduction,
    activateMassDeduction,
    getAffectedEmployees,
    getPayrollRoster,
    getPayrollCoverage,
    getPayrollRerunInfo,
    getPayrollProgress
}

function getPayrollRoster(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}) {
    const resolvedOptions = asCollectionOptions(options, {
        method: 'POST',
    })

    return useApi('/payroll/roster/', {
        ...resolvedOptions,
    })
}

function generatePayslipPdf(payslipId: string){
    return useApi('/payroll/payslips/generate-payslip-pdf/',{
        handler: '$fetch',
        method: 'POST',
        body: {payslip_id: payslipId},
        responseType: 'blob'
    })
}

function generateP10(options: UseApiOptions<Record<string, any>> | string[] = []) {
    return useApi('/payroll/p10-details/',{
        ...asCollectionOptions(
            Array.isArray(options) ? { payslip_ids: options } : options,
            {
                handler: '$fetch',
                method: 'POST',
            },
        ),
    })
}

function generateP9(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/payroll/p9-forms/',{
        ...asCollectionOptions(options, {
            handler: '$fetch',
            method: 'POST',
        }),
    })
}

function getPayrollCoverage(options: UseFetchOptions<Record<string, any>>) {
    return useApi('payroll/coverage/', {
        method: 'POST',
        ...options
    })
}

function getPayrollRerunInfo(payrollId: string, options?: UseFetchOptions<Record<string, any>>) {
    return useApi(`payroll/${payrollId}/rerun-info/`, options)
}

function getPayrollProgress(payrollId: string, options?: UseFetchOptions<Record<string, any>>) {
    return useApi(`payroll/${payrollId}/progress/`, options)
}

function destributePayslips(id: string){
    return useApi(`/payroll/${id}/`,{
        method: 'PATCH',
        body: {
            shared: true
        }
    })
}

function getEmployeePayslips(id?: string){
    return useApi(`/payroll/payslips/?employee_id=${id}`,{
    })
}

function editPayroll(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/payroll/edit-payslip/',{
        ...asCollectionOptions(options, {
            method: 'POST',
        }),
    })
}

function rerunPayroll(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/payroll/re-run/',{
        ...asCollectionOptions(options, {
            method: 'POST',
        }),
    })
}

function getPayslip(id: string){
    return useApi(`/payroll/payslips/${id}/`,{
        handler: '$fetch',
        method: 'GET',
    })
}

function approvePayslips(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/payroll/approve-payslips/',{
        ...asCollectionOptions(options, {
            method: 'POST',
        }),
    })
}

function dissapprovePayslip(options: UseApiOptions<Record<string, any>> | string[] = []){
    return useApi('/payroll/disapprove-payslips/',{
        ...asCollectionOptions(
            Array.isArray(options)
                ? { payslips_and_approvers_ids: options }
                : options,
            {
                method: 'POST',
            },
        ),
    })
}

function getPayrolls (options?: UseFetchOptions<Record<string, any>>){
    return useApi('payroll', options);
}

function getPayrollDetail (id: string, options?: UseFetchOptions<Record<string, any>>){
    return useApi(`payroll/${id}/`, options);
}

function fetchPayslips (options?: UseFetchOptions<Record<string, any>>){
    return useApi(`payroll/payslips`, options);
}

function getEmployeePayrollHistory(id: string){
    return useApi(`/payroll/payslips/employee?id=${id}`,{
        handler: '$fetch',
        method: 'GET',
    })
}

function getPaye(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/payroll/paye-calculator/', {
        ...asCollectionOptions(options, {
            handler: '$fetch',
            method: 'POST',
        }),
    })
}

function getNetPay(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/payroll/netpay-calculator/', {
        ...asCollectionOptions(options, {
            handler: '$fetch',
            method: 'POST',
        }),
    })
}

function getGrossPay(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/payroll/grosspay-calculator/',{
        ...asCollectionOptions(options, {
            handler: '$fetch',
            method: 'POST',
        }),
    })
}

function runPayroll(options: UseFetchOptions<Record<string, any>>){
    return useApi('payroll/run-payroll/',{
        method: 'POST',
        ...options
    })
}

function mailPayslips(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/payroll/mail-payslips/',{
        ...asCollectionOptions(options, {
            method: 'POST',
        }),
    })
}

function createMassDeduction(options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi('/employees/deductions/mass-create/',{
        ...asCollectionOptions(options, {
            handler: '$fetch',
            method: 'POST',
        }),
    })
}

function getMassDeductions(params?: Record<string, any>){
    return useApi('/employees/mass-deductions/',{
        query: params
    })
}

function getMassDeduction(id: string){
    return useApi(`/employees/mass-deductions/${id}/`,{
    })
}

function updateMassDeduction(id: string, options: UseApiOptions<Record<string, any>> | Record<string, any> = {}){
    return useApi(`/employees/mass-deductions/${id}/`,{
        ...asResourceOptions(options, {
            method: 'PATCH',
        }),
    })
}

function deleteMassDeduction(id: string){
    return useApi(`/employees/mass-deductions/${id}/`,{
        method: 'DELETE',
    })
}

function deactivateMassDeduction(id: string){
    return useApi(`/employees/mass-deductions/${id}/deactivate/`,{
        method: 'POST',
    })
}

function activateMassDeduction(id: string){
    return useApi(`/employees/mass-deductions/${id}/activate/`,{
        method: 'POST',
    })
}

function getAffectedEmployees(id: string){
    return useApi(`/employees/mass-deductions/${id}/affected-employees/`,{
    })
}
