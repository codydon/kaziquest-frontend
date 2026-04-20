<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { companyService } from '~~/services/company.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  open: boolean
  edit: boolean
  department: { id?: string | number, name?: string, description?: string }
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  'saved': []
}>()

const toast = useToast()

const schema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  name: '',
  description: ''
})

const saving = ref(false)

watch(
  () => [props.open, props.edit, props.department] as const,
  ([isOpen]) => {
    if (!isOpen) {
      return
    }
    state.name = props.edit ? String(props.department?.name ?? '') : ''
    state.description = props.edit ? String(props.department?.description ?? '') : ''
  },
  { immediate: true }
)

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    if (props.edit && props.department?.id != null) {
      await companyService.updateDepartment(Number(props.department.id), {
        handler: '$fetch',
        method: 'PATCH',
        body: { name: state.name, description: state.description }
      })
      toast.add({ title: 'Department updated', color: 'success' })
    } else {
      await companyService.createDepartment({
        handler: '$fetch',
        method: 'POST',
        body: { name: state.name, description: state.description }
      })
      toast.add({ title: 'Department created', color: 'success' })
    }
    emit('update:open', false)
    emit('saved')
  } catch (err: unknown) {
    toast.add({
      title: 'Request failed',
      description: parseApiError(err, 'Could not save department.'),
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
    :title="edit ? 'Update department' : 'Create department'"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <UForm
      id="dept-form"
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4 p-1"
      @submit="onSubmit"
    >
      <UFormField label="Department name" name="name" required>
        <UInput v-model="state.name" />
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
          form="dept-form"
          :loading="saving"
          :label="edit ? 'Update' : 'Create'"
        />
      </div>
    </template>
  </UModal>
</template>
