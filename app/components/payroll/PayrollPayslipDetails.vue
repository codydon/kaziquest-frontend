<script setup lang="ts">
import { payrollService } from '~~/services/payroll.service'
import formatNumbers from '~/utils/formatNumbers'

const payrollStore = usePayrollStore()
const { formatToLongDate, toDDMMYYYY } = usePayrollDates()

const props = defineProps({
  data :{
    type: Object,
    required: true,
  },
  payrollDetails: {
    type: Object,
    required: true,
  },
  payslipId:{
    type: String,
    required: true,
  },
  payroll_id: {
    type: String,
    required: true,
  },
  isApproved:{
    type: Boolean,
    required: true,
  },
  payrollApprovers: {
    type: Array,
    required: true,
  },
  showApproveInSlideover: {
    type: Boolean,
    default: false,
  }
})

const emits = defineEmits(['success'])

const toast = useToast()

const loading = ref(false)
const approvePayslip = async (payslip: any) => {
    try {
        loading.value = true
        if (payslip.status === 'approved') {
            const {data, error} = await payrollService.dissapprovePayslip({ body: { payslips_and_approvers_ids: [payslip.id] } })

            if(error?.value?.data){
                if(useRuntimeConfig().public.currentEnvironment !== 'development')return void 0 /* console.error(error) */
            }

            emits('success')
        } else {
            let payslipData = {
                payslip_ids: [payslip.id]
            }
            
            const {data, error} = await payrollService.approvePayslips({ body: payslipData })

            if(error?.value?.data){
                if(useRuntimeConfig().public.currentEnvironment !== 'development')return void 0 /* console.error(error) */
            }

            emits('success')
        }
    }
    catch (error) {
        if (useRuntimeConfig().public.currentEnvironment === 'development') void 0 /* console.error('Error approving/dissaproving payslip:', error) */
    }
    finally {
        loading.value = false
    }
}
// const isApprovedProps = props.isApproved === 'approved' ? true : false
// const isApprover = props.payrollApprovers.some(item => item?.approver.id === user?.value.id);
const handleEditPayrollNavigationView = () => {
  // payrollStore.setPayrollId(props.payroll_id)
  payrollStore.setupPayslipId(props.payslipId)
  navigateTo(`/payroll/payslip/${props.data?.employee?.employee_id}`)
}

const prorataDetails = computed(() => {
    return props.data?.pdf_items?.prorata_data?.prorata_details || null
})

const isProratedBasicSalaryEarning = (earning: any) => {
  const name = String(earning?.name || '')
  return name.startsWith('Pro-Rated Basic Salary') || name.startsWith('Pro-rated Salary')
}

const getProratedEarningBaseLabel = (earning: any) => {
  const name = String(earning?.name || '')
  const match = name.match(/^(Pro-Rated Basic Salary|Pro-rated Salary)/)
  return match?.[1] || name
}

const getProratedEarningDateLabel = (earning: any) => {
  if (!isProratedBasicSalaryEarning(earning)) {
    return ''
  }

  const details = prorataDetails.value
  const fromDate = details?.effective_start_date || details?.actual_start_date
  const toDate = details?.effective_end_date || details?.actual_end_date

  if (fromDate && toDate) {
    return `(${toDDMMYYYY(fromDate)} - ${toDDMMYYYY(toDate)})`
  }

  const name = String(earning?.name || '')
  const match = name.match(/\(([^)]+)\)\s*$/)
  return match ? `(${match[1]})` : ''
}

const showApproveButton = computed(() => (
  props.showApproveInSlideover && props.data?.status !== 'approved'
))

