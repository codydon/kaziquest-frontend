<script setup lang="ts">
import type { IPayslip } from '~/types/payslip'
import { payrollService } from '~~/services/payroll.service'
import { dataExport, exportP10Data, exportP10DataForAHL } from '~/utils/payrollExport'
import formatNumbers from '~/utils/formatNumbers'

definePageMeta({
  layout: 'default',
})

const { formartToLongDayMonthDate } = usePayrollDates()
const { session } = useAuthSession()
const currentUserId = computed(() => String((session.value.user as { id?: string | number } | undefined)?.id ?? ''))
const router = useRouter()
const toast = useToast()
const route = useRoute()

const approving = ref(false)

const pageSizeValues = [10, 30, 50, 100, 200] as const
type PageSize = (typeof pageSizeValues)[number]

interface PayslipListQuery {
    payroll_id: string
    page_size: PageSize
    search: string
    page: number
    department: string
    status: string
}

const urlParams = reactive<PayslipListQuery>({
    payroll_id: String(route.params.id),
    page_size: pageSizeValues[0],
    search: "",
    page: 1,
    department: '',
    status: ''
})

const { data: payrollRes, status, refresh: getPayroll }: Record<string, any> = await payrollService.getPayrollDetail(String(route.params.id));
const loadingPayroll = computed(() => status.value === 'pending');
const payrollData = computed(() => {
    return payrollRes.value?.data || null
})

const { data: payslipsRes, status: fetchPayslipsStatus, refresh: fetchPayslips }: Record<string, any> = payrollService.fetchPayslips({
    query: urlParams,
    immediate: false
})
const loadingPayslips = computed(() => fetchPayslipsStatus.value === 'pending');

const pageSizeOptions = pageSizeValues

const resetToFirstPage = () => {
    urlParams.page = 1
}

watch(
    [() => urlParams.page_size, () => urlParams.search, () => urlParams.department, () => urlParams.status],
    resetToFirstPage,
    { immediate: true }
)

let timeout: ReturnType<typeof setTimeout> | undefined;
watch(urlParams, () => {
    if (isProcessing.value) return
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        fetchPayslips();
    }, 500);
});

const handlePageChange = (page: number) => {
    urlParams.page = page
}

// Async progress polling state
const progress = ref<{ progress_percentage: number; completed_payslips: number; total_payslips: number; status: string; error_message: string | null; is_complete: boolean } | null>(null)
const isPolling = ref(false)
let pollTimer: any = null

// Centralized processing state
const isProcessing = computed(() => 
    isPolling.value || 
    payrollData.value?.status === 'processing' ||
    loadingPayroll.value
)

const startPolling = () => {
    if (isPolling.value || progress.value?.is_complete) return
    isPolling.value = true
    const poll = async () => {
        try {
            const { data, error, status }: any = await payrollService.getPayrollProgress(String(route.params.id))
            
            if (error?.value) {
                isPolling.value = false
                clearInterval(pollTimer)
                toast.add({ 
                    icon: 'i-heroicons-exclamation-triangle', 
                    title: 'Connection error', 
                    description: 'Unable to check payroll progress. Please refresh manually.', 
                    color: 'error' 
                })
                return
            }
            
            const payload = data?.value?.data || data?.value
            if (payload) {
                progress.value = payload
                if (progress.value?.error_message) {
                    isPolling.value = false
                    clearInterval(pollTimer)
                    toast.add({ icon: 'i-heroicons-exclamation-triangle', title: 'Payroll error', description: progress.value.error_message, color: 'error' })
                    return
                }
                if (progress.value?.is_complete) {
                    isPolling.value = false
                    clearInterval(pollTimer)
                    await getPayroll()
                    await fetchPayslips()
                    toast.add({ icon: 'i-heroicons-check-circle', title: 'Payroll processed', color: 'success' })
                    return
                }
            }
        } catch (err) {
            isPolling.value = false
            clearInterval(pollTimer)
            toast.add({ 
                icon: 'i-heroicons-exclamation-triangle', 
                title: 'Polling stopped', 
                description: 'An error occurred while checking progress.', 
                color: 'error' 
            })
        }
    }
    // initial call and interval
    poll()
    pollTimer = setInterval(poll, 15000)
}

const getBasicPay = (payslip: IPayslip) => {
    const monthlyBasic = (payslip as any)?.prorata_details?.basic_salary
    if (monthlyBasic !== undefined && monthlyBasic !== null) return Number(monthlyBasic)
    return Number((payslip?.payslip_items || []).find(item => item.name === "Basic Pay")?.amount || 0)
}

const getTaxablePay = (payslip: IPayslip) => {
    return Number((payslip?.payslip_items || []).find(item => item.name === "Taxable Pay")?.amount || 0);
}

