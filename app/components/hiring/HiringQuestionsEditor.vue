<script setup lang="ts">
import type { HiringJobQuestion } from '~/types/hiring'
import { normalizeChoiceList } from '~/utils/hiring'

const props = defineProps<{
  modelValue: HiringJobQuestion[]
}>()

const emit = defineEmits<{
  'update:modelValue': [HiringJobQuestion[]]
}>()

const questions = computed({
  get: () => props.modelValue,
  set: (value: HiringJobQuestion[]) => emit('update:modelValue', value)
})

function updateQuestions(next: HiringJobQuestion[]) {
  questions.value = next
}

function addQuestion(type: 'text' | 'onechoice' | 'multichoice' = 'text') {
  const next = [...questions.value]
  next.push({
    question: '',
    type,
    choice_question: type !== 'text',
    multiple_choice: type === 'multichoice',
    choices: type === 'text' ? [] : [{ name: '' }]
  })
  updateQuestions(next)
}

function removeQuestion(index: number) {
  const next = [...questions.value]
  next.splice(index, 1)
  updateQuestions(next)
}

function updateQuestion(index: number, patch: Partial<HiringJobQuestion>) {
  const next = [...questions.value]
  const current = next[index]
  if (!current) {
    return
  }
  next[index] = {
    ...current,
    ...patch
  }
  updateQuestions(next)
}

function addChoice(index: number) {
  const current = questions.value[index]
  const choices = normalizeChoiceList(current?.choices)
  choices.push({ id: undefined, name: '' })
  updateQuestion(index, { choices })
}

function updateChoice(questionIndex: number, choiceIndex: number, value: string) {
  const current = questions.value[questionIndex]
  const choices = normalizeChoiceList(current?.choices)
  const choice = choices[choiceIndex]
  if (!choice) {
    return
  }
  choices[choiceIndex] = { ...choice, name: value }
  updateQuestion(questionIndex, { choices })
}

function removeChoice(questionIndex: number, choiceIndex: number) {
  const current = questions.value[questionIndex]
  const choices = normalizeChoiceList(current?.choices)
  choices.splice(choiceIndex, 1)
  updateQuestion(questionIndex, { choices })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap gap-2">
      <UButton icon="i-lucide-plus" label="Text question" size="sm" @click="addQuestion('text')" />
      <UButton icon="i-lucide-list-plus" label="Single choice" size="sm" variant="outline" @click="addQuestion('onechoice')" />
      <UButton icon="i-lucide-list-checks" label="Multi choice" size="sm" variant="outline" @click="addQuestion('multichoice')" />
    </div>

    <div v-if="!questions.length" class="rounded-lg border border-dashed border-default px-4 py-8 text-center text-sm text-muted">
      No screening questions yet.
    </div>

    <UCard
      v-for="(question, index) in questions"
      :key="`question-${index}`"
      :ui="{ body: 'space-y-4' }"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <h4 class="font-medium">
            Question {{ index + 1 }}
          </h4>
          <p class="text-sm text-muted">
            {{ question.type === 'text' ? 'Free text answer' : question.multiple_choice ? 'Multiple choice answer' : 'Single choice answer' }}
          </p>
        </div>
        <UButton icon="i-lucide-trash" color="error" variant="ghost" size="sm" @click="removeQuestion(index)" />
      </div>

      <UFormField :label="`Prompt ${index + 1}`">
        <UTextarea
          :model-value="question.question"
          :rows="2"
          placeholder="Enter your screening question"
          @update:model-value="updateQuestion(index, { question: String($event) })"
        />
      </UFormField>

      <div v-if="question.type !== 'text'" class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-medium">
            Options
          </p>
          <UButton icon="i-lucide-plus" label="Add option" size="xs" variant="outline" @click="addChoice(index)" />
        </div>

        <div
          v-for="(choice, choiceIndex) in normalizeChoiceList(question.choices)"
          :key="`question-${index}-choice-${choiceIndex}`"
          class="flex items-center gap-2"
        >
          <UInput
            :model-value="choice.name"
            class="flex-1"
            placeholder="Option text"
            @update:model-value="updateChoice(index, choiceIndex, String($event))"
          />
          <UButton
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            size="sm"
            @click="removeChoice(index, choiceIndex)"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>