</script>
<template>
  <div class="flex h-full max-h-[calc(100vh-7rem)] flex-col">
    <div class="scroll-region flex-1 space-y-3 overflow-y-auto pr-1">
    <div class="rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 shadow-sm ring-1 ring-slate-200 px-3 py-3">
        <h2 class="text-lg font-semibold text-slate-700 text-center">
            {{ data?.employee?.full_name }}
            <UBadge v-if="data?.pdf_items?.is_prorated" label="prorated" size="xs" color="info" variant="soft" />
        </h2>
        <div class="flex flex-wrap justify-center gap-2.5 mt-3">
            <UButton v-if="data?.status !== 'approved'" @click="handleEditPayrollNavigationView" variant="outline" size="sm" label="Adjust Payroll Inputs" icon="material-symbols-edit-outline" />
            <UButton @click="navigateTo(`/employees/${data?.employee?.employee_id}#payInfo`)" label="Employee Profile" variant="outline" size="sm" icon="i-heroicons-chevron-right" trailing  />
        </div>
    </div>

    <div class="pt-2 flex flex-col gap-2">
      <h5 class="text-center text-sm font-medium text-slate-600">Pay Slip for Month of {{ formatToLongDate(payrollDetails?.pay_date) }}</h5>
        <div class="payslip-content space-y-3">
        <!-- Personal Info Table -->
        <div class="table-wrap">
          <table class="table">
              <tbody>
                  <tr>
                      <td>Name</td>
                      <td>{{ data?.pdf_items?.employee?.full_name }}</td>
                  </tr>
                  <tr>
                      <td>Employee Number</td>
                      <td>{{ data?.pdf_items?.employee?.employee_number }}</td>
                  </tr>
                  <tr>
                      <td>ID Number</td>
                      <td>{{ data?.pdf_items?.employee?.id_number }}</td>
                  </tr>
                  <tr>
                      <td>PIN</td>
                      <td>{{ data?.pdf_items?.employee?.kra_pin_no }}</td>
                  </tr>
                  <tr>
                      <td>Job Title</td>
                      <td>{{ data?.pdf_items?.employee?.job_title }}</td>
                  </tr>
                  <tr>
                      <td>Department</td>
                      <td>{{ data?.pdf_items?.employee.department }}</td>
                  </tr>
                  <tr>
                      <td>Currency</td>
                      <td>{{ data?.pdf_items?.currency }}</td>
                  </tr>
              </tbody>
          </table>
        </div>

        <!-- Earnings Table -->
         <!-- <pre>{{ JSON.stringify(data?.pdf_items?.prorata_details, null, 2) }}</pre> -->
        <div class="table-wrap">
          <table class="table">
              <thead>
                  <tr>
                      <th colspan="2">Earnings</th>
                  </tr>
              </thead>
              <tbody>
                  <tr v-for="earning in data?.pdf_items?.earnings" >
                      <td style="text-transform: capitalize">
                          <template v-if="isProratedBasicSalaryEarning(earning)">
                              <span>{{ getProratedEarningBaseLabel(earning) }}</span>
                              <span v-if="getProratedEarningDateLabel(earning)" class="earning-date-muted">
                                  {{ getProratedEarningDateLabel(earning) }}
                              </span>
                          </template>
                          <template v-else>
                              {{ earning.name }}
                          </template>
                      </td>
                      <td>
                          <div class="flex items-center gap-2.5">
                              <span>{{ earning.amount }}</span>
                        <UPopover v-if="isProratedBasicSalaryEarning(earning)">
                                  <UButton variant="link" size="xs" label="View details" />

                                  <template #content>
                                  <div class="p-3 max-w-xs">
                                      <div v-if="prorataDetails" class="space-y-2">
                                          <div class="text-sm text-gray-600 mb-2">Pro rata details</div>
                                          <div class="text-sm flex justify-between">
                                              <span class="text-gray-500">Total days</span>
                                              <span>{{ prorataDetails?.total_days }}</span>
                                          </div>
                                          <div class="text-sm flex justify-between">
                                              <span class="text-gray-500">Days worked</span>
                                              <span>{{ prorataDetails?.days_worked }}</span>
                                          </div>
                                          <div class="text-sm flex justify-between">
                                              <span class="text-gray-500">From &nbsp;</span>
                                              <span>{{ toDDMMYYYY(prorataDetails?.effective_start_date || prorataDetails?.actual_start_date) }}</span>
                                          </div>
                                          <div class="text-sm flex justify-between">
                                              <span class="text-gray-500">To &nbsp;</span>
                                              <span>{{ toDDMMYYYY(prorataDetails?.effective_end_date || prorataDetails?.actual_end_date) }}</span>
                                          </div>
                                          <div class="text-sm flex justify-between mt-2">
                                              <span class="text-gray-700 font-medium">Prorated salary &nbsp;</span>
                                              <span class="font-medium">{{ formatNumbers?.toCurrency(prorataDetails?.prorata_salary || prorataDetails?.prorated_gross_pay) }}</span>
                                          </div>
                                      </div>
                                      <div v-else class="text-sm text-gray-500">No details available</div>
                                  </div>
                                  </template>
                              </UPopover>
                          </div>
                      </td>
                  </tr>
                  <tr class="total-row">
                      <td>Gross Earnings</td>
                      <td>{{ data?.pdf_items?.total_earnings }}</td>
                  </tr>
              </tbody>
          </table>
        </div>

        <!-- Tax Information Table -->
        <div class="table-wrap">
        <table class="table">
            <thead>
                <tr>
                    <th colspan="2">Tax Information</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Gross Earnings</td>
                    <td>{{ data?.pdf_items?.total_earnings }}</td>
                </tr>
                <tr>
                    <td class="italic-row">Less Affordable Housing Levy</td>
                    <td>{{ data?.pdf_items?.ahl }}</td>
                </tr>
                <tr>
                    <td class="italic-row">Less NSSF</td>
                    <td>{{ data?.pdf_items?.nssf }}</td>
                </tr>
                <tr>
                    <td class="italic-row">Less SHIF</td>
                    <td>{{ data?.pdf_items?.shif }}</td>
                </tr>
                <tr>
                    <td class="italic-row">Less Pension</td>
                    <td>{{ data?.pdf_items?.allowable_pension_amt }}</td>
                </tr>
                <tr v-if="data?.pdf_items?.allowable_home_ownership_amt > 0" >
                    <td class="italic-row">Less Home Ownership Savings</td>
                    <td>{{ data?.pdf_items?.allowable_home_ownership_amt }}</td>
                </tr>
                <tr v-if="data?.pdf_items?.allowable_mortgage_amt> 0" >
                    <td class="italic-row">Less Mortgage Interest</td>
                    <td>{{ data?.pdf_items?.allowable_mortgage_amt }}</td>
                </tr>
                <tr v-if="data?.pdf_items?.total_allowable_deductions> 0">
                    <td>Total Allowable Deductions</td>
                    <td>{{ data?.pdf_items?.total_allowable_deductions }}</td>
                </tr>
                <tr>
                    <td>Total Taxable Pay</td>
                    <td>{{ data?.pdf_items?.taxable_pay }}</td>
                </tr>
                <tr class="empty-row">
                    <td></td>
                    <td></td>
                </tr>
                <tr>
                    <td>Tax Payable</td>
                    <td>{{ data?.pdf_items?.income_tax }} </td>
                </tr>
                <tr>
                    <td class="italic-row">Less Personal Relief</td>
                    <td>{{ data?.pdf_items?.personal_relief }}</td>
                </tr>
                <tr v-if="data?.pdf_items?.insurance_relief > 0" >
                    <td class="italic-row">Less Insurance Relief</td>
                    <td>{{ data?.pdf_items?.insurance_relief }}</td>
                </tr>
                <tr class="total-row">
                    <td>PAYE</td>
                    <td>{{ data?.pdf_items?.paye }}</td>
                </tr>
            </tbody>
        </table>
        </div>

        <!-- Deductions Table -->
        <div class="table-wrap">
        <table class="table">
            <thead>
                <tr>
                    <th colspan="2">Deductions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="deduction in data?.pdf_items?.deductions" >
                    <td style="text-transform: capitalize;">{{ deduction.name }}</td>
                    <td>{{ deduction.amount }}</td>
                </tr>
                <tr class="total-row">
                    <td>Total Deductions</td>
                    <td>{{ data?.pdf_items?.total_deductions }}</td>
                </tr>
                <tr class="total-row">
                    <td>Net Earnings</td>
                    <td>{{ data?.pdf_items?.net_pay }}</td>
                </tr>
            </tbody>
        </table>
        </div>
    </div>
    </div>
    </div>

    <div v-if="showApproveButton" class="sticky-footer mt-3 pt-3">
        <UButton label="Approve" size="lg" block color="primary" :loading="loading" @click="approvePayslip(data)" />
    </div>
  </div>