const getShif = (payslip: IPayslip) => {
    return Number((payslip?.payslip_items || []).find(item => item.name === "SHIF")?.amount || 0);
}
const getNssf = (payslip: IPayslip) => {
    const nssf_tier_1 = Number((payslip?.payslip_items || []).find(item => item.name === "NSSF Tier I")?.amount || 0);
    const nssf_tier_2 = Number((payslip?.payslip_items || []).find(item => item.name === "NSSF Tier II")?.amount || 0);
    return nssf_tier_1 + nssf_tier_2;
}

const getAhl = (payslip: IPayslip) => {
    return Number((payslip?.payslip_items || []).find(item => item.name === "AHL")?.amount || 0);
}

const getNita = (payslip: IPayslip) => {
    return Number((payslip?.payslip_items || []).find(item => item.name === "NITA Levy")?.amount || 0);
}

const getPersonalRelief = (payslip: IPayslip) => {
    return Number((payslip?.payslip_items || []).find(item => item.name === "Personal Relief")?.amount || 0);
}

const getInsuranceRelief = (payslip: IPayslip) => {
    return Number((payslip?.payslip_items || []).find(item => item.name === "Insurance Relief")?.amount || 0);
}

const getPaye = (payslip: IPayslip) => {
    return Number((payslip?.payslip_items || []).find(item => item.name === "PAYE")?.amount || 0);
}

const getHelb = (payslip: IPayslip) => {
    // Search case-insensitively for HELB deduction
    const helbItem = (payslip?.payslip_items || []).find(
        (item: any) => {
            const nameMatch = item.name && item.name.toLowerCase() === 'helb';
            const typeMatch = item.other_type && item.other_type.toLowerCase() === 'helb';
            return nameMatch || typeMatch;
        }
    );
    return Number(helbItem?.amount || 0);
}

const getGrossPay = (payslip: IPayslip) => {
    return Number(payslip?.gross_pay || 0);
}

const getNetPay = (payslip: IPayslip) => {
    return Number(payslip?.net_pay || 0);
}

/** UTable may pass either a TanStack `Row` (`original`) or a raw payslip row (legacy). */
function slipRow(row: IPayslip | { original: IPayslip }): IPayslip {
  return (row as { original?: IPayslip }).original ?? (row as IPayslip)
}

/** Nuxt UI table passes TanStack `Row` with `index`; legacy rows have no `index`. */
function tableRowIndex(row: unknown): number {
  const r = row as { index?: number }
  return typeof r.index === 'number' ? r.index : 0
}


const spreadsheetColumns = [
    { key: "select", value: "select" },
    { key: "count", value: "count" },
    { key: "full_name", label: "Employee Name" },
    { key: "basic_pay", label: "Basic Salary" },
    { key: "gross_pay", label: "Gross Pay" },
    { key: "taxable_pay", label: "Taxable Pay" },
    { key: "shif", label: "Shif" },
    { key: "nssf", label: "NSSF" },
    { key: "housing_levy", label: "Housing Levy" },
    { key: 'personal_relief', label: "Personal Relief" },
    { key: 'insurance', label: "Insurance Relief" },
    { key: "paye", label: "PAYE" },
    { key: "net_pay", label: "Net Pay" },
    { key: "status", label: "Status" },
    { key: "approve", label: "Approve" },
]

const isPayslipSlideOverOpen = ref(false)
const dataToReview = ref()
const payslipId = ref('')

const openPayslipSlideOver = (data: unknown, id?: string | null) => {
    payslipId.value = id != null && id !== '' ? String(id) : ''
    isPayslipSlideOverOpen.value = true
    dataToReview.value = data
}

const approvedPayslip = (payslip: any) => {
    const uid = currentUserId.value;
    const payslipApprovers = new Set(payslip?.approvers);
    const approverForUser = payrollData?.value?.approvers.find(
        (approver: any) => String(approver.approver) === uid
    );

    // Check if the approver ID exists and is in the payslip approvers set
    if (approverForUser && payslipApprovers.has(approverForUser.id)) {
        return true; // User has approved the payslip
    }

    return false; // User has not approved the payslip
};

const loadingBulkApproval = ref(false)
const approveBulkPayslip = async (payslipIds: string[]) => {
    let payslipsForApproval = {
        payslip_ids: payslipIds
    }
    loadingBulkApproval.value = true
    const { error, data, status }: Record<string, any> = await payrollService.approvePayslips({ body: payslipsForApproval })
    if (data.value) {
        toast.add({
            icon: 'i-heroicons-check-circle',
            title: 'Payslip(s) approved',
            color: 'success'
        })
        loadingBulkApproval.value = false
        getPayroll()
    }
}

