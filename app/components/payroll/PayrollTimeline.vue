<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    payrollData: Array<Record<string, unknown>>
    selectedYear?: number
    loading?: boolean
  }>(),
  {
    selectedYear: () => new Date().getFullYear(),
    loading: false
  }
)

const emit = defineEmits<{
  'selected-pay-period': [payload: Record<string, unknown>]
}>()

const payrollStore = usePayrollStore()

const defaultMonthIndex = new Date().getMonth()
const activeIndex = ref((payrollStore.selectedPayMonth ? payrollStore.selectedPayMonth - 1 : defaultMonthIndex))

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface TTimeline {
  month: string
  year: string
  date: string
  day: string
  from_date: string
  to_date: string
  status: string | null
  pay_date: string
  id?: string
}

const timelineData = computed((): TTimeline[] => {
  const yearPayrolls = props.payrollData
    .filter((p) => {
      if (p.is_off_cycle) {
        return false
      }
      const pd = String(p.pay_date || '')
      return pd.startsWith(String(props.selectedYear))
    })
    .reduce((acc: Record<number, Record<string, unknown>>, payroll) => {
      const monthIndex = new Date(String(payroll.pay_date)).getMonth()
      acc[monthIndex] = payroll
      return acc
    }, {})

  return MONTHS.map((month, index) => {
    const payroll = yearPayrolls[index]
    const monthLastDay = new Date(props.selectedYear, index + 1, 0)
    const monthFirstDay = new Date(props.selectedYear, index, 1)
    const payDate = payroll
      ? new Date(String(payroll.pay_date))
      : monthLastDay

    let status: string | null = null
    if (payroll) {
      status = payroll.status != null ? String(payroll.status) : null
    }

    return {
      month,
      year: String(props.selectedYear),
      date: String(payDate.getDate()).padStart(2, '0'),
      day: payDate.toLocaleDateString('en-US', { weekday: 'long' }),
      from_date: (payroll?.from_date as string) || `${props.selectedYear}-${String(index + 1).padStart(2, '0')}-${String(monthFirstDay.getDate()).padStart(2, '0')}`,
      to_date: (payroll?.to_date as string) || `${props.selectedYear}-${String(index + 1).padStart(2, '0')}-${String(payDate.getDate()).padStart(2, '0')}`,
      status,
      pay_date: (payroll?.pay_date as string) || `${props.selectedYear}-${String(index + 1).padStart(2, '0')}-${String(payDate.getDate()).padStart(2, '0')}`,
      id: payroll?.id != null ? String(payroll.id) : undefined
    }
  })
})

const setActive = (index: number, emitEvent: boolean = true) => {
  activeIndex.value = index
  const row = timelineData.value[index]
  if (!row) return
  payrollStore.setCurrentPeriod(row.from_date, row.to_date)
  payrollStore.selectedPayPeriod = row as unknown as Record<string, unknown>
  payrollStore.selectedPayMonth = index + 1
  if (emitEvent) {
    emit('selected-pay-period', row as unknown as Record<string, unknown>)
  }
}

onMounted(() => {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  if (currentYear === props.selectedYear) {
    const targetIndex = payrollStore.selectedPayMonth ? payrollStore.selectedPayMonth - 1 : currentMonth
    if (timelineData.value[targetIndex]) {
      setActive(targetIndex, true)
      return
    }
  }

  const processingIndex = timelineData.value.findIndex((t) => {
    if (!t.status) {
      return false
    }
    return String(t.status).toLowerCase() === 'processing'
  })

  if (processingIndex !== -1) {
    setActive(processingIndex, true)
  }
  else {
    const fallbackIndex = (currentYear === props.selectedYear) ? currentMonth : 0
    setActive(fallbackIndex, true)
  }
})

watch(() => props.selectedYear, (newYear) => {
  const today = new Date()
  const currentMonth = today.getMonth()
  const targetIndex = payrollStore.selectedPayMonth ? payrollStore.selectedPayMonth - 1 : (newYear === today.getFullYear() ? currentMonth : 0)
  if (timelineData.value[targetIndex]) {
    setActive(targetIndex, true)
    return
  }

  const processingIndex = timelineData.value.findIndex((t) => {
    if (!t.status) {
      return false
    }
    return String(t.status).toLowerCase() === 'processing'
  })

  if (processingIndex !== -1) {
    setActive(processingIndex, true)
  }
  else {
    setActive(0, true)
  }
})
</script>

<template>
  <div>
    <div v-if="loading" class="my-10">
      <USkeleton class="h-24 w-full rounded-lg" />
    </div>
    <div v-else class="my-4">
      <div class="flex gap-3 overflow-x-auto rounded-lg border border-default px-3 py-3 bg-muted/30">
        <button
          v-for="(timeline, index) in timelineData"
          :key="timeline.pay_date"
          type="button"
          class="shrink-0 w-40 rounded-lg border px-3 py-3 text-left cursor-pointer transition-colors"
          :class="[
            activeIndex === index ? 'border-primary bg-default' : 'border-default bg-default hover:border-primary',
            timeline.status === 'Not Run' ? 'bg-error/5' : ''
          ]"
          @click="setActive(index)"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-sm font-semibold text-highlighted">{{ timeline.month }}</p>
              <p class="text-xs text-muted">{{ timeline.year }}</p>
            </div>

            <div
              class="inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium whitespace-nowrap leading-none"
              :class="timeline.status === 'approved' ? 'bg-success/15 text-success'
                : timeline.status === 'pending' ? 'bg-warning/15 text-warning'
                  : timeline.status === 'processing' ? 'bg-info/15 text-info'
                    : timeline.status === 'partially_approved' ? 'bg-warning/20 text-warning'
                      : timeline.status === 'Not Run' ? 'bg-error/15 text-error'
                        : 'bg-muted text-muted'"
            >
              <UIcon v-if="timeline.status === 'approved'" name="i-lucide-check" class="size-3.5" />
              <UIcon v-else-if="timeline.status === 'pending'" name="i-lucide-clock" class="size-3.5" />
              <UIcon v-else-if="timeline.status === 'processing'" name="i-lucide-loader-circle" class="size-3.5" />
              <UIcon v-else-if="timeline.status === 'partially_approved'" name="i-lucide-triangle-alert" class="size-3.5" />
              <UIcon v-else-if="timeline.status === 'Not Run'" name="i-lucide-x" class="size-3.5" />
              {{
                timeline.status === 'approved' ? 'Approved'
                  : timeline.status === 'pending' ? 'Pending'
                    : timeline.status === 'processing' ? 'Processing'
                      : timeline.status === 'partially_approved' ? 'Partial'
                        : timeline.status === 'Not Run' ? 'Not run'
                          : 'Up next'
              }}
            </div>
          </div>

          <div class="mt-3 flex items-end justify-between">
            <p class="text-3xl font-semibold text-highlighted">{{ timeline.date }}</p>
            <p class="text-xs text-muted">{{ timeline.day }}</p>
          </div>

          <div v-if="activeIndex === index" class="mt-2 h-1 w-full rounded bg-primary" />
        </button>
      </div>
    </div>
  </div>
</template>
