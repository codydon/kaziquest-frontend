<script setup lang="ts">
import { employeeService } from "~~/services/employee.service";
import { parseApiError } from "~/utils/parseApiError";

interface EmployeeEmailLog {
  id: string;
  sent_at: string | null;
  subject: string;
  category: string;
  email_type: string;
  status: string;
  recipient: string;
  recipient_list?: string[];
  body_content?: string | null;
  related?: { model: string; id: string } | null;
}

const props = defineProps<{
  employeeId: string;
}>();

const loading = ref(false);
const errorMessage = ref("");
const rows = ref<EmployeeEmailLog[]>([]);
const selectedEmail = ref<EmployeeEmailLog | null>(null);
const detailOpen = ref(false);

const formatDateTime = (value: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

const normalizeResponse = (response: any): EmployeeEmailLog[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const loadEmailLogs = async () => {
  if (!props.employeeId) {
    rows.value = [];
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await employeeService.getEmployeeEmails(props.employeeId, {
      handler: "$fetch",
      secured: true,
    });
    rows.value = normalizeResponse(response);
  } catch (error: unknown) {
    errorMessage.value = parseApiError(error, "Unable to load employee emails.");
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

const openDetails = (row: EmployeeEmailLog) => {
  selectedEmail.value = row;
  detailOpen.value = true;
};

watch(
  () => props.employeeId,
  () => {
    void loadEmailLogs();
  },
  { immediate: true }
);
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-default">Emails</h3>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="outline"
        color="neutral"
        size="sm"
        :loading="loading"
        @click="() => void loadEmailLogs()"
      />
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :title="errorMessage"
    />

    <div v-else-if="loading" class="space-y-2">
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
    </div>

    <UAlert
      v-else-if="!rows.length"
      color="neutral"
      variant="subtle"
      title="No emails yet"
      description="No payroll or timeoff emails were found for this employee."
    />

    <div v-else class="overflow-hidden rounded-lg border border-default">
      <div
        v-for="row in rows"
        :key="row.id"
        class="grid cursor-pointer grid-cols-1 gap-2 border-b border-default p-3 text-sm transition hover:bg-elevated/60 md:grid-cols-4"
        @click="openDetails(row)"
      >
        <p class="text-muted">{{ formatDateTime(row.sent_at) }}</p>
        <p class="font-medium text-default">{{ row.subject }}</p>
        <p class="text-muted">{{ row.category }} / {{ row.email_type }}</p>
        <div class="md:text-right">
          <UBadge :color="row.status === 'failed' ? 'error' : 'neutral'" variant="soft">
            {{ row.status || "unknown" }}
          </UBadge>
        </div>
      </div>
    </div>

    <UModal v-model:open="detailOpen" title="Email details">
      <div v-if="selectedEmail" class="space-y-4 text-sm">
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
          <p><span class="font-medium">Subject:</span> {{ selectedEmail.subject }}</p>
          <p><span class="font-medium">Recipient:</span> {{ selectedEmail.recipient }}</p>
          <p><span class="font-medium">Sent at:</span> {{ formatDateTime(selectedEmail.sent_at) }}</p>
          <p><span class="font-medium">Category:</span> {{ selectedEmail.category }}</p>
          <p><span class="font-medium">Type:</span> {{ selectedEmail.email_type }}</p>
          <p><span class="font-medium">Status:</span> {{ selectedEmail.status }}</p>
          <p v-if="selectedEmail.related" class="md:col-span-2">
            <span class="font-medium">Related:</span>
            {{ selectedEmail.related.model }} #{{ selectedEmail.related.id }}
          </p>
        </div>

        <div>
          <p class="mb-2 font-medium">Body/Content</p>
          <div class="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md border border-default p-3">
            {{ selectedEmail.body_content || "Body content is not available for this email." }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex w-full justify-end">
          <UButton label="Close" color="neutral" variant="outline" @click="detailOpen = false" />
        </div>
      </template>
    </UModal>
  </div>
</template>