const approvePayslip = async (payslip: any) => {
    if (approvedPayslip(payslip)) {
        approving.value = true
        const approverId = payrollData?.value.approvers?.find((approver: any) => String(approver.approver) === currentUserId.value)?.id;
        const { error, data, status }: Record<string, any> = await payrollService.dissapprovePayslip({ body: { payslips_and_approvers_ids: [payslip.id] } });

        if (data.value) {
            // Clear selected
            selected.value = []
            // selectedIds.value = []
            toast.add({
                icon: 'i-heroicons-check-circle',
                title: 'Payslip disapproved',
                color: 'success'
            })
            getPayroll()
        }
    } else {
        try {
            let payslipData = {
                payslip_ids: [payslip.id]
            }

            const { error, data, status }: Record<string, any> = await payrollService.approvePayslips({ body: payslipData })

            if (error?.value?.data) {
                throw new Error(error.value?.message || 'An unexpected error occurred while approving the payslip.');
            }

            // Clear selected
            selected.value = []
            // selectedIds.value = []
            getPayroll()

            toast.add({
                icon: 'i-heroicons-check-circle',
                title: 'Payslip approved',
                color: 'success'
            })

        }
        catch (error) {
            toast.add({
                icon: 'i-heroicons-x-circle',
                title: 'Failed to approve payslip',
                description: (error as Error).message || 'An unexpected error occurred. Please try again.',
                color: 'error'
            })
        }
        finally {
            approving.value = false
        }
    }
}

const selected: any = ref([])
const config = useRuntimeConfig()

const handleSuccess = () => {
    isPayslipSlideOverOpen.value = false
    getPayroll()
}

const distributing = ref(false)
const handlePayslipDistribution = async (id: string) => {
    distributing.value = true
    const { error, data, status }: Record<string, any> = await payrollService.destributePayslips(id)

    if (status.value === 'success') {
        distributing.value = false
        toast.add({
            icon: 'i-heroicons-check-circle',
            title: 'Payslips distributed successfully',
            color: 'success'
        })
        getPayroll()
    } else {
        distributing.value = false
    }
    distributing.value = false

}

const mailing = ref(false)
const mailPayslips = async () => {
    if (selected.value.length === 0) {
        toast.add({ title: 'Please select at least one payslip to email', color: 'warning' })
        return
    }

    if (payrollData.value.status !== 'approved') {
        toast.add({ title: 'You can only email approved payslips', color: 'warning' })
        return
    }

    if (!confirm('Share selected payslips to employees via email?')) {
        return
    }

    mailing.value = true
    const payload = {
        payslip_ids: selected.value.map((item: any) => item.id),
        payroll_id: payrollData.value.id,
    }
    const { error, data: res }: Record<string, any> = await payrollService.mailPayslips({ body: payload })
    mailing.value = false

    if (error?.value?.data) {
        if (config.public.currentEnvironment !== 'production') {
            toast.add({ title: 'Failed, something went wrong', color: 'error' })
        }
        return
    }
    if (res.value?.success) {
        toast.add({ title: 'Payslip mailing started…', color: 'success' })
        selected.value = []
    }
}

const canApprove = computed(() => {
    return payrollData?.value?.approvers?.some((approver: any) => String(approver?.approver) === currentUserId.value)
})

type PayslipItem = { name: string; amount: number };

const dataToExport = ref<Array<Record<string, any>>>([]);
const dataToExportGenerotor = () => {
    dataToExport.value = [];
    const payslips = payslipsRes?.value?.results as any[] || [];
    for (const [index, payroll] of payslips.entries()) {
        if (payroll) {
            const {
                employee,
                payslip_items,
                gross_pay,
                net_pay
            } = payroll
            dataToExport.value.push({
                'Name': employee?.full_name,
                'Basic Salary': (payslip_items.find((item: PayslipItem) => item.name === "Basic Pay")?.amount ?? 0),
                'Gross Pay': gross_pay,
                'Shif': (payslip_items.find((item: PayslipItem) => item.name === "SHIF")?.amount ?? 0),
                'NSSF': getNssf(payroll),
                'Housing Levy': (payslip_items.find((item: PayslipItem) => item.name === "AHL")?.amount ?? 0),
                'Personal Relief': (payslip_items.find((item: PayslipItem) => item.name === "Personal Relief")?.amount ?? 0),
                'Insurance Relief': (payslip_items.find((item: PayslipItem) => item.name === "Insurance Relief")?.amount ?? 0),
                'AHL Relief': (payslip_items.find((item: PayslipItem) => item.name === "AHL Relief")?.amount ?? 0),
                'PAYE': (payslip_items.find((item: PayslipItem) => item.name === "PAYE")?.amount ?? 0),
                'Net Pay': net_pay
            });
        }
    }

    return dataToExport.value;
};

const nssfDataToExportGenerator = () => {
    const uniqueRows = Array.from(new Set(selected.value.map((row: any) => row.id)))
        .map((id: any) => selected.value.find((row: any) => row.id === id));
    // the data i need are payroll id, surname, other name, id number, 
    //  gross pay, voluntary
    return uniqueRows.map((item) => {
        return {
            "PAYROLL NUMBER": item.payroll.id,
            "SURNAME": item.employee?.sirname,
            "OTHER NAMES": item.employee?.full_name,
            "ID NUMBER": item.employee?.national_id,
            "GROSS PAY": getGrossPay(item),
            "VOLUNTARY": 0
        }
    })

}

