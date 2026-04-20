<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { calendarMonths } from '~/constants/months'
import { timeOffService } from '~~/services/timeoff.service'
import { urlParamsExtensionUtil } from '~/utils/urlParams'
import { parseApiError } from '~/utils/parseApiError'

interface ObservedRow {
  id: string
  name?: string
  day?: number
  month?: number
  day_of_week?: string
  is_observed?: boolean
}

interface LeaveCategoryRow {
  id: string
  name?: string
  enabled?: boolean
  max_days?: number
  total_entitled_days?: number
  carry_over_policy?: boolean
  /** Shown on category cards (legacy TimeOffs.vue parity). */
  max_carried_days?: number
  statutory?: boolean
  leave_calculation_method?: string
  accrual_frequency?: string
  max_negative_balance?: number
}

const toast = useToast()
const USwitch = resolveComponent('USwitch')

const leaveCategories = ref<LeaveCategoryRow[]>([])
const loadingCategories = ref(false)

const nonWorkDays = ref<ObservedRow[]>([])
const loadingNonWork = ref(false)

const customNonWorkDays = ref<ObservedRow[]>([])
const loadingCustomNonWork = ref(false)

const holidays = ref<ObservedRow[]>([])
const loadingHolidays = ref(false)

const ccRow = ref<{ id?: string, enabled?: boolean, default_emails?: string[] } | null>(null)
const ccForm = reactive({
  enabled: false,
  default_emails: '',
})
const savingCc = ref(false)

const tabItems = [
  { label: 'Non-working days', value: 'non' },
  { label: 'Custom non-working days', value: 'custom' },
  { label: 'Public holidays', value: 'holidays' },
  { label: 'CC settings', value: 'cc' },
]
const selectedTab = ref('non')

const manageCategoryOpen = ref(false)
const manageCategoryType = ref<'add' | 'edit'>('add')
const categoryToEdit = ref<Record<string, unknown> | undefined>(undefined)

const nonWorkModalOpen = ref(false)
const holidayModalOpen = ref(false)

const deleteOpen = ref(false)
const categoryToDelete = ref<LeaveCategoryRow | null>(null)
const deleting = ref(false)

function monthLabel(month?: number) {
  if (!month) {
    return '—'
  }
  return calendarMonths.find(m => m.value === month)?.label ?? String(month)
}

