<script setup lang="ts">
import { timeOffService } from '~~/services/timeoff.service'
import { parseApiError } from '~/utils/parseApiError'

interface BalanceDetail {
  id: string
  available_balance?: number
  employee_data?: {
    full_name?: string
    reports_to?: { id: string | number }[]
    current_job_data?: {
      position?: {
        department?: { name?: string }
        job_title?: string
      }
    }
  }
  leave_category_data?: {
    name?: string
    total_entitled_days?: number
  }
}

const props = defineProps<{
  open: boolean
  row: BalanceDetail | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

const { session } = useAuthSession()
const toast = useToast()

const leaveBalanceData = ref<BalanceDetail | null>(null)
const editRemainingDays = ref(false)
const availableDays = ref(0)
const adjustmentReason = ref('')
const reasonError = ref('')
const errorMessage = ref('')
const updating = ref(false)

watch(
  () => [props.open, props.row] as const,
  ([open, row]) => {
    if (open && row) {
      leaveBalanceData.value = { ...row }
      availableDays.value = Number(row.available_balance ?? 0)
      editRemainingDays.value = false
      adjustmentReason.value = ''
      reasonError.value = ''
      errorMessage.value = ''
    }
  },
  { immediate: true },
)

const userId = computed(() => String((session.value.user as { id?: string | number } | undefined)?.id ?? ''))

const isApprover = computed(() => {
  const reports = leaveBalanceData.value?.employee_data?.reports_to
  if (!Array.isArray(reports) || !userId.value) {
    return false
  }
  return reports.some(r => String(r.id) === userId.value)
})

const ifEdited = computed(
  () => Number(availableDays.value) !== Number(leaveBalanceData.value?.available_balance ?? 0),
)

const canSubmitUpdate = computed(
  () => ifEdited.value && !errorMessage.value && adjustmentReason.value.trim().length > 0,
)

watch(availableDays, (v) => {
  if (v < 0) {
    errorMessage.value = 'Days remaining cannot be less than 0'
  }
  else {
    errorMessage.value = ''
  }
})

watch(adjustmentReason, (v) => {
  if (v?.trim()) {
    reasonError.value = ''
  }
})

const modalTitle = computed(() => {
  const d = leaveBalanceData.value
  if (!d) {
    return 'Leave balance'
  }
  return `${d.employee_data?.full_name || ''} — ${d.leave_category_data?.name || ''}`
})

function cancelEdit() {
  editRemainingDays.value = false
  availableDays.value = Number(leaveBalanceData.value?.available_balance ?? 0)
  adjustmentReason.value = ''
  reasonError.value = ''
  errorMessage.value = ''
}

async function saveBalance() {
  if (!adjustmentReason.value.trim()) {
    reasonError.value = 'Reason is required'
    return
  }
  const id = leaveBalanceData.value?.id
  if (!id) {
    return
  }
  updating.value = true
  try {
    const res = await timeOffService.updateLeaveBalances(
      String(id),
      {
        handler: '$fetch',
        method: 'PATCH',
        body: {
          available_balance: availableDays.value,
          reason: adjustmentReason.value.trim(),
        },
      },
    ) as BalanceDetail & { id?: string }
    if (res?.id) {
      leaveBalanceData.value = res as BalanceDetail
      availableDays.value = Number(res.available_balance ?? 0)
      adjustmentReason.value = ''
      reasonError.value = ''
      editRemainingDays.value = false
      toast.add({ title: 'Leave balance updated', color: 'success' })
      emit('success')
      isOpen.value = false
    }
  }
  catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    updating.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <div v-if="leaveBalanceData" class="space-y-5">
        <div class="flex items-start gap-3">
          <UAvatar
            size="lg"
            :alt="leaveBalanceData.employee_data?.full_name || 'Employee'"
          />
          <div class="min-w-0 flex-1 text-sm">
            <p class="font-semibold">
              {{ leaveBalanceData.employee_data?.full_name || '—' }}
            </p>
            <p class="text-muted">
              {{ leaveBalanceData.leave_category_data?.name || '—' }}
            </p>
            <p class="mt-1 text-muted">
              {{ leaveBalanceData.employee_data?.current_job_data?.position?.department?.name || '—' }}
              <span class="mx-1">·</span>
              {{ leaveBalanceData.employee_data?.current_job_data?.position?.job_title || '—' }}
            </p>
          </div>
        </div>

        <div class="rounded-lg border border-default p-4 space-y-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-muted">
              Entitled days
            </p>
            <p class="text-xl font-semibold">
              {{ leaveBalanceData.leave_category_data?.total_entitled_days ?? '—' }}
            </p>
          </div>
          <div class="border-t border-default pt-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-muted">
                  Available days
                </p>
                <p v-if="!editRemainingDays" class="text-xl font-semibold">
                  {{ availableDays }}
                </p>
              </div>
              <UButton
                v-if="!isApprover && !editRemainingDays"
                size="sm"
                variant="outline"
                icon="i-lucide-pencil"
                label="Edit balance"
                @click="editRemainingDays = true"
              />
            </div>

            <div v-if="editRemainingDays" class="mt-4 space-y-3">
              <UFormField label="New balance">
                <UInput v-model.number="availableDays" type="number" min="0" class="w-full" />
                <p v-if="errorMessage" class="mt-1 text-sm text-error">
                  {{ errorMessage }}
                </p>
              </UFormField>
              <UFormField label="Reason" required>
                <UTextarea
                  v-model="adjustmentReason"
                  :rows="3"
                  placeholder="Why are you updating this balance?"
                  class="w-full"
                />
                <p v-if="reasonError" class="mt-1 text-sm text-error">
                  {{ reasonError }}
                </p>
              </UFormField>
              <div class="flex justify-end gap-2">
                <UButton color="neutral" variant="ghost" label="Cancel" @click="cancelEdit" />
                <UButton
                  :disabled="!canSubmitUpdate"
                  :loading="updating"
                  label="Save changes"
                  @click="() => void saveBalance()"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