const shifDataToExportGenerator = () => {
    const uniqueRows = Array.from(new Set(selected.value.map((row: any) => row.id)))
        .map((id: any) => selected.value.find((row: any) => row.id === id));
    return uniqueRows.map((item) => {
        return {
            "PAYROLL NUMBER": item.payroll.id,
            "FIRSTNAME": item.employee?.full_name,
            "LASTNAME": item.employee?.sirname,
            "ID NUMBER": item.employee?.national_id,
            "KRA PIN": item.employee?.kra_pin,
            "SHIF NO": item.employee?.shif,
            "CONTRIBUTION AMOUNT": getShif(item),
            "PHONE": item.employee?.phone_number
        }
    })
}

const helbDataToExportGenerator = () => {
    const uniqueRows = Array.from(new Set(selected.value.map((row: any) => row.id)))
        .map((id: any) => selected.value.find((row: any) => row.id === id));

    const validRows: any[] = [];
    const missingIdEmployees: string[] = [];

    for (const item of uniqueRows) {
        if (!item) continue;

        // Use the helper function to get HELB amount (case-insensitive search)
        const amount = getHelb(item);

        if (!amount || amount <= 0) {
            continue;
        }

        const rawId = item.employee?.national_id ?? '';
        const cleanedId = rawId.toString().replace(/[^0-9]/g, '');
        const name = (item.employee?.full_name || '').toString().trim();

        if (!cleanedId) {
            missingIdEmployees.push(name || '(Unknown employee)');
            continue;
        }

        validRows.push({
            ID_NUMBER: cleanedId,
            NAME: name,
            STAFF_NUMBER: item.employee?.employee_number ?? '',
            AMOUNT: Number(amount),
        });
    }

    return { validRows, missingIdEmployees };
}

const helbEmployerDisclosureGenerator = () => {
    const uniqueRows = Array.from(new Set(selected.value.map((row: any) => row.id)))
        .map((id: any) => selected.value.find((row: any) => row.id === id));

    const validRows: any[] = [];
    const missingIdEmployees: string[] = [];

    for (const item of uniqueRows) {
        if (!item) continue;

        // Check if employee has HELB deduction (any amount > 0)
        const amount = getHelb(item);

        if (!amount || amount <= 0) {
            continue;
        }

        const rawId = item.employee?.national_id ?? '';
        const cleanedId = rawId.toString().replace(/[^0-9]/g, '');
        const name = (item.employee?.full_name || '').toString().trim();

        if (!cleanedId) {
            missingIdEmployees.push(name || '(Unknown employee)');
            continue;
        }

        validRows.push({
            IDNUMBER: cleanedId,
            NAME: name,
            STAFFNUMBER: item.employee?.employee_number ?? '',
        });
    }

    return { validRows, missingIdEmployees };
}

const exportData = async (exportType: any, dataType: string) => {
    if (selected.value.length === 0) {
        toast.add({ title: 'Please select at least one row to export', color: 'warning' })
        return
    }

    let dataGenerator: () => any[]
    let fileNamePrefix: string
    let name: string

    if (dataType === 'table') {
        dataGenerator = dataToExportGenerotor
        fileNamePrefix = 'payslips'
        name = 'Payslips'
    } else if (dataType === 'nssf') {
        dataGenerator = nssfDataToExportGenerator
        fileNamePrefix = 'nssf'
        name = 'NSSF'
    } else if (dataType === 'shif') {
        dataGenerator = shifDataToExportGenerator
        fileNamePrefix = 'shif'
        name = 'SHIF'
    } else if (dataType === 'helb') {
        const { validRows, missingIdEmployees } = helbDataToExportGenerator()

        if (missingIdEmployees.length) {
            toast.add({
                title: 'Missing ID numbers',
                description: `The following employees have HELB deductions but no valid ID Number: ${missingIdEmployees.join(', ')}`,
                color: 'warning',
            })
        }

        if (!validRows.length) {
            toast.add({ title: 'No HELB deductions found', description: 'None of the selected employees have HELB deductions to export.', color: 'warning' })
            return
        }

        dataGenerator = () => validRows
        fileNamePrefix = 'HELB_Returns'
        name = 'HELB Remittance'
    } else if (dataType === 'helb_disclosure') {
        const { validRows, missingIdEmployees } = helbEmployerDisclosureGenerator()

        if (missingIdEmployees.length) {
            toast.add({
                title: 'Missing ID numbers',
                description: `The following employees have HELB deductions but no valid ID Number: ${missingIdEmployees.join(', ')}`,
                color: 'warning',
            })
        }

        if (!validRows.length) {
            toast.add({ title: 'No HELB employees found', description: 'None of the selected employees have HELB deductions.', color: 'warning' })
            return
        }

        dataGenerator = () => validRows
        fileNamePrefix = 'HELB_Employer_Disclosure'
        name = 'HELB Employer Disclosure'
    } else {
        return
    }

    await dataExport({
        dataGenerator,
        fileNamePrefix,
        name,
        fileType: exportType,
    })
}