async function loadLeaveCategories() {
  loadingCategories.value = true
  try {
    const res = await timeOffService.getLeaveCategories({
      handler: '$fetch',
      query: { gender_specific: 'false' },
    }) as Record<string, unknown>
    const list = (res?.results as LeaveCategoryRow[]) ?? (Array.isArray(res) ? res as LeaveCategoryRow[] : [])
    leaveCategories.value = Array.isArray(list) ? list : []
  }
  catch (error: unknown) {
    toast.add({
      title: 'Unable to load leave categories',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
    leaveCategories.value = []
  }
  finally {
    loadingCategories.value = false
  }
}

async function loadNonWorkDays() {
  loadingNonWork.value = true
  try {
    const res = await timeOffService.getCompanyNonWorkDays({
      handler: '$fetch',
    }) as ObservedRow[] | { results?: ObservedRow[] }
    const list = Array.isArray(res) ? res : (res?.results ?? [])
    nonWorkDays.value = list
  }
  catch {
    nonWorkDays.value = []
  }
  finally {
    loadingNonWork.value = false
  }
}

async function loadCustomNonWorkDays() {
  loadingCustomNonWork.value = true
  try {
    const q = urlParamsExtensionUtil({ custom: true })
    const res = await timeOffService.getCustomCompanyNonWorkDays(q, {
      handler: '$fetch',
    }) as ObservedRow[] | { results?: ObservedRow[] }
    const list = Array.isArray(res) ? res : (res?.results ?? [])
    customNonWorkDays.value = list
  }
  catch {
    customNonWorkDays.value = []
  }
  finally {
    loadingCustomNonWork.value = false
  }
}

async function loadHolidays() {
  loadingHolidays.value = true
  try {
    const res = await timeOffService.getCompanyHoliday({
      handler: '$fetch',
    }) as ObservedRow[] | { results?: ObservedRow[] }
    const list = Array.isArray(res) ? res : (res?.results ?? [])
    holidays.value = list
  }
  catch {
    holidays.value = []
  }
  finally {
    loadingHolidays.value = false
  }
}

async function loadCcSettings() {
  try {
    const res = await timeOffService.getCCSettings({
      handler: '$fetch',
    }) as Record<string, unknown> | Record<string, unknown>[]
    const row = Array.isArray(res)
      ? (res[0] as Record<string, unknown>)
      : ((res?.results as Record<string, unknown>[] | undefined)?.[0] ?? res)
    ccRow.value = row as { id?: string, enabled?: boolean, default_emails?: string[] }
    ccForm.enabled = Boolean(ccRow.value?.enabled)
    ccForm.default_emails = Array.isArray(ccRow.value?.default_emails)
      ? ccRow.value!.default_emails!.join(', ')
      : ''
  }
  catch {
    ccRow.value = null
  }
}

async function refreshAll() {
  await Promise.all([
    loadLeaveCategories(),
    loadNonWorkDays(),
    loadCustomNonWorkDays(),
    loadHolidays(),
    loadCcSettings(),
  ])
}

onMounted(() => {
  void refreshAll()
})

async function toggleCategory(row: LeaveCategoryRow, enabled: boolean) {
  try {
    await timeOffService.changeLeaveCategoryStatus(String(row.id), enabled)
    row.enabled = enabled
    toast.add({ title: 'Leave category updated', color: 'success' })
  }
  catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
}

function openAddCategory() {
  manageCategoryType.value = 'add'
  categoryToEdit.value = undefined
  manageCategoryOpen.value = true
}

function openEditCategory(row: LeaveCategoryRow) {
  manageCategoryType.value = 'edit'
  categoryToEdit.value = { ...row } as Record<string, unknown>
  manageCategoryOpen.value = true
}

function askDeleteCategory(row: LeaveCategoryRow) {
  categoryToDelete.value = row
  deleteOpen.value = true
}

async function confirmDeleteCategory() {
  const row = categoryToDelete.value
  if (!row) {
    return
  }
  deleting.value = true
  try {
    await timeOffService.deleteLeaveCategory(String(row.id))
    toast.add({ title: 'Leave category deleted', color: 'success' })
    deleteOpen.value = false
    categoryToDelete.value = null
    await loadLeaveCategories()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Delete failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    deleting.value = false
  }
}

async function patchObservedRow(row: ObservedRow, endpoint: 'nonwork' | 'holiday') {
  const next = Boolean(row.is_observed)
  const prev = !next
  try {
    if (endpoint === 'holiday') {
      await timeOffService.updateCompanyHoliday(String(row.id), {
        handler: '$fetch',
        method: 'PATCH',
        body: { is_observed: row.is_observed },
      })
    }
    else {
      await timeOffService.updateCompanyNonWorkDays(String(row.id), {
        handler: '$fetch',
        method: 'PATCH',
        body: { is_observed: row.is_observed },
      })
    }
    toast.add({ title: 'Updated', color: 'success' })
  }
  catch (error: unknown) {
    row.is_observed = prev
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
}

const workdayColumns: TableColumn<ObservedRow>[] = [
  { accessorKey: 'day_of_week', header: 'Day' },
  {
    accessorKey: 'is_observed',
    header: 'Observed',
    cell: ({ row }) =>
      h(USwitch, {
        modelValue: Boolean(row.original.is_observed),
        'onUpdate:modelValue': (v: boolean) => {
          row.original.is_observed = v
          void patchObservedRow(row.original, 'nonwork')
        },
      }),
  },
]

const customColumns: TableColumn<ObservedRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'month',
    header: 'Month',
    cell: ({ row }) => monthLabel(row.original.month),
  },
  {
    accessorKey: 'is_observed',
    header: 'Observed',
    cell: ({ row }) =>
      h(USwitch, {
        modelValue: Boolean(row.original.is_observed),
        'onUpdate:modelValue': (v: boolean) => {
          row.original.is_observed = v
          void patchObservedRow(row.original, 'nonwork')
        },
      }),
  },
]

const holidayColumns: TableColumn<ObservedRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'day', header: 'Day' },
  {
    accessorKey: 'month',
    header: 'Month',
    cell: ({ row }) => monthLabel(row.original.month),
  },
  {
    accessorKey: 'is_observed',
    header: 'Observed',
    cell: ({ row }) =>
      h(USwitch, {
        modelValue: Boolean(row.original.is_observed),
        'onUpdate:modelValue': (v: boolean) => {
          row.original.is_observed = v
          void patchObservedRow(row.original, 'holiday')
        },
      }),
  },
]

