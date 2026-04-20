<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import * as z from 'zod'
import { employeeService } from '~~/services/employee.service'
import { ROUTE_LIST } from '~/constants/routeList'
import { parseApiError } from '~/utils/parseApiError'
import { urlParamsExtensionUtil } from '~/utils/urlParams'

definePageMeta({
  layout: 'default'
})

interface DisciplinaryActionRow {
  id?: string
  action?: string
  action_date?: string
  comments?: string
  action_documents?: Array<{ name?: string, file?: string }>
}

interface EmployeeOption {
  label: string
  value: string
}

const route = useRoute()
const toast = useToast()
const { isBaseLevelEmployee } = useRolePermissionGuard()
const UButton = resolveComponent('UButton')
const NuxtTime = resolveComponent('NuxtTime')

const employeeUuid = computed(() => String(route.params.uuid ?? ''))
const caseNumber = computed(() => String(route.params.number ?? ''))
const backTo = computed(() => ROUTE_LIST.employees.detail.replace(':uuid', employeeUuid.value))

const disciplinaryStatusItems = [
  { label: 'Under Review', value: 'under_review', color: 'info' },
  { label: 'Awaiting Employee Response', value: 'awaiting_employee_response', color: 'warning' },
  { label: 'Hearing Scheduled', value: 'hearing_scheduled', color: 'secondary' },
  { label: 'Hearing Completed', value: 'hearing_completed', color: 'secondary' },
  { label: 'Action Taken', value: 'action_taken', color: 'warning' },
  { label: 'Appeal Requested', value: 'appeal_requested', color: 'secondary' },
  { label: 'Appeal Under Review', value: 'appeal_under_review', color: 'error' },
  { label: 'Resolved', value: 'resolved', color: 'success' },
  { label: 'Dismissed', value: 'dismissed', color: 'neutral' }
]

const actionSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  action_date: z.string().min(1, 'Action date is required'),
  action_taken_by: z.string().min(1, 'Action taken by is required'),
  comments: z.string().optional()
})

type ActionSchema = z.output<typeof actionSchema>

const loading = ref(true)
const disciplinary = ref<Record<string, unknown> | null>(null)
const actions = ref<DisciplinaryActionRow[]>([])
const statusUpdating = ref(false)
const selectedStatus = ref('')
const employeesLoading = ref(false)
const employeeOptions = ref<EmployeeOption[]>([])
const actionModalOpen = ref(false)
const actionSaving = ref(false)
const selectedActionFile = ref<FileList | null>(null)
const viewDocOpen = ref(false)
const viewingPdf = ref(true)
const viewDocTitle = ref('')
const viewDocUrl = ref('')
const viewDocLoading = ref(false)

const actionState = reactive<ActionSchema>({
  action: '',
  action_date: '',
  action_taken_by: '',
  comments: ''
})

function unwrapList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) {
    return res as Record<string, unknown>[]
  }
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>
    if (Array.isArray(r.results)) {
      return r.results as Record<string, unknown>[]
    }
    if (r.data && typeof r.data === 'object' && Array.isArray((r.data as { results?: unknown[] }).results)) {
      return ((r.data as { results: unknown[] }).results as Record<string, unknown>[])
    }
  }
  return []
}

function extractFileNameAndExtension(docURL: string) {
  const cleanURL = docURL.split('?')[0] || ''
  const fileNameWithExtension = cleanURL.split('/').pop() || ''
  const fileParts = fileNameWithExtension.split('.')
  const fileExtension = fileParts.pop()?.toLowerCase() || ''
  const fileName = fileParts.join('.')
  return { fileName, fileExtension }
}

function extractCleanS3Path(url: string): string {
  try {
    const parsedUrl = new URL(url)
    const cleanPath = parsedUrl.pathname.startsWith('/') ? parsedUrl.pathname.slice(1) : parsedUrl.pathname
    const pathParts = cleanPath.split('/')
    const bucketPrefixes = ['kaziquest-test', 'kaziquest', 'kaziquest-backend', 'media']
    const startIndex = pathParts.findIndex(part => !bucketPrefixes.includes(part))
    return startIndex !== -1 ? pathParts.slice(startIndex).join('/') : cleanPath
  } catch {
    return ''
  }
}

async function loadEmployees() {
  employeesLoading.value = true
  try {
    const res = await employeeService.getEmployees({
      handler: '$fetch',
      secured: true,
      query: {
        page: 1,
        page_size: 500,
        paginate: 'false',
        stats: 'false'
      }
    })
    employeeOptions.value = unwrapList(res).map((item) => {
      const user = item.user as { id?: string, full_name?: string } | undefined
      return {
        label: user?.full_name || String(item.full_name || 'Employee'),
        value: String(user?.id || item.id || '')
      }
    }).filter(item => item.value)
  } catch {
    employeeOptions.value = []
  } finally {
    employeesLoading.value = false
  }
}

