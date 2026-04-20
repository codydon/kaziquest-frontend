<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { HiringApplication } from '~/types/hiring'
import { applicationService } from '~~/services/applications.service'
import { smsService } from '~~/services/sms.service'
import { useApplicationsStore } from '~/stores/applications'
import { parseApiError } from '~/utils/parseApiError'
import { applicationRecipientData } from '~/utils/hiring'
import { urlParamsExtensionUtil } from '~/utils/urlParams'

definePageMeta({ layout: 'default' })

const toast = useToast()
const applicationsStore = useApplicationsStore()

const query = reactive({
  page: 1,
  page_size: 10,
  search_str: '',
  appl_status: ''
})

const selectedIds = ref<string[]>([])
const bulkStatus = ref('')
const emailOpen = ref(false)
const smsOpen = ref(false)
const bulkSubject = ref('')
const bulkMessage = ref('')

await applicationsStore.fetchApplicationStatuses()

const { data, pending, refresh } = await useAsyncData(
  'hiring-applicants',
  () => applicationService.getCompanyApplications(urlParamsExtensionUtil({
    page: query.page,
    page_size: query.page_size,
    search_str: query.search_str,
    appl_status: query.appl_status
  })),
  { watch: [() => ({ ...query })] }
)

const pagination = computed(() => (data.value as { results?: HiringApplication[], count?: number } | null) ?? { results: [], count: 0 })
const rows = computed(() => pagination.value.results ?? [])
const selectedRows = computed(() => rows.value.filter(row => row.id && selectedIds.value.includes(row.id)))
const selectedRecipients = computed(() => applicationRecipientData(selectedRows.value))

const columns: TableColumn<HiringApplication>[] = [
  { id: 'select', header: '' },
  { accessorKey: 'job_seeker_name', header: 'Applicant' },
  { accessorKey: 'job_title', header: 'Job' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'status', header: 'Status' }
]

function toggleSelection(id?: string) {
  if (!id) {
    return
  }
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(item => item !== id)
  } else {
    selectedIds.value = [...selectedIds.value, id]
  }
}

async function applyBulkStatus() {
  if (!bulkStatus.value || !selectedIds.value.length) {
    return
  }
  try {
    await applicationsStore.batchStatusUpdate({
      ids: selectedIds.value,
      update_fields: { status: bulkStatus.value }
    })
    toast.add({ title: 'Applicant statuses updated', color: 'success' })
    selectedIds.value = []
    await refresh()
  } catch (error: unknown) {
    toast.add({
      title: 'Could not update statuses',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  }
}

async function sendBulkEmails() {
  try {
    await applicationsStore.batchMailApplicants(
      selectedRecipients.value.map(item => ({
        email: item.email,
        application: item.id
      })),
      bulkSubject.value,
      bulkMessage.value
    )
    toast.add({ title: 'Emails queued successfully', color: 'success' })
    bulkSubject.value = ''
    bulkMessage.value = ''
    emailOpen.value = false
  } catch (error: unknown) {
    toast.add({
      title: 'Could not send email',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  }
}

async function sendBulkSms() {
  try {
    await smsService.sendSMS({
      body: {
        recipients: selectedRecipients.value.map(item => ({
          sent_to: item.sent_to,
          phone_number: item.phone_number
        })),
        message: bulkMessage.value
      }
    })
    toast.add({ title: 'SMS queued successfully', color: 'success' })
    bulkMessage.value = ''
    smsOpen.value = false
  } catch (error: unknown) {
    toast.add({
      title: 'Could not send SMS',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  }
}
</script>

<template>
  <HiringPanel id="hiring-applicants" title="Applicants" description="Review, filter, and take action on incoming applications.">
    <template #actions>
        <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="pending" @click="() => refresh()" />
    </template>

    <UCard :ui="{ body: 'space-y-4' }">
      <div class="grid gap-3 lg:grid-cols-[1.2fr_240px_120px]">
        <UInput v-model="query.search_str" icon="i-lucide-search" placeholder="Search applicants or jobs" />
        <USelect
          v-model="query.appl_status"
          :items="[{ label: 'All statuses', value: '' }, ...applicationsStore.applicantStagesForDropdown.value.map((stage: { description?: string, name?: string }) => ({ label: stage.description || stage.name || '', value: stage.name || '' }))]"
          class="w-full"
        />
        <USelect v-model="query.page_size" :items="[10, 20, 30, 50]" class="w-full" />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <USelect
          v-model="bulkStatus"
          :items="applicationsStore.applicantStagesForDropdown.value.map((stage: { description?: string, name?: string }) => ({ label: stage.description || stage.name || '', value: stage.name || '' }))"
          placeholder="Bulk status"
          class="min-w-56"
        />
        <UButton variant="outline" color="neutral" :disabled="!selectedIds.length || !bulkStatus" @click="applyBulkStatus">
          Update status
        </UButton>
        <UButton variant="outline" color="neutral" :disabled="!selectedIds.length" @click="emailOpen = true">
          Email selected
        </UButton>
        <UButton variant="outline" color="neutral" :disabled="!selectedIds.length" @click="smsOpen = true">
          SMS selected
        </UButton>
      </div>

      <UTable :data="rows" :columns="columns" :loading="pending">
        <template #select-cell="{ row }">
          <UCheckbox :model-value="selectedIds.includes(row.original.id || '')" @update:model-value="toggleSelection(row.original.id)" />
        </template>

        <template #job_seeker_name-cell="{ row }">
          <NuxtLink :to="`/hiring/applicants/${row.original.id}`" class="font-medium text-primary hover:underline">
            {{ row.original.job_seeker_name || 'Unnamed applicant' }}
          </NuxtLink>
        </template>

        <template #status-cell="{ row }">
          <HiringStatusBadge :status="row.original.status" />
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-muted">
          {{ pagination.count || 0 }} total applicants
        </p>
        <UPagination v-model:page="query.page" :items-per-page="query.page_size" :total="pagination.count || 0" />
      </div>
    </UCard>

    <UModal v-model:open="emailOpen" title="Email selected applicants">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Subject">
            <UInput v-model="bulkSubject" />
          </UFormField>
          <UFormField label="Message">
            <UTextarea v-model="bulkMessage" :rows="8" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="emailOpen = false">Cancel</UButton>
          <UButton @click="sendBulkEmails">Send email</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="smsOpen" title="Text selected applicants">
      <template #body>
        <UFormField label="Message">
          <UTextarea v-model="bulkMessage" :rows="8" />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="smsOpen = false">Cancel</UButton>
          <UButton @click="sendBulkSms">Send SMS</UButton>
        </div>
      </template>
    </UModal>
  </HiringPanel>
</template>
