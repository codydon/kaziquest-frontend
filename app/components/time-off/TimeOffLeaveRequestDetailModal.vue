<script setup lang="ts">
import { employeeService } from '~~/services/employee.service'
import { timeOffService } from '~~/services/timeoff.service'
import type { TimeOffLeaveComment, TimeOffLeaveTimelineEvent } from '~/types/time-off'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  open: boolean
  /** Full leave row from `getLeaveDetail` (same shape legacy modal used). */
  leave: Record<string, unknown> | null
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
  refetch: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

const toast = useToast()
const { session } = useAuthSession()

const approveLoading = ref(false)
const rejectLoading = ref(false)
const reopenLoading = ref(false)
const timelineLoading = ref(false)
const timeline = ref<TimeOffLeaveTimelineEvent[]>([])
const comments = ref<TimeOffLeaveComment[]>([])
const commentsLoading = ref(false)
const newComment = ref('')
const commentSubmitting = ref(false)
const deleteCommentId = ref<string | null>(null)
const docLoading = ref(false)

const reopenOpen = ref(false)
const reopenReason = ref('')

const isEditing = ref(false)
const editStart = ref('')
const editEnd = ref('')
const editReason = ref('')
const editSaving = ref(false)
const calcLoading = ref(false)
const backendCalc = ref<Record<string, unknown> | null>(null)
const daySelections = ref<Record<string, string>>({})

const user = computed(() => (session.value.user || {}) as Record<string, unknown>)
const userId = computed(() => String(user.value.id ?? ''))

const leaveId = computed(() => String(props.leave?.id ?? ''))

const canEditLeave = computed(() => {
  const row = props.leave
  if (!row?.status || !userId.value) {
    return false
  }
  const status = String(row.status)
  const allowed = ['Requested', 'Partially Approved', 'Approved'].includes(status)
  const empUserId = String((row.employee_data as { user?: { id?: string } } | undefined)?.user?.id ?? '')
  const isEmployee = empUserId === userId.value
  const pending = Array.isArray(row.pending_approvers)
    && (row.pending_approvers as { user_id?: string }[]).some(a => String(a.user_id) === userId.value)
  const approver = Array.isArray(row.leave_approvers)
    && (row.leave_approvers as { user_id?: string }[]).some(a => String(a.user_id) === userId.value)
  const group = (user.value.group as { name?: string } | undefined)?.name || ''
  const isAdminOrHr = group === 'Admin' || group === 'HR Manager' || group === 'Hr Manager'
  return allowed && (isEmployee || pending || approver || isAdminOrHr)
})

const canReopenLeave = computed(() => Boolean(props.leave?.can_reopen))

watch(
  () => [props.open, leaveId.value] as const,
  async ([open, id]) => {
    if (!open || !id) {
      return
    }
    await Promise.all([loadTimeline(), loadComments()])
    resetEditFromLeave()
  },
)

function resetEditFromLeave() {
  const row = props.leave
  if (!row) {
    return
  }
  isEditing.value = false
  editStart.value = String(row.start_date || '').slice(0, 10)
  editEnd.value = String(row.end_date || '').slice(0, 10)
  editReason.value = String(row.note || '')
  backendCalc.value = null
  daySelections.value = typeof row.day_selections === 'object' && row.day_selections
    ? { ...(row.day_selections as Record<string, string>) }
    : {}
}

async function loadTimeline() {
  if (!leaveId.value) {
    return
  }
  timelineLoading.value = true
  try {
    const res = await timeOffService.getLeaveTimeline(leaveId.value) as { data?: TimeOffLeaveTimelineEvent[] }
    timeline.value = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res as TimeOffLeaveTimelineEvent[] : [])
  }
  catch {
    timeline.value = []
  }
  finally {
    timelineLoading.value = false
  }
}

async function loadComments() {
  if (!leaveId.value) {
    return
  }
  commentsLoading.value = true
  try {
    const res = await timeOffService.getLeaveComents({
      handler: '$fetch',
      query: { leave_id: leaveId.value },
    }) as TimeOffLeaveComment[] | { results?: TimeOffLeaveComment[] }
    const list = Array.isArray(res) ? res : (res?.results ?? [])
    comments.value = Array.isArray(list) ? list : []
  }
  catch {
    comments.value = []
  }
  finally {
    commentsLoading.value = false
  }
}

