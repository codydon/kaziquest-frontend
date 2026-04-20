<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { companyService } from '~~/services/company.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  open: boolean
  edit: boolean
  selectedDept: { id?: string | number, name?: string }
  position: { id?: string | number, job_title?: string, description?: string }
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  'saved': []
}>()

const toast = useToast()

const schema = z.object({
  job_title: z.string().min(1, 'Position name is required'),
  description: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  job_title: '',
  description: ''
})

const saving = ref(false)

watch(
  () => [props.open, props.edit, props.position] as const,
  ([isOpen]) => {
    if (!isOpen) {
      return
    }
    state.job_title = props.edit ? String(props.position?.job_title ?? '') : ''
    state.description = props.edit ? String(props.position?.description ?? '') : ''
  },
  { immediate: true }
)

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  if (!props.selectedDept?.id) {
    toast.add({ title: 'Select a department', color: 'warning' })
    return
  }

  saving.value = true
  try {
    if (props.edit && props.position?.id != null) {
      await companyService.updatePosition(Number(props.position.id), {
        handler: '$fetch',
        method: 'PATCH',
        body: {
          job_title: state.job_title,
          description: state.description,
          id: props.position.id
        }
      })
      toast.add({ title: 'Position updated', color: 'success' })
    } else {
      await companyService.createPosition({
        handler: '$fetch',
        method: 'POST',
        body: {
          department_id: props.selectedDept.id,
          job_title: state.job_title,
          description: state.description
        }
      })
      toast.add({ title: 'Position created', color: 'success' })
    }
    emit('update:open', false)
    emit('saved')
  } catch (err: unknown) {
    toast.add({
      title: 'Request failed',
      description: parseApiError(err, 'Could not save position.'),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    :title="`${edit ? 'Update' : 'Create'} position${selectedDept?.name ? ` in ${selectedDept.name}` : ''}`"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <UForm
      id="pos-form"
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4 p-1"
      @submit="onSubmit"
    >
      <UFormField label="Position name" name="job_title" required>
        <UInput v-model="state.job_title" />
      </UFormField>
      <UFormField label="Description" name="description">
        <UTextarea v-model="state.description" autoresize class="w-full" />
      </UFormField>
    </UForm>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          @click="emit('update:open', false)"
        />
        <UButton
          type="submit"
          form="pos-form"
          :loading="saving"
          :label="edit ? 'Update' : 'Create'"
        />
      </div>
    </template>
  </UModal>
</template>