const items = [
    [{
        label: 'Export Table as Excel',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            exportData('xls', 'table')
        }
    }],
    [{
        label: 'Export Table as CSV',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            exportData('csv', 'table')
        }
    }],
    [{
        label: 'Export NSSF as Excel',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            exportData('xls', 'nssf')
        }
    }],
    [{
        label: 'Export NSSF as CSV',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            exportData('csv', 'nssf')
        }
    }],
    [{
        label: 'Export SHIF as Excel',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            exportData('xls', 'shif')
        }
    }],
    [{
        label: 'Export SHIF as CSV',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            exportData('csv', 'shif')
        }
    }],
    [{
        label: 'Export HELB Remittance as CSV',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            exportData('csv', 'helb')
        }
    }],
    [{
        label: 'Export HELB Employer Disclosure as CSV',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            exportData('csv', 'helb_disclosure')
        }
    }],
    [{
        label: 'Export p10(Employees)',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            const payslipIds = selected.value.filter((item: any) => item.employee.pwd === false).map((item: any) => item.id)
            // validate if the payslipIds is empty
            if (payslipIds.length === 0) {
                toast.add({ title: 'No employees were found. Please select employees and try again.', color: 'warning' })
                return
            }
            exportP10Data(payslipIds, false)

        }
    }],
    [{
        label: 'Export P10(PWD)',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            if (selected.value.length === 0) {
                toast.add({ title: 'Please select at least one row to export', color: 'warning' })
                return
            }
            const payslipIds = selected.value.filter((item: any) => item.employee.pwd === true && Boolean(item.employee.excemption_cert_no?.trim())).map((item: any) => item.id)
            // validate if the payslipIds is empty
            if (payslipIds.length === 0) {
                toast.add({ title: 'No person(s) with disability was found.', color: 'warning' })
                return
            }
            exportP10Data(payslipIds, true)
        }
    }],
    [{
        label: 'Export P10(AHL)',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => {
            if (selected.value.length === 0) {
                toast.add({ title: 'Please select at least one row to export', color: 'warning' })
                return
            }
            void exportP10DataForAHL(selected.value)
        }
    }]
]

const seoCompany = (session.value.user as { company?: { name?: string } } | undefined)?.company?.name || 'KaziQuest'

useSeoMeta({
    title: `${seoCompany}  - review payslips`,
    ogTitle: `${seoCompany} - review payslips`,
    description: 'Hire smart | Onboarding | People Management',
    ogDescription: 'This is my amazing site, let me tell you all about it.',
})

// const isPayModalOpen = ref(false)

// Define the active tab index
const activeTabIndex = ref(0)
const isTransactionsTabOpen = computed(() => activeTabIndex.value === 1)

// Function to switch to the Transactions tab
// const handleOpenTransactionTab = () => {
//     try {
//         isPayModalOpen.value = false
//         activeTabIndex.value = 1
//         // refreshWalletData(String(route.params.id))
//     } catch (error) {
//         console.error(error)
//     }
// }

// const setHash = (newHash: string) => {
//   router.replace({ hash: `#${newHash}` })
// }

// const onChange = (index: number) => {
//     activeTabIndex.value = index
//     if (index === 1) {
//         setHash('payrollTransactions')
//     } else {
//         setHash('payrollOverview')
//     }
// }

onMounted(async () => {
    if (!payrollData.value) await getPayroll()
    
    // Only fetch payslips if NOT processing
    if (payrollData?.value?.status === 'processing') {
        startPolling()
    } else {
        await fetchPayslips()
    }
})

onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer)
})

</script>