</template>

<style scoped>
.scroll-region {
    min-height: 0;
}
.sticky-footer {
    background: linear-gradient(to top, #ffffff 78%, rgba(255, 255, 255, 0.92) 100%);
    border-top: 1px solid #e2e8f0;
}
.table-wrap {
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-bottom: 0;
}
.table th, .table td {
    text-align: left;
    padding: 7px 10px;
    border-right: 1px solid #cbd5e1;
    border-bottom: 1px solid #cbd5e1;
    vertical-align: middle;
    color: #334155;
}
.table th {
    font-weight: 700;
    background: #f8fafc;
    color: #0f172a;
}
.table td {
    width: 50%;
}
.table tr:last-child td {
    border-bottom: none;
}
.table tr td:last-child,
.table tr th:last-child {
    border-right: none;
}
.table tbody tr:nth-child(even):not(.total-row) td {
    background: #fcfdff;
}
.earning-date-muted {
    display: block;
    margin-top: 1px;
    color: #94a3b8;
    font-size: 0.78em;
    line-height: 1.2;
    font-weight: 400;
}
.total-row {
    font-weight: bold;
}
.total-row td {
    background: #f8fafc;
    color: #0f172a;
}
.italic-row {
    font-style: italic;
    padding-left: 20px !important;
    color: #64748b;
}
.empty-row {
    height: 18px;
}
</style>
