<script setup lang="ts">
import { unref } from 'vue'
import { employeeService } from '~~/services/employee.service'
import { authService } from '~/services/auth.service'
import { useAuthStore } from '~/stores/auth'
import { ROUTE_LIST } from '~/constants/routeList'
import { parseApiError } from '~/utils/parseApiError'

definePageMeta({
  layout: 'default'
})

const toast = useToast()
const authStore = useAuthStore()

const importFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const processingImport = ref(false)
const importJobId = ref<string | null>(null)
const importJobStatus = ref<'idle' | 'queued' | 'processing' | 'completed' | 'failed'>('idle')
const importProgress = reactive({
  totalRows: 0,
  processedRows: 0
})
const importSummary = reactive({
  successfulImports: 0,
  failedRows: 0,
  failedErrorsTotal: 0,
  nonRowErrors: 0
})
let importStatusTimer: ReturnType<typeof setInterval> | null = null
const importJobStorageKey = 'kq:employees:import:active-job-id'

function persistImportJobId(jobId: string | null) {
  if (!import.meta.client) return
  if (jobId) {
    localStorage.setItem(importJobStorageKey, jobId)
    return
  }
  localStorage.removeItem(importJobStorageKey)
}

function getPersistedImportJobId(): string | null {
  if (!import.meta.client) return null
  return localStorage.getItem(importJobStorageKey)
}

const importErrors = ref<string[]>([])

function normalizeImportErrors(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.flatMap(item => normalizeImportErrors(item))
  }
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, unknown>).flatMap(item => normalizeImportErrors(item))
  }
  if (raw == null) return []
  const message = String(raw).trim()
  return message ? [message] : []
}

function extractApiPayload(response: unknown): Record<string, unknown> {
  if (!response || typeof response !== 'object') return {}
  const r = response as Record<string, unknown>
  if (r.data && typeof r.data === 'object') {
    return r.data as Record<string, unknown>
  }
  return r
}

function stopImportStatusPolling() {
  if (importStatusTimer) {
    clearInterval(importStatusTimer)
    importStatusTimer = null
  }
  processingImport.value = false
}

async function pollImportStatus() {
  if (!importJobId.value) return
  try {
    const response: unknown = await employeeService.getImportJobStatus(importJobId.value, {
      handler: '$fetch',
      secured: true
    })
    const payload = extractApiPayload(response)
    importJobStatus.value = (String(payload.status || 'processing')) as typeof importJobStatus.value
    importProgress.totalRows = Number(payload.total_rows || 0)
    importProgress.processedRows = Number(payload.processed_rows || 0)
    importErrors.value = normalizeImportErrors(payload.errors)
    const summary = (payload.summary || {}) as Record<string, unknown>
    importSummary.successfulImports = Number(summary.successful_imports || 0)
    importSummary.failedRows = Number(summary.failed_rows || 0)
    importSummary.failedErrorsTotal = Number(summary.failed_errors_total || 0)
    importSummary.nonRowErrors = Number(summary.non_row_errors || 0)

    if (importJobStatus.value === 'completed') {
      stopImportStatusPolling()
      persistImportJobId(null)
      toast.add({
        title: `${importSummary.successfulImports} employee(s) imported`,
        color: 'success'
      })
      importJobId.value = null
      resetImportFile()
    }
    if (importJobStatus.value === 'failed') {
      stopImportStatusPolling()
      persistImportJobId(null)
      toast.add({
        title: importSummary.failedRows > 0
          ? `${importSummary.failedRows} row(s) failed validation`
          : 'Import failed',
        color: 'error'
      })
    }
  } catch {
    stopImportStatusPolling()
    toast.add({ title: 'Import status unavailable', color: 'error' })
  }
}

function startImportStatusPolling(jobId: string) {
  stopImportStatusPolling()
  importJobId.value = jobId
  persistImportJobId(jobId)
  importJobStatus.value = 'queued'
  processingImport.value = true
  importStatusTimer = setInterval(() => {
    void pollImportStatus()
  }, 2000)
  void pollImportStatus()
}

function countRowsFromCsv(content: string) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0)
  return Math.max(lines.length - 1, 0)
}

const requiredEmployeeCredits = ref(0)
const excelRowUnknown = ref(false)

async function calculateRequiredEmployeeCredits(file: File) {
  requiredEmployeeCredits.value = 0
  excelRowUnknown.value = false
  try {
    if (file.name.toLowerCase().endsWith('.csv')) {
      const csvContent = await file.text()
      requiredEmployeeCredits.value = countRowsFromCsv(csvContent)
      return
    }
    if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
      excelRowUnknown.value = true
      requiredEmployeeCredits.value = 0
      return
    }
    requiredEmployeeCredits.value = 0
  } catch {
    toast.add({ title: 'Unable to read selected file', color: 'error' })
  }
}