function unwrapSuccess(res: unknown): boolean {
  if (res && typeof res === 'object' && 'success' in res) {
    return Boolean((res as { success?: boolean }).success)
  }
  return true
}

async function onApprove() {
  if (!leaveId.value) {
    return
  }
  approveLoading.value = true
  try {
    const res = await timeOffService.approveLeave(leaveId.value) as { success?: boolean, message?: string }
    if (!unwrapSuccess(res)) {
      throw new Error(res?.message || 'Approval failed')
    }
    toast.add({ title: 'Leave approved', color: 'success' })
    emit('success')
    emit('refetch')
    isOpen.value = false
  }
  catch (error: unknown) {
    toast.add({
      title: 'Approval failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    approveLoading.value = false
  }
}

async function onReject() {
  if (!leaveId.value) {
    return
  }
  rejectLoading.value = true
  try {
    const res = await timeOffService.rejectLeave(leaveId.value) as { success?: boolean, message?: string }
    if (!unwrapSuccess(res)) {
      throw new Error(res?.message || 'Reject failed')
    }
    toast.add({ title: 'Leave rejected', color: 'success' })
    emit('success')
    emit('refetch')
    isOpen.value = false
  }
  catch (error: unknown) {
    toast.add({
      title: 'Reject failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    rejectLoading.value = false
  }
}

async function confirmReopen() {
  if (!leaveId.value || !reopenReason.value.trim()) {
    return
  }
  reopenLoading.value = true
  try {
    const res = await timeOffService.reopenLeave(leaveId.value, reopenReason.value.trim()) as { success?: boolean, message?: string }
    if (!unwrapSuccess(res)) {
      throw new Error(res?.message || 'Reopen failed')
    }
    toast.add({ title: 'Leave reopened', color: 'success' })
    reopenOpen.value = false
    reopenReason.value = ''
    await loadTimeline()
    emit('success')
    emit('refetch')
  }
  catch (error: unknown) {
    toast.add({
      title: 'Reopen failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    reopenLoading.value = false
  }
}

async function submitComment() {
  if (!leaveId.value || !newComment.value.trim()) {
    return
  }
  commentSubmitting.value = true
  try {
    await timeOffService.addComment({
      handler: '$fetch',
      method: 'POST',
      body: {
        leave: leaveId.value,
        comment: newComment.value.trim(),
      },
    })
    newComment.value = ''
    toast.add({ title: 'Comment added', color: 'success' })
    await loadComments()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Comment failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    commentSubmitting.value = false
  }
}

async function removeComment(id: string) {
  deleteCommentId.value = id
  try {
    await timeOffService.deleteComment(id)
    toast.add({ title: 'Comment removed', color: 'success' })
    await loadComments()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Delete failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    deleteCommentId.value = null
  }
}

async function recalculateDays() {
  const row = props.leave
  if (!row?.category || !editStart.value || !editEnd.value) {
    return
  }
  calcLoading.value = true
  try {
    const res = await timeOffService.calculateRequestedDays({
      handler: '$fetch',
      method: 'POST',
      body: {
        start_date: editStart.value,
        end_date: editEnd.value,
        category: row.category,
        leave_type: 'days',
        duration_type: '',
        day_selections: daySelections.value,
        start_time: null,
        end_time: null,
      },
    }) as { success?: boolean, data?: Record<string, unknown>, message?: string }
    const payload = (res as { data?: { data?: Record<string, unknown> } }).data
    if (res && typeof res === 'object' && 'success' in res && (res as { success?: boolean }).success === false) {
      throw new Error((res as { message?: string }).message || 'Calculation failed')
    }
    const fromNested = (payload as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined
    const fromPayload = payload as Record<string, unknown> | undefined
    const fromRes = (res as { data?: Record<string, unknown> }).data
    const merged = (fromNested ?? fromPayload ?? fromRes ?? null) as Record<string, unknown> | null
    backendCalc.value = merged && typeof merged === 'object' ? merged : null
  }
  catch (error: unknown) {
    toast.add({
      title: 'Could not recalculate',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    calcLoading.value = false
  }
}

async function saveEdit() {
  if (!leaveId.value || !editStart.value || !editEnd.value) {
    return
  }
  editSaving.value = true
  try {
    const form = new FormData()
    form.append('start_date', editStart.value)
    form.append('end_date', editEnd.value)
    form.append('reason', editReason.value)
    form.append('leave_type', 'days')
    const durationType = String(backendCalc.value?.duration_type || 'fullday')
    form.append('duration_type', durationType)
    form.append('full_days_count', String(backendCalc.value?.full_days_count ?? 0))
    form.append('half_days_count', String(backendCalc.value?.half_days_count ?? 0))
    form.append('day_selections', JSON.stringify(daySelections.value))

    await timeOffService.updateLeave(leaveId.value, {
      handler: '$fetch',
      method: 'PATCH',
      body: form,
    })
    toast.add({ title: 'Leave updated', color: 'success' })
    isEditing.value = false
    emit('refetch')
    isOpen.value = false
  }
  catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    editSaving.value = false
  }
}

function stripQueryForStream(url: string) {
  try {
    const u = new URL(url)
    return `${u.origin}${u.pathname}`
  }
  catch {
    return url
  }
}

function formatDateTime(iso?: string | null) {
  if (!iso) {
    return '—'
  }
  const d = new Date(String(iso))
  if (Number.isNaN(d.getTime())) {
    return String(iso)
  }
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTimeWithTime(iso?: string | null) {
  if (!iso) {
    return '—'
  }
  const d = new Date(String(iso))
  if (Number.isNaN(d.getTime())) {
    return String(iso)
  }
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function openAttachment(url: string) {
  docLoading.value = true
  try {
    const ext = url.split('.').pop()?.toLowerCase()?.split('?')[0] || ''
    if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
      const res = await employeeService.streamFile({
        handler: '$fetch',
        body: {
          file_path: stripQueryForStream(url),
          model_type: 'EmployeeDocument',
        },
      }) as BlobPart
      const mime = ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`
      const blob = new Blob([res], { type: mime })
      const objectUrl = URL.createObjectURL(blob)
      window.open(objectUrl, '_blank', 'noopener')
    }
    else {
      window.open(url, '_blank', 'noopener')
    }
  }
  catch {
    window.open(url, '_blank', 'noopener')
  }
  finally {
    docLoading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="leave ? `Leave request` : 'Leave'"
    :description="leave ? String(leave.status || '') : undefined"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div v-if="leave" class="max-h-[min(80vh,640px)] space-y-4 overflow-y-auto pr-1">
        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="['Requested', 'Partially Approved'].includes(String(leave.status))"
            label="Approve"
            color="success"
            :loading="approveLoading"
            @click="() => void onApprove()"
          />
          <UButton
            v-if="['Requested', 'Partially Approved'].includes(String(leave.status))"
            label="Reject"
            color="error"
            variant="outline"
            :loading="rejectLoading"
            @click="() => void onReject()"
          />
          <UButton
            v-if="canReopenLeave"
            label="Reopen"
            variant="outline"
            @click="reopenOpen = true"
          />
          <UButton
            v-if="canEditLeave"
            :label="isEditing ? 'Cancel edit' : 'Edit dates'"
            variant="soft"
            color="neutral"
            @click="isEditing = !isEditing; if (!isEditing) resetEditFromLeave()"
          />
        </div>

        <div class="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p class="text-muted">
              Employee
            </p>
            <p class="font-medium">
              {{ (leave.employee_data as { user?: { full_name?: string } } | undefined)?.user?.full_name || '—' }}
            </p>
          </div>
          <div>
            <p class="text-muted">
              Type
            </p>
            <p class="font-medium capitalize">
              {{ (leave.category_data as { name?: string } | undefined)?.name || '—' }}
            </p>
          </div>
          <div>
            <p class="text-muted">
              Start
            </p>
            <span>{{ formatDateTime(leave.start_date as string | undefined) }}</span>
          </div>
          <div>
            <p class="text-muted">
              End
            </p>
            <span>{{ formatDateTime(leave.end_date as string | undefined) }}</span>
          </div>
          <div class="sm:col-span-2">
            <p class="text-muted">
              Note
            </p>
            <p>{{ leave.note || '—' }}</p>
          </div>
          <div v-if="leave.attachment" class="sm:col-span-2">
            <UButton
              size="sm"
              variant="outline"
              icon="i-lucide-paperclip"
              label="View attachment"
              :loading="docLoading"
              @click="openAttachment(String(leave.attachment))"
            />
          </div>
        </div>

        <div v-if="isEditing" class="space-y-3 rounded-lg border border-default p-3">
          <div class="grid gap-2 sm:grid-cols-2">
            <UFormField label="Start date">
              <UInput v-model="editStart" type="date" />
            </UFormField>
            <UFormField label="End date">
              <UInput v-model="editEnd" type="date" />
            </UFormField>
          </div>
          <UFormField label="Reason / note">
            <UTextarea v-model="editReason" :rows="2" class="w-full" />
          </UFormField>
          <div class="flex flex-wrap gap-2">
            <UButton
              label="Recalculate days"
              variant="outline"
              :loading="calcLoading"
              @click="() => void recalculateDays()"
            />
            <UButton
              label="Save changes"
              :loading="editSaving"
              :disabled="!editStart || !editEnd"
              @click="() => void saveEdit()"
            />
          </div>
          <p v-if="backendCalc" class="text-xs text-muted">
            Requested days: {{ backendCalc.requested_days ?? '—' }}
          </p>
        </div>

        <div>
          <h3 class="mb-2 text-sm font-semibold">
            Timeline
          </h3>
          <div v-if="timelineLoading" class="text-sm text-muted">
            Loading…
          </div>
          <ul v-else class="space-y-2 text-sm">
            <li
              v-for="ev in timeline"
              :key="ev.id"
              class="rounded border border-default px-2 py-1"
            >
              <span class="font-medium">{{ ev.event_type }}</span>
              <span class="text-muted"> — {{ formatDateTimeWithTime(ev.created_at) }}</span>
              <p v-if="ev.reason" class="text-muted">
                {{ ev.reason }}
              </p>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="mb-2 text-sm font-semibold">
            Comments
          </h3>
          <div v-if="commentsLoading" class="text-sm text-muted">
            Loading…
          </div>
          <ul v-else class="mb-3 space-y-2">
            <li
              v-for="c in comments"
              :key="String(c.id)"
              class="flex items-start justify-between gap-2 rounded border border-default px-2 py-1 text-sm"
            >
              <div>
                <p class="font-medium">
                  {{ c.commented_by?.full_name || 'User' }}
                </p>
                <p>{{ c.comment }}</p>
                <p class="text-xs text-muted">
                  {{ formatDateTimeWithTime(c.created_at) }}
                </p>
              </div>
              <UButton
                v-if="c.id"
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash"
                :loading="deleteCommentId === String(c.id)"
                @click="() => void removeComment(String(c.id))"
              />
            </li>
          </ul>
          <div class="flex gap-2">
            <UInput v-model="newComment" class="flex-1" placeholder="Add a comment" />
            <UButton
              label="Post"
              :loading="commentSubmitting"
              :disabled="!newComment.trim()"
              @click="() => void submitComment()"
            />
          </div>
        </div>
      </div>
    </template>
  </UModal>

  <UModal v-model:open="reopenOpen" title="Reopen leave request" description="Provide a reason (required).">
    <template #body>
      <UTextarea v-model="reopenReason" :rows="3" class="w-full" placeholder="Reason" />
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" label="Cancel" @click="reopenOpen = false" />
        <UButton
          label="Reopen"
          :loading="reopenLoading"
          :disabled="!reopenReason.trim()"
          @click="() => void confirmReopen()"
        />
      </div>
    </template>
  </UModal>
</template>
