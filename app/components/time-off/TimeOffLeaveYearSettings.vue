<script setup lang="ts">
import { timeOffService } from '~~/services/timeoff.service'
import { parseApiError } from '~/utils/parseApiError'

interface LeaveYearForm {
  leave_year_start: 'contract_start' | 'year_start'
  leave_year_start_month: number
  leave_year_start_day: number
}

const toast = useToast()
const loading = ref(false)
const confirmOpen = ref(false)

const leaveYearSettings = ref<LeaveYearForm>({
  leave_year_start: 'contract_start',
  leave_year_start_month: 1,
  leave_year_start_day: 1,
})

const originalSettings = ref<LeaveYearForm>({ ...leaveYearSettings.value })

const leaveYearStartItems = [
  { label: 'Employee contract start date', value: 'contract_start' as const },
  { label: 'Calendar year', value: 'year_start' as const },
]

const monthItems = Array.from({ length: 12 }, (_, i) => ({
  label: new Date(2024, i, 1).toLocaleString(undefined, { month: 'long' }),
  value: i + 1,
}))

const dayItems = computed(() => {
  const month = leaveYearSettings.value.leave_year_start_month || 1
  const daysInMonth = new Date(2024, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }))
})

watch(
  () => leaveYearSettings.value.leave_year_start_month,
  (month) => {
    const daysInMonth = new Date(2024, month || 1, 0).getDate()
    if (leaveYearSettings.value.leave_year_start_day > daysInMonth) {
      leaveYearSettings.value.leave_year_start_day = daysInMonth
    }
  },
)

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  loading.value = true
  try {
    const response = await timeOffService.getCompanyLeaveYearSettings({
      handler: '$fetch',
    }) as LeaveYearForm
    if (response) {
      leaveYearSettings.value = { ...response }
      originalSettings.value = { ...response }
    }
  }
  catch (error: unknown) {
    toast.add({
      title: 'Unable to load leave year settings',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

const confirmTitle = ref('')
const confirmMessage = ref('')

function openSaveConfirm() {
  if (leaveYearSettings.value.leave_year_start === 'contract_start') {
    confirmTitle.value = 'Use contract start dates?'
    confirmMessage.value = 'Each employee will have their own leave year based on their contract start date.'
  }
  else {
    const monthName = monthItems.find(m => m.value === leaveYearSettings.value.leave_year_start_month)?.label
      || 'January'
    const day = leaveYearSettings.value.leave_year_start_day || 1
    confirmTitle.value = `Change leave year to ${monthName} ${day}?`
    confirmMessage.value = `All employees’ leave years will reset on ${monthName} ${day} every year.`
  }
  confirmOpen.value = true
}

async function confirmSave() {
  confirmOpen.value = false
  loading.value = true
  try {
    const daysInMonth = new Date(
      2024,
      leaveYearSettings.value.leave_year_start_month,
      0,
    ).getDate()
    if (leaveYearSettings.value.leave_year_start_day > daysInMonth) {
      toast.add({
        title: 'Invalid day',
        description: `Maximum for this month is ${daysInMonth}.`,
        color: 'warning',
      })
      return
    }
    await timeOffService.updateCompanyLeaveYearSettings({
      handler: '$fetch',
      method: 'PATCH',
      body: leaveYearSettings.value,
    })
    const updated = await timeOffService.getCompanyLeaveYearSettings({
      handler: '$fetch',
    }) as LeaveYearForm
    if (updated) {
      leaveYearSettings.value = { ...updated }
      originalSettings.value = { ...updated }
      if (leaveYearSettings.value.leave_year_start === 'contract_start') {
        leaveYearSettings.value.leave_year_start_month = 1
        leaveYearSettings.value.leave_year_start_day = 1
      }
    }
    toast.add({ title: 'Leave year settings updated', color: 'success' })
  }
  catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Unable to save settings.'),
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

const showMonthDay = computed(() => leaveYearSettings.value.leave_year_start === 'year_start')

const hasChanges = computed(() => {
  return (
    leaveYearSettings.value.leave_year_start !== originalSettings.value.leave_year_start
    || leaveYearSettings.value.leave_year_start_month !== originalSettings.value.leave_year_start_month
    || leaveYearSettings.value.leave_year_start_day !== originalSettings.value.leave_year_start_day
  )
})

const currentOptionLabel = computed(() => {
  if (originalSettings.value.leave_year_start === 'contract_start') {
    return 'Each employee\'s contract start date'
  }
  const monthName = monthItems.find(m => m.value === originalSettings.value.leave_year_start_month)?.label
    || 'January'
  return `${monthName} ${originalSettings.value.leave_year_start_day} every year`
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-calendar-days" class="size-4 text-primary" />
        <h3 class="text-sm font-semibold">
          Leave year start
        </h3>
      </div>
    </template>

    <div class="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <p class="text-xs font-medium text-muted">
        Currently set to
      </p>
      <p class="text-sm font-semibold">
        {{ currentOptionLabel }}
      </p>
    </div>

    <div class="space-y-3">
      <UFormField label="Leave year begins on">
        <USelect
          v-model="leaveYearSettings.leave_year_start"
          :items="leaveYearStartItems"
          value-key="value"
          label-key="label"
          class="w-full"
          :loading="loading"
        />
      </UFormField>

      <div v-if="showMonthDay" class="grid grid-cols-2 gap-2">
        <UFormField label="Month">
          <USelect
            v-model="leaveYearSettings.leave_year_start_month"
            :items="monthItems"
            value-key="value"
            label-key="label"
            class="w-full"
            :loading="loading"
          />
        </UFormField>
        <UFormField label="Day">
          <USelect
            v-model="leaveYearSettings.leave_year_start_day"
            :items="dayItems"
            value-key="value"
            label-key="label"
            class="w-full"
            :loading="loading"
          />
        </UFormField>
      </div>
    </div>

    <p class="mt-4 text-xs text-muted">
      <span class="font-medium">Contract start:</span> each employee’s own start date.
      <span class="font-medium ml-2">Calendar year:</span> same reset date for everyone.
    </p>

    <div v-if="hasChanges" class="mt-4 flex justify-end border-t border-default pt-4">
      <UButton
        size="sm"
        icon="i-lucide-check"
        :loading="loading"
        label="Save"
        @click="openSaveConfirm"
      />
    </div>
  </UCard>

  <UModal
    v-model:open="confirmOpen"
    :title="confirmTitle"
    :description="confirmMessage"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          @click="confirmOpen = false"
        />
        <UButton label="Yes, update" @click="() => void confirmSave()" />
      </div>
    </template>
  </UModal>
</template>