<template>
    <div>
        <UProgress v-if="loadingPayroll" animation="carousel" />
        <UCard v-else>
            <UButton @click="router.back()" variant="link" size="sm" icon="i-heroicons-chevron-left" label="Back" />

            <div class="mt-2 w-full">
                <UCard>
                    <div>
                        <div class="flex flex-col gap-4">
                            <!-- Async processing banner -->
                            <div v-if="isPolling && progress"
                                class="w-full bg-blue-50 border border-blue-200 rounded p-4 mb-2">
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span class="text-blue-800 font-medium">Processing payroll…</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                    <div :style="{ width: (progress?.progress_percentage || 0) + '%' }"
                                        class="bg-blue-600 h-2.5 rounded-full transition-all duration-300"></div>
                                </div>
                                <div class="text-sm text-blue-900">
                                    {{ progress?.completed_payslips || 0 }} / {{ progress?.total_payslips || 0 }}
                                    payslips
                                </div>
                            </div>

                            <div v-if="!isProcessing" class="w-full">
                                <div class="flex justify-between items-center w-full ">
                                    <div class="flex flex-col gap-2 py-1">
                                        <div class="flex gap-2 items-center">
                                            <h2 class="text-2xl font-semibold">
                                                {{ payrollData?.is_off_cycle ? 'Off-Cycle Payroll' : 'Regular Monthly Payroll' }}
                                            </h2>
                                            <UBadge
                                                :label="payrollData?.status === 'approved' ? 'Approved' : payrollData?.status === 'partially_approved' ? 'Partially Approved' : 'Pending'"
                                                class="capitalize rounded-full"
                                                :color="payrollData?.status === 'approved' ? 'success' : payrollData?.status === 'partially_approved' ? 'warning' : 'error'"
                                            />
                                            <UBadge :label="payrollData?.shared ? 'Distributed' : 'Not Distributed'"
                                                class="capitalize rounded-full" :color="payrollData?.shared ? 'success' : 'error'"
                                            />
                                        </div>
                                        <p class="text-gray-500">{{ payrollData?.name }} Payroll</p>
                                    </div>
                                    <UButton :disabled="payrollData?.status === 'approved' || isProcessing" label="Rerun Payroll" icon="i-heroicons-chevron-right" trailing
                                        @click="router.push(`/payroll/${route.params.id}/rerun`)" />
                                </div>
                                <div
                                    class="flex flex-col justify-between items-center w-full rounded-lg bg-white shadow ring-1 p-4 ring-gray-200">
                                    <div class="flex justify-between items-center w-full">
                                        <div>
                                            <p class="text-lg font-medium">Start Date</p>
                                            <span class="text-gray-500 text-base">{{
                                                formartToLongDayMonthDate(payrollData?.from_date) }}</span>
                                        </div>
                                        <div>
                                            <p class="text-lg font-medium">End Date</p>
                                            <span class="text-gray-500 text-base">{{
                                                formartToLongDayMonthDate(payrollData?.to_date)
                                                }}</span>
                                        </div>
                                        <UDivider class="w-1/2" />
                                        <div>
                                            <p class="text-lg font-medium">Payday On</p>
                                            <span class="text-gray-500 text-base">{{
                                                formartToLongDayMonthDate(payrollData?.pay_date) }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    class="mt-2 flex flex-col justify-between items-center w-full rounded-lg bg-white shadow ring-1 p-4 ring-gray-200">
                                    <div class="flex justify-between items-start w-full">
                                        <div>
                                            <p>Total</p>
                                            <p class="text-base font-semibold">Payroll Cost</p>
                                            <span class="text-gray-500 text-base font-semibold">Ksh {{
                                                formatNumbers.toCurrency(payrollData?.total_payroll_amount?.total_payroll_amount)
                                                }}</span>
                                        </div>
                                        <div>
                                            <p>Employee Amount</p>
                                            <div class="grid grid-cols-2 gap-6">
                                                <div class="flex flex-col">
                                                    <span class="text-base font-semibold ">Total Gross Pay</span>
                                                    <span class="text-gray-500 text-base font-semibold">Ksh {{
                                                        formatNumbers.toCurrency(payrollData?.employees_amount?.total_gross_pay)
                                                        }}</span>
                                                </div>
                                                <div class="flex flex-col">
                                                    <span class="text-base font-semibold">Total Shif Amount</span>
                                                    <span class="text-gray-500 text-base font-semibold">Ksh {{
                                                        formatNumbers.toCurrency(payrollData?.employees_amount?.total_shif_amount)
                                                        }}</span>
                                                </div>
                                                <div class="flex flex-col">
                                                    <span class="text-base font-semibold">Total AHL Amount</span>
                                                    <span class="text-gray-500 text-base font-semibold">Ksh {{
                                                        formatNumbers.toCurrency(payrollData?.employees_amount?.total_ahl_amount)
                                                        }}</span>
                                                </div>
                                                <div class="flex flex-col">
                                                    <span class="text-base font-semibold">Total NSSF Amount</span>
                                                    <span class="text-gray-500 text-base font-semibold">Ksh {{
                                                        formatNumbers.toCurrency(payrollData?.employees_amount?.total_nssf_amount)
                                                        }}</span>
                                                </div>
                                                <div class="flex flex-col">
                                                    <span class="text-base font-semibold">Total PAYE Amount</span>
                                                    <span class="text-gray-500 text-base font-semibold">Ksh {{
                                                        formatNumbers.toCurrency(payrollData?.employees_amount?.total_paye_amount)
                                                        }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <p>Employer Contributions</p>
                                            <div class="grid grid-cols-2 gap-6">
                                                <div class="flex flex-col">
                                                    <span class="text-base font-semibold">Total Employer
                                                        Contributions</span>
                                                    <span class="text-gray-500 font-semibold text-base">Ksh {{
                                                        formatNumbers.toCurrency(payrollData?.employer_amount?.total_employer_amount)
                                                        }}</span>
                                                </div>
                                                <div class="flex flex-col">
                                                    <span class="text-base font-semibold">Total AHL Amount</span>
                                                    <span class="text-gray-500 font-semibold text-base">Ksh {{
                                                        formatNumbers.toCurrency(payrollData?.employer_amount?.ahl_total)
                                                        }}</span>
                                                </div>
                                                <div class="flex flex-col">
                                                    <span class="text-base font-semibold">Total NSSF Amount</span>
                                                    <span class="text-gray-500 font-semibold text-base">Ksh {{
                                                        formatNumbers.toCurrency(payrollData?.employer_amount?.nssf_total)
                                                        }}</span>
                                                </div>
                                                <div class="flex flex-col">
                                                    <span class="text-base font-semibold">Total NITA Amount</span>
                                                    <span class="text-gray-500 font-semibold text-base">Ksh {{
                                                        formatNumbers.toCurrency(payrollData?.employer_amount?.nita_total)
                                                        }}</span>
                                                </div>
                                                <div v-if="payrollData?.employer_amount?.employer_pension_contribution"
                                                    class="flex flex-col">
                                                    <span class="text-base font-semibold">Total Pension Amount</span>
                                                    <span class="text-gray-500 font-semibold text-base">Ksh {{
                                                        formatNumbers.toCurrency(payrollData?.employer_amount?.employer_pension_contribution)
                                                        }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center justify-end gap-2 mt-2">
                                    <!-- <UButton label="Pay" @click="handlePay" /> -->
                                    <UButton :loading="loadingBulkApproval"
                                        v-if="payrollData?.status !== 'approved' && selected.length > 0"
                                        label="Approve payslips"
                                        @click="approveBulkPayslip(selected.map((item: any) => item.id))" />
                                    <UButton v-if="payrollData?.status === 'approved' && !payrollData?.shared"
                                        label="Distribute Payslips" :loading="distributing"
                                        @click="payrollData?.id != null && handlePayslipDistribution(String(payrollData.id))" />
                                    <UButton :loading="mailing" icon="i-heroicons-envelope" label="Email Payslips"
                                        @click="mailPayslips" />
                                    <PayrollP9Form v-if="payrollData?.status === 'approved'"
                                        :employee-ids="selected.map((item: any) => item.employee.employee_id)" />
                                    <UButton variant="outline" :loading="loadingPayroll" label="Refresh"
                                        icon="i-heroicons-arrow-path" @click="getPayroll" />
                                    <UDropdown :items="items" :popper="{ placement: 'bottom-start' }">
                                        <UButton color="neutral" label="Export"
                                            trailing-icon="i-heroicons-chevron-down-20-solid" />
                                    </UDropdown>
                                </div>
                            </div>

                            <!-- Payslip Table -->
                            <div v-if="!isProcessing">
                                <UTable :loading="loadingPayslips" by="id" v-model="selected"
                                    :rows="(payslipsRes?.results as IPayslip[])" :columns="spreadsheetColumns as any"
                                    :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
                                    :progress="{ color: 'primary', animation: 'carousel' }">
                                    <template #select="{ row }">
                                        <UCheckbox v-model="selected" :value="slipRow(row)" />
                                    </template>
                                    <!-- Count Column -->
                                    <template #count-data="{ row }">
                                        <span>{{ tableRowIndex(row) + 1 + ((Number(payslipsRes?.current_page) || 1) - 1) * urlParams.page_size
                                        }}.</span>
                                    </template>
                                    <!-- Employee Name Column -->
                                    <template #full_name-data="{ row }">
                                        <div class="flex flex-col gap-1 items-center">
                                            <UButton class="z-100" variant="link"
                                                @click="openPayslipSlideOver(slipRow(row), slipRow(row).id)">{{
                                                    slipRow(row).employee?.full_name ?? '—' }}</UButton>
                                            <UBadge v-if="slipRow(row).is_prorated" label="prorated" size="xs"
                                                variant="subtle" />
                                        </div>
                                    </template>
                                    <template #basic_pay-data="{ row }">
                                        <span>{{ formatNumbers.toCurrency(getBasicPay(slipRow(row))) }}</span>
                                    </template>
                                    <template #gross_pay-data="{ row }">
                                        <span>{{ formatNumbers.toCurrency(getGrossPay(slipRow(row))) }}</span>
                                    </template>
                                    <template #taxable_pay-data="{ row }">
                                        <span>{{ formatNumbers.toCurrency(getTaxablePay(slipRow(row))) }}</span>
                                    </template>
                                    <template #shif-data="{ row }">
                                        <span>{{ formatNumbers.toCurrency(getShif(slipRow(row))) }}</span>
                                    </template>
                                    <template #nssf-data="{ row }">
                                        <span>{{ formatNumbers.toCurrency(getNssf(slipRow(row))) }}</span>
                                    </template>
                                    <template #housing_levy-data="{ row }">
                                        <span>{{ formatNumbers.toCurrency(getAhl(slipRow(row))) }}</span>
                                    </template>
                                    <template #nita-data="{ row }">
                                        <span>{{ formatNumbers.toCurrency(getNita(slipRow(row))) }}</span>
                                    </template>
                                    <template #personal_relief-data="{ row }">
                                        <span>{{ formatNumbers.toCurrency(getPersonalRelief(slipRow(row))) }}</span>
                                    </template>
                                    <template #insurance-data="{ row }">
                                        <span>{{ formatNumbers.toCurrency(getInsuranceRelief(slipRow(row))) }}</span>
                                    </template>
                                    <!-- <template #ahl_relief-data="{ row }">
                                <span>{{ formatNumbers.toCurrency(Number(row.payslip_items.find(item => item.name === 'AHL Relief').amount)) }}</span>
                            </template> -->
                                    <template #paye-data="{ row }">
                                        <span>{{ formatNumbers.toCurrency(getPaye(slipRow(row))) }}</span>
                                    </template>
                                    <template #net_pay-data="{ row }">
                                        <div class="flex flex-col">
                                            <span>{{ formatNumbers.toCurrency(getNetPay(slipRow(row))) }}</span>
                                            <!-- <span>Paid status: {{ row.paid_status === 'paid' ? 'Paid' : row.paid_status === 'processing' ? 'Processing' : row.paid_status === 'failed' ? 'Failed' : 'Pending' }}</span> -->
                                        </div>
                                    </template>
                                    <template #status-data="{ row }">
                                        <UBadge
                                          class="capitalize rounded-full"
                                          :color="slipRow(row).status === 'approved' ? 'success' : slipRow(row).status === 'partiallyApproved' ? 'warning' : 'error'"
                                        >
                                            {{ slipRow(row).status === 'approved' ? 'Approved' : slipRow(row).status ===
                                                'partiallyApproved' ?
                                                'Partially Approved' : 'Pending' }}</UBadge>
                                    </template>
                                    <template #approve-data="{ row }">
                                        <UToggle
                                            :disabled="payrollData?.status === 'approved' || !canApprove"
                                            on-icon="i-heroicons-check-20-solid" off-icon="i-heroicons-x-mark-20-solid"
                                            size="lg" :model-value="approvedPayslip(slipRow(row))"
                                            @change="approvePayslip(slipRow(row))" />
                                    </template>
                                </UTable>

                                <div v-if="payslipsRes && Object.keys(payslipsRes).length > 0"
                                    class="flex items-center gap-1 lg:gap-3 justify-between pt-4 border-t">
                                    <div v-if="payslipsRes?.current_page_count" class="flex text-sm">
                                        <LoadingIndicator v-if="loadingPayslips" />
                                        <span v-else>Showing {{
                                            ((payslipsRes.current_page - 1) *
                                                payslipsRes.current_page_count) + 1 }} to {{
                                                payslipsRes.current_page_count * payslipsRes.current_page
                                            }} of {{
                                                payslipsRes.count }} entries</span>
                                    </div>

                                    <UPagination
                                      v-model:page="urlParams.page"
                                      :items-per-page="urlParams.page_size"
                                      :total="payslipsRes.count || 0"
                                    />

                                    <div class="flex items-center gap-2">
                                        <span class="text-sm">Per page</span>
                                        <USelect
                                          v-model="urlParams.page_size"
                                          size="sm"
                                          class="w-24"
                                          :items="pageSizeOptions.map((n) => ({ label: String(n), value: n }))"
                                          value-key="value"
                                          label-key="label"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>
                <USlideover v-model="isPayslipSlideOverOpen" prevent-close>
                    <UCard class="flex flex-1 flex-col divide-y divide-gray-200 ring-0">
                        <template #header>
                            <div class="flex flex-row-reverse items-center justify-between">
                                <h3 class="capitalize font-medium text-kaziquest-600">
                                  {{ dataToReview?.employee?.full_name || 'Employee' }} — payslip
                                </h3>
                                <UButton variant="ghost" icon="i-heroicons-x-mark-20-solid" color="error"
                                    @click="isPayslipSlideOverOpen = false" />
                            </div>
                        </template>
                        <PayrollPayslipDetails
                          :payroll_id="String(payrollData?.id ?? '')"
                          :is-approved="payrollData?.status === 'approved'"
                          :payroll-approvers="payrollData?.approvers || []"
                          :payslip-id="String(payslipId)"
                          :data="dataToReview"
                          :payroll-details="payrollData"
                          :show-approve-in-slideover="true"
                          @success="handleSuccess"
                        />
                    </UCard>
                </USlideover>
            </div>
            <!-- <UTabs v-model="activeTabIndex" :items="timeoffsTab" @change="onChange" class="mt-2 w-full">
            <template #payrollOverview >
               
            </template>
            <template #payrollTransactions="{ item }">
                <PayrollTransactionDetails v-if="isTransactionsTabOpen" />
            </template>
        </UTabs> -->
            <!-- <pre>{{ user?.company }}</pre> -->

            <!--  -->
            <!-- <PayrollInitiatePayModal v-if="isPayModalOpen" :title="payrollData?.name" :payslip_ids="selected.map((item: any) => item.id)" :numberOfEmployeeToPay="selected.length"
            :open="isPayModalOpen" @close="isPayModalOpen = false" @openTransactionTab="[selected = [], handleOpenTransactionTab()]"/> -->
        </UCard>
    </div>
</template>