async function saveCcSettings() {
  if (!ccRow.value?.id) {
    toast.add({ title: 'CC settings are not available yet', color: 'warning' })
    return
  }
  savingCc.value = true
  try {
    const default_emails = ccForm.default_emails
      ? ccForm.default_emails.split(',').map(e => e.trim()).filter(Boolean)
      : []
    await timeOffService.patchCCSettingsById(String(ccRow.value.id), {
      handler: '$fetch',
      method: 'PATCH',
      body: {
        enabled: ccForm.enabled,
        default_emails,
      },
    })
    toast.add({ title: 'CC settings saved', color: 'success' })
    await loadCcSettings()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Save failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    savingCc.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <TimeOffLeaveYearSettings />

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-lg font-semibold">
        Manage leave categories
      </h2>
      <UButton
        icon="i-lucide-plus"
        label="Add custom category"
        @click="openAddCategory"
      />
    </div>

    <div v-if="loadingCategories" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
    </div>
    <div v-else class="flex flex-wrap gap-3">
      <UCard
        v-for="category in leaveCategories"
        :key="category.id"
        class="min-w-[260px] max-w-md flex-1 ring ring-default"
      >
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-base font-medium">
            {{ category.name }}
          </h3>
          <div class="flex items-center gap-2 text-sm text-muted">
            <span>{{ category.enabled ? 'Enabled' : 'Disabled' }}</span>
            <USwitch
              :model-value="Boolean(category.enabled)"
              @update:model-value="(v: boolean) => void toggleCategory(category, v)"
            />
          </div>
        </div>
        <dl class="mt-3 space-y-2 text-sm">
          <div class="flex gap-2">
            <dt class="text-muted">
              Max. days
            </dt>
            <dd class="font-medium">
              {{ category.max_days ?? '—' }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-muted">
              Total entitled
            </dt>
            <dd class="font-medium">
              {{ category.total_entitled_days ?? '—' }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-muted">
              Carry over
            </dt>
            <dd>
              <UBadge :color="category.carry_over_policy ? 'success' : 'error'" variant="subtle">
                {{ category.carry_over_policy ? 'Yes' : 'No' }}
              </UBadge>
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-muted">
              Max carry days
            </dt>
            <dd class="font-medium">
              {{ category.max_carried_days ?? '—' }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-muted">
              Statutory
            </dt>
            <dd>
              <UBadge :color="category.statutory ? 'success' : 'error'" variant="subtle">
                {{ category.statutory ? 'Yes' : 'No' }}
              </UBadge>
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-muted">
              Calculation
            </dt>
            <dd class="font-medium">
              {{ category.leave_calculation_method === 'WD' ? 'Working days' : 'Calendar days' }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-muted">
              Accrual
            </dt>
            <dd class="font-medium">
              {{ category.accrual_frequency ?? '—' }}
            </dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-muted">
              Max −ve balance
            </dt>
            <dd class="font-medium">
              {{ category.max_negative_balance ?? 0 }}
            </dd>
          </div>
        </dl>
        <div class="mt-4 flex justify-end gap-1">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            square
            @click="openEditCategory(category)"
          />
          <UButton
            v-if="!category.statutory"
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            square
            @click="askDeleteCategory(category)"
          />
        </div>
      </UCard>
    </div>

    <div>
      <UTabs
        v-model="selectedTab"
        :items="tabItems"
        :content="false"
        class="w-full"
      />

      <div v-show="selectedTab === 'non'" class="mt-4">
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">
              Non-working days
            </h3>
          </template>
          <UTable
            :data="nonWorkDays"
            :columns="workdayColumns"
            :loading="loadingNonWork"
            class="w-full"
          />
        </UCard>
      </div>

      <div v-show="selectedTab === 'custom'" class="mt-4">
        <UCard>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-base font-semibold">
                Custom non-working days
              </h3>
              <UButton
                icon="i-lucide-plus"
                label="Add non-working day"
                size="sm"
                @click="nonWorkModalOpen = true"
              />
            </div>
          </template>
          <UTable
            :data="customNonWorkDays"
            :columns="customColumns"
            :loading="loadingCustomNonWork"
            class="w-full"
          />
        </UCard>
      </div>

      <div v-show="selectedTab === 'holidays'" class="mt-4">
        <UCard>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-base font-semibold">
                Public holidays
              </h3>
              <UButton
                icon="i-lucide-plus"
                label="Add holiday"
                size="sm"
                @click="holidayModalOpen = true"
              />
            </div>
          </template>
          <UTable
            :data="holidays"
            :columns="holidayColumns"
            :loading="loadingHolidays"
            class="w-full"
          />
        </UCard>
      </div>

      <div v-show="selectedTab === 'cc'" class="mt-4">
        <UCard>
          <template #header>
            <div>
              <h3 class="text-base font-semibold">
                CC settings
              </h3>
              <p class="mt-1 text-sm text-muted">
                Send copies of leave approval messages to additional recipients.
              </p>
            </div>
          </template>
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-sm font-medium">
                  Enable CC emails
                </p>
                <p class="text-sm text-muted">
                  When enabled, listed addresses receive approval notifications.
                </p>
              </div>
              <USwitch v-model="ccForm.enabled" />
            </div>
            <UFormField
              v-if="ccForm.enabled"
              label="Default CC emails"
              hint="Comma-separated list."
            >
              <UTextarea v-model="ccForm.default_emails" :rows="3" class="w-full" />
            </UFormField>
            <div class="flex justify-end border-t border-default pt-4">
              <UButton
                icon="i-lucide-check"
                label="Save CC settings"
                :loading="savingCc"
                @click="() => void saveCcSettings()"
              />
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <TimeOffManageLeaveCategoryModal
      v-model:open="manageCategoryOpen"
      :manage-type="manageCategoryType"
      :data-to-edit="categoryToEdit"
      @success="() => void loadLeaveCategories()"
      @refresh-employees="() => void loadLeaveCategories()"
    />

    <TimeOffManageNonWorkingDayModal
      v-model:open="nonWorkModalOpen"
      @success="() => void loadCustomNonWorkDays()"
    />

    <TimeOffManageHolidayModal
      v-model:open="holidayModalOpen"
      @success="() => void loadHolidays()"
    />

    <UModal
      v-model:open="deleteOpen"
      title="Delete leave category?"
      :description="categoryToDelete
        ? `This will remove “${categoryToDelete.name}”. This cannot be undone.`
        : undefined"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancel"
            :disabled="deleting"
            @click="deleteOpen = false"
          />
          <UButton
            color="error"
            label="Delete"
            :loading="deleting"
            @click="() => void confirmDeleteCategory()"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