function resetImportFile() {
  importFile.value = null
  requiredEmployeeCredits.value = 0
  excelRowUnknown.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function importEmployees() {
  importErrors.value = []
  if (!importFile.value) return
  if (isOverImportCreditLimit.value) {
    toast.add({
      title: `Insufficient employee credits (${creditShortfall.value} short)`,
      color: 'error'
    })
    return
  }

  const formData = new FormData()
  formData.append('file', importFile.value)

  loading.value = true
  importJobStatus.value = 'idle'
  importSummary.successfulImports = 0
  importSummary.failedRows = 0
  importSummary.failedErrorsTotal = 0
  importSummary.nonRowErrors = 0
  importProgress.totalRows = 0
  importProgress.processedRows = 0

  try {
    const response: unknown = await employeeService.upload({
      handler: '$fetch',
      secured: true,
      body: formData,
      timeout: 180000
    })
    const payload = extractApiPayload(response)
    const jobId = payload?.job_id
    if (!jobId) {
      importErrors.value = ['Import job was not created. Please try again.']
      toast.add({ title: 'Error uploading file', color: 'error' })
      return
    }
    toast.add({ title: 'Import started in background', color: 'success' })
    startImportStatusPolling(String(jobId))
  } catch (error: unknown) {
    importErrors.value = [parseApiError(error, 'Upload failed.')]
    toast.add({ title: 'Upload failed', color: 'error' })
    resetImportFile()
  } finally {
    loading.value = false
  }
}

function updateImportFile(e: Event) {
  const t = e.target as HTMLInputElement
  importErrors.value = []
  importFile.value = t.files?.[0] ?? null
  if (importFile.value) {
    void calculateRequiredEmployeeCredits(importFile.value)
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const f = e.dataTransfer?.files?.[0]
  importFile.value = f ?? null
  if (importFile.value) {
    void calculateRequiredEmployeeCredits(importFile.value)
  }
}

const remainingEmployeeCredits = computed(() => {
  const sub = unref(authStore.currentSubscription) as Record<string, unknown> | undefined
  const credit = sub?.add_employee_credit
  return typeof credit === 'number' ? credit : null
})

const isOverImportCreditLimit = computed(() => {
  if (!importFile.value || remainingEmployeeCredits.value == null) {
    return false
  }
  if (excelRowUnknown.value) return false
  return requiredEmployeeCredits.value > remainingEmployeeCredits.value
})

const creditShortfall = computed(() => {
  if (!isOverImportCreditLimit.value || remainingEmployeeCredits.value == null) {
    return 0
  }
  return Math.max(requiredEmployeeCredits.value - remainingEmployeeCredits.value, 0)
})

const showCreditUpgradeAlert = computed(() => unref(authStore.isEmployeeLimitReached) || isOverImportCreditLimit.value)

const creditAlertMessage = computed(() => {
  if (unref(authStore.isEmployeeLimitReached)) {
    return 'Maximum employee limit reached. Upgrade your plan to add more.'
  }
  return `This file has ${requiredEmployeeCredits.value} data row(s) but your plan has ${remainingEmployeeCredits.value} credit(s) left.`
})

onMounted(async () => {
  try {
    await authService.fetchAuthUser({ handler: '$fetch', secured: true })
  } catch {
    /* ignore */
  }
  const persistedJobId = getPersistedImportJobId()
  if (persistedJobId) {
    startImportStatusPolling(persistedJobId)
  }
})

onBeforeUnmount(() => {
  stopImportStatusPolling()
})

useSeoMeta({
  title: 'Import employees'
})
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-6">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-semibold">
        Import employees
      </h1>
      <UButton
        :to="ROUTE_LIST.employees.index"
        variant="ghost"
        color="neutral"
        label="Back"
      />
    </div>

    <UAlert
      v-if="showCreditUpgradeAlert"
      color="warning"
      variant="soft"
      :title="creditAlertMessage"
    >
      <template #actions>
        <UButton size="sm" :to="ROUTE_LIST.settings.billing" label="Billing" />
      </template>
    </UAlert>

    <UAlert
      v-if="excelRowUnknown && importFile"
      color="info"
      variant="subtle"
      title="Excel file selected"
    >
      Row counts are estimated only for CSV. Credit checks are skipped for Excel until the import job reports totals.
    </UAlert>

    <UCard>
      <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-muted">
          Upload a CSV or Excel file using the official column template.
        </p>
        <UButton
          to="/templates/KaziQuest Employees Import Template.xlsx"
          external
          download
          icon="i-lucide-download"
          label="Template"
          size="sm"
          variant="outline"
        />
      </div>

      <div
        class="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-default p-6 text-center"
        @dragover="handleDragOver"
        @drop="handleDrop"
        @click="fileInputRef?.click()"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".csv,.xlsx,.xls"
          class="hidden"
          @change="updateImportFile"
        >
        <UIcon name="i-lucide-upload-cloud" class="mb-2 size-8 text-muted" />
        <p class="text-sm font-medium">
          Drop a file here or click to browse
        </p>
        <p v-if="importFile" class="mt-2 text-xs text-muted">
          {{ importFile.name }}
          <span v-if="!excelRowUnknown"> — {{ requiredEmployeeCredits }} row(s)</span>
        </p>
      </div>

      <div v-if="processingImport" class="mt-4 space-y-2 text-sm">
        <p>Status: {{ importJobStatus }}</p>
        <p v-if="importProgress.totalRows">
          Progress: {{ importProgress.processedRows }} / {{ importProgress.totalRows }}
        </p>
      </div>

      <UAlert
        v-if="importErrors.length"
        color="error"
        variant="soft"
        class="mt-4"
        title="Import errors"
      >
        <ul class="mt-2 list-inside list-disc text-sm">
          <li v-for="(err, i) in importErrors" :key="i">
            {{ err }}
          </li>
        </ul>
      </UAlert>

      <div class="mt-4 flex justify-end">
        <UButton
          label="Start import"
          :disabled="!importFile || loading || processingImport"
          :loading="loading"
          @click="() => void importEmployees()"
        />
      </div>
    </UCard>
  </div>
</template>
