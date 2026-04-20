<script setup lang="ts">
import PayrollMassDeductionForm from './PayrollMassDeductionForm.vue'

const props = defineProps<{
  open?: boolean
  editMode?: boolean
  massDeductionData?: Record<string, any> | null
}>()

const isOpen = ref(props.open ?? false)
const emit = defineEmits<{
  close: []
  success: []
}>()

watch(
  () => props.open,
  (v) => {
    isOpen.value = Boolean(v)
  }
)

const modalTitle = computed(() => (props.editMode ? 'Edit Mass Deduction' : 'Add Mass Deduction'))
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :ui="{
      content: 'max-w-4xl w-[calc(100vw-2rem)] max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto',
      overlay: 'backdrop-blur-sm'
    }"
    @update:open="(v: boolean) => { if (!v) emit('close') }"
  >
    <PayrollMassDeductionForm
      :edit-mode="editMode"
      :mass-deduction-data="massDeductionData ?? undefined"
      @close="emit('close')"
      @success="emit('success')"
    />
  </UModal>
</template>