async function loadActions(caseId: string) {
  try {
    const q = urlParamsExtensionUtil({ case_id: caseId })
    const res = await employeeService.getDisciplinaryActions(q || `?case_id=${encodeURIComponent(caseId)}`, {
      handler: '$fetch',
      secured: true
    })
    actions.value = unwrapList(res) as DisciplinaryActionRow[]
  } catch {
    actions.value = []
  }
}

async function loadCase() {
  if (!caseNumber.value) {
    return
  }
  loading.value = true
  try {
    const q = urlParamsExtensionUtil({ case_number: caseNumber.value })
    const res = await employeeService.getOneDisciplinary(q || `?case_number=${encodeURIComponent(caseNumber.value)}`, {
      handler: '$fetch',
      secured: true
    })
    const list = unwrapList(res)
    disciplinary.value = list.find(c => String(c.case_number) === caseNumber.value) ?? list[0] ?? null
    selectedStatus.value = String(disciplinary.value?.status || '')
    if (disciplinary.value?.id) {
      await Promise.all([loadActions(String(disciplinary.value.id)), loadEmployees()])
    } else {
      actions.value = []
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Unable to load case',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
    disciplinary.value = null
  } finally {
    loading.value = false
  }
}

watch([employeeUuid, caseNumber], () => void loadCase(), { immediate: true })

async function updateStatus() {
  if (!disciplinary.value?.id || !selectedStatus.value || selectedStatus.value === disciplinary.value.status) {
    return
  }
  statusUpdating.value = true
  try {
    await employeeService.changeStatus(String(disciplinary.value.id), {
      handler: '$fetch',
      secured: true,
      body: { status: selectedStatus.value }
    })
    toast.add({ title: 'Case status updated', color: 'success' })
    await loadCase()
  } catch (error: unknown) {
    toast.add({
      title: 'Status update failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    statusUpdating.value = false
  }
}

function openActionModal() {
  actionState.action = ''
  actionState.action_date = ''
  actionState.action_taken_by = ''
  actionState.comments = ''
  selectedActionFile.value = null
  actionModalOpen.value = true
}

function onActionFilesChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedActionFile.value = target.files
}

async function submitAction(_event: FormSubmitEvent<ActionSchema>) {
  if (!disciplinary.value?.id) {
    return
  }
  actionSaving.value = true
  try {
    const formData = new FormData()
    formData.append('disciplinary_case', String(disciplinary.value.id))
    formData.append('action', actionState.action)
    formData.append('action_date', actionState.action_date)
    formData.append('action_taken_by', actionState.action_taken_by)
    formData.append('comments', actionState.comments || '')
    if (selectedActionFile.value?.length) {
      for (const file of Array.from(selectedActionFile.value)) {
        formData.append('files', file)
      }
    }
    await employeeService.addDisciplinaryAction({
      handler: '$fetch',
      secured: true,
      body: formData
    })
    toast.add({ title: 'Action added', color: 'success' })
    actionModalOpen.value = false
    await loadCase()
  } catch (error: unknown) {
    toast.add({
      title: 'Unable to add action',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    actionSaving.value = false
  }
}

async function openDocument(url: string) {
  if (!url) {
    return
  }
  const { fileName, fileExtension } = extractFileNameAndExtension(url)
  viewDocTitle.value = fileName ? `${fileName}.${fileExtension}` : 'Attachment'
  viewingPdf.value = fileExtension === 'pdf'
  viewDocOpen.value = true
  if (!viewingPdf.value) {
    viewDocUrl.value = url
    return
  }
  viewDocLoading.value = true
  try {
    const filePath = extractCleanS3Path(url)
    const res = await employeeService.streamFile({
      handler: '$fetch',
      secured: true,
      body: {
        file_path: filePath,
        model_type: 'EmployeeDocument'
      }
    })
    const blob = new Blob([res], { type: 'application/pdf' })
    viewDocUrl.value = URL.createObjectURL(blob)
  } catch (error: unknown) {
    viewDocOpen.value = false
    toast.add({
      title: 'Unable to open document',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    viewDocLoading.value = false
  }
}

watch(viewDocOpen, (open) => {
  if (!open && viewDocUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(viewDocUrl.value)
    viewDocUrl.value = ''
  }
})

type DisciplinaryBadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

function statusBadgeColor(value: string): DisciplinaryBadgeColor {
  const color = disciplinaryStatusItems.find(item => item.value === value)?.color
  return (color ?? 'neutral') as DisciplinaryBadgeColor
}

const columns: TableColumn<DisciplinaryActionRow>[] = [
  { accessorKey: 'action', header: 'Action' },
  {
    accessorKey: 'action_date',
    header: 'Date',
    cell: ({ row }) => {
      const d = row.original.action_date as string | undefined
      if (!d) {
        return '—'
      }
      return h(NuxtTime, { datetime: d, month: 'short', day: '2-digit', year: 'numeric' })
    }
  },
  { accessorKey: 'comments', header: 'Comments' },
  {
    id: 'documents',
    header: 'Documents',
    cell: ({ row }) => {
      const documents = row.original.action_documents || []
      if (!documents.length) {
        return '—'
      }
      return h('div', { class: 'flex flex-wrap gap-2' }, documents.map((doc, index) =>
        h(UButton, {
          key: `${doc.file}-${index}`,
          size: 'xs',
          variant: 'outline',
          label: doc.name || `File ${index + 1}`,
          onClick: () => void openDocument(String(doc.file || ''))
        })
      ))
    }
  }
]
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-6">
    <UButton
      :to="backTo"
      variant="ghost"
      color="neutral"
      icon="i-lucide-arrow-left"
      label="Back to employee"
    />

    <USkeleton v-if="loading" class="h-40 w-full rounded-lg" />

    <UAlert
      v-else-if="!disciplinary"
      color="warning"
      variant="soft"
      title="Case not found"
    />

    <template v-else>
      <UPageCard
        variant="subtle"
        :title="String(disciplinary.incident_title || disciplinary.title || 'Disciplinary case')"
      >
        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <UBadge variant="soft" color="neutral">
            Case #{{ disciplinary.case_number }}
          </UBadge>
          <UBadge v-if="disciplinary.status" variant="soft" :color="statusBadgeColor(String(disciplinary.status))">
            {{ String(disciplinary.status).replaceAll('_', ' ') }}
          </UBadge>
        </div>
        <p v-if="disciplinary.description" class="mt-4 text-sm">
          {{ disciplinary.description }}
        </p>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div class="rounded-lg border border-default p-3">
            <p class="text-xs uppercase tracking-wide text-muted">
              Case number
            </p>
            <p class="mt-1 font-medium">
              {{ disciplinary.case_number || '—' }}
            </p>
          </div>
          <div class="rounded-lg border border-default p-3">
            <p class="text-xs uppercase tracking-wide text-muted">
              Incident date
            </p>
            <p class="mt-1 font-medium">
              <NuxtTime
                v-if="disciplinary.date_time"
                :datetime="String(disciplinary.date_time)"
                month="short"
                day="2-digit"
                year="numeric"
              />
              <span v-else>—</span>
            </p>
          </div>
        </div>
        <div v-if="!isBaseLevelEmployee" class="mt-4 flex flex-wrap items-end gap-3 border-t border-default pt-4">
          <UFormField label="Case status" class="min-w-64">
            <USelect
              v-model="selectedStatus"
              :items="disciplinaryStatusItems"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </UFormField>
          <UButton label="Update status" :loading="statusUpdating" @click="() => void updateStatus()" />
          <UButton variant="outline" icon="i-lucide-plus" label="Add action" @click="openActionModal" />
        </div>
      </UPageCard>

      <div>
        <div class="mb-2 flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold">
            Actions
          </h2>
        </div>
        <UTable :data="actions" :columns="columns" />
      </div>
    </template>

    <UModal
      v-model:open="actionModalOpen"
      title="Add disciplinary action"
    >
      <UForm
        id="disciplinary-action-form"
        :schema="actionSchema"
        :state="actionState"
        class="space-y-4"
        @submit="submitAction"
      >
        <UFormField label="Action" name="action" required>
          <UInput v-model="actionState.action" class="w-full" />
        </UFormField>
        <UFormField label="Action date" name="action_date" required>
          <UInput v-model="actionState.action_date" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Action taken by" name="action_taken_by" required>
          <USelect
            v-model="actionState.action_taken_by"
            :items="employeeOptions"
            :loading="employeesLoading"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Files">
          <input type="file" class="block w-full text-sm" multiple @change="onActionFilesChange">
        </UFormField>
        <UFormField label="Comments" name="comments">
          <UTextarea v-model="actionState.comments" class="w-full" autoresize />
        </UFormField>
      </UForm>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="actionModalOpen = false" />
          <UButton form="disciplinary-action-form" :loading="actionSaving" label="Save action" type="submit" />
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="viewDocOpen"
      :title="viewDocTitle || 'Attachment'"
      :ui="{ content: 'sm:max-w-5xl' }"
    >
      <div class="min-h-96">
        <div v-if="viewDocLoading" class="flex min-h-96 items-center justify-center">
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>
        <iframe
          v-else-if="viewingPdf && viewDocUrl"
          :src="viewDocUrl"
          class="min-h-[70vh] w-full rounded-md"
        />
        <div v-else class="flex min-h-96 items-center justify-center">
          <UButton :to="viewDocUrl" target="_blank" label="Open attachment" />
        </div>
      </div>
    </UModal>
  </div>
</template>
