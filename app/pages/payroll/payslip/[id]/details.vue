<script setup lang="ts">
import { payrollService } from '~~/services/payroll.service'
import formatNumbers from '~/utils/formatNumbers'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default'
})

const authStore = useAuthStore()
const router = useRouter()
const { formartToLongDayMonthDate } = usePayrollDates()
const payrollStore = usePayrollStore()
const payslipToView = computed(() => payrollStore.payslipToView as Record<string, any> | null)

useSeoMeta({
  title: `${(authStore.user as { company?: { name?: string } })?.company?.name || 'Kaziquest'} - employee payslip`,
  description: 'Employee Payslip'
})

const taxes = ref<{ name: string, amount: string | number }[]>([])

watch(
  payslipToView,
  (p) => {
    taxes.value = []
    if (!p?.payslip_items) return
    const deductionItems = ['NSSF', 'SHIF', 'AHL']
    for (const deduction of deductionItems) {
      const deductionItem = p.payslip_items.find((item: { name?: string }) => item.name === deduction)
      if (deductionItem) {
        taxes.value.push({
          name: deductionItem?.name,
          amount: formatNumbers.toCurrency(Number(deductionItem.amount))
        })
      }
    }
  },
  { immediate: true, deep: true }
)

const getPayslipPdf = async (): Promise<void> => {
  const slip = payslipToView.value
  if (!slip?.id) return
  try {
    const response = await payrollService.generatePayslipPdf(String(slip.id)) as unknown
    const blob = new Blob([response as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch {
    void 0
  }
}
</script>

<template>
  <div>
    <UCard class="p-4 sm:p-5">
      <div v-if="payslipToView" class="flex flex-col gap-4 lg:flex-row">
        <div class="flex flex-col gap-3 lg:w-3/4">
          <PayrollPayslipDetails
            :data="payslipToView"
            :payroll-details="payslipToView?.payroll || {}"
            :payslip-id="String(payslipToView?.id ?? '')"
            :payroll_id="String(payslipToView?.payroll?.id ?? '')"
            :is-approved="payslipToView?.status === 'approved'"
            :payroll-approvers="[]"
          />
        </div>
        <div class="flex flex-col gap-2.5 lg:w-1/4">
          <UButton label="Download Payslip" block size="xl" @click="getPayslipPdf" />
          <UCard>
            <div class="flex gap-2">
              <UIcon name="i-heroicons-calendar" class="size-8" />
              <div>
                <p>Pay Period</p>
                <p class="text-sm text-muted">
                  {{ formartToLongDayMonthDate(payslipToView?.payroll?.from_date) }} -
                  {{ formartToLongDayMonthDate(payslipToView?.payroll?.to_date) }}
                </p>
              </div>
            </div>
          </UCard>
          <UButton
            label="Back to payment info"
            variant="link"
            icon="i-heroicons-chevron-left"
            @click="router.back()"
          />
        </div>
      </div>
      <UAlert v-else color="warning" variant="soft" title="No payslip loaded" description="Open this page from payroll review after selecting a payslip." />
    </UCard>
  </div>
</template>
