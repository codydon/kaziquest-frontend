<script setup lang="ts">
import { employeeService } from '~~/services/employee.service'
import { companyService } from '~~/services/company.service'

const props = defineProps<{
  employee: { id: string; full_name: string }
  clearanceData: any
}>()

const emit = defineEmits(['update:clearanceData'])
const clearanceStatus = ref<any>({ ...props.clearanceData })
const departments = ref<Array<{ key: string; title: string; items: string[] }>>([])
const allAvailableDepartments = ref<Array<{ id: number; name: string }>>([])
const employeeDeptKey = ref<string | null>(null)
const selectedDeptKeys = ref<string[]>([])
const selectedDeptToAdd = ref<string | undefined>(undefined)
const loading = ref(false)
const departmentsLoaded = ref(false)
const initialized = ref(false)
const isUpdatingFromProps = ref(false) 
const newItemInputs = ref<Record<string, string>>({})
const showAddItemInput = ref<Record<string, boolean>>({})
const toast = useToast()
const defaultChecklistItems: Record<string, string[]> = {
  'IT': [
    'Company email & accounts deactivated',
    'Software licenses revoked',
    'Access cards collected',
    'Laptop/Equipment returned'
  ],
  'Finance': [
    'Final dues calculated',
    'Outstanding advances cleared',
    'Final payslip generated',
    'Tax documents provided'
  ],
  'HR': [
    'Exit interview done',
    'Company policies acknowledged',
    'Final paperwork signed',
    'Benefits information provided'
  ],
  'Generic': [
    'Company property returned',
    'Access cards collected',
    'Final paperwork signed',
    'Knowledge transfer completed'
  ]
}

const fetchEmployeeDepartment = async () => {
  try {
    const res: unknown = await employeeService.getEmployeeRaw(props.employee.id, {
      handler: '$fetch',
      secured: true
    })
    const unwrap = (raw: unknown) => {
      if (raw && typeof raw === 'object' && 'data' in raw) {
        return (raw as { data: unknown }).data
      }
      return raw
    }
    const employeeData = unwrap(res) as Record<string, unknown> | null
    const deptNameCandidate = (employeeData as any)?.current_job_data?.position?.department?.name
      || (employeeData as any)?.current_job?.position?.department?.name
      || (employeeData as any)?.position?.department?.name
      || (employeeData as any)?.department
      || null
    const firstDeptName = allAvailableDepartments.value[0]?.name
    const initialDeptName = (deptNameCandidate && String(deptNameCandidate))
      || (firstDeptName ? String(firstDeptName) : null)

    if (!initialDeptName) return

    employeeDeptKey.value = initialDeptName

    if (!departments.value.some(d => d.key === initialDeptName)) {
      const templateItems = defaultChecklistItems[initialDeptName] ?? defaultChecklistItems.Generic ?? []
      departments.value.push({
        key: initialDeptName,
        title: `${initialDeptName} Department`,
        items: [...templateItems]
      })
    }
    selectedDeptKeys.value = [initialDeptName]
    initializeDepartments()
  } catch {
    toast.add({
      icon: 'i-heroicons-x-circle', 
      title: 'Failed to load employee department',
      color: 'error',
    })
    
  }
}

// Fetch all available departments
const fetchAllDepartments = async () => {
  if (departmentsLoaded.value || loading.value) return
  
  try {
    loading.value = true
    const res: unknown = await companyService.fetchDepartments({
      handler: '$fetch',
      secured: true
    })
    const raw = (res as Record<string, unknown> | null)?.data ?? res
    const payload = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
    const list = Array.isArray(payload.results)
      ? payload.results
      : (Array.isArray(raw) ? raw : [])
    allAvailableDepartments.value = list.map((d: any) => ({ id: d.id, name: d.name || d.title }))
    departmentsLoaded.value = true
  } catch (error) {
    void 0 /* console.error('Error fetching departments:', error) */
    toast.add({
      icon: 'i-heroicons-x-circle', 
      title: 'Failed to load departments',
      description: 'Please try again later',
      color: 'error',
    })

    allAvailableDepartments.value = []
    departmentsLoaded.value = false
  } finally {
    loading.value = false
  }
}

const initializeDepartments = () => {
  selectedDeptKeys.value.forEach(key => {
    if (!clearanceStatus.value[key]) {
      clearanceStatus.value[key] = {
        items: {},
        cleared: false,
        notes: ''
      }
    }
  })

  if (initialized.value) {
    emitUpdate()
  }
}

const emitUpdate = () => {
  emit('update:clearanceData', { ...clearanceStatus.value })
}

// Completely disable watchers until initialized
const watchersEnabled = ref(false)

// Watch props to sync changes from parent (but prevent loops)
watch(() => props.clearanceData, (newData, oldData) => {
  if (!watchersEnabled.value || !initialized.value || isUpdatingFromProps.value) return
  if (JSON.stringify(newData) === JSON.stringify(oldData)) return
  isUpdatingFromProps.value = true
  clearanceStatus.value = { ...newData }
  isUpdatingFromProps.value = false
}, { deep: true, flush: 'post' })

// Debounce to prevent excessive emits
let emitTimeout: ReturnType<typeof setTimeout> | null = null
let lastEmittedValue: string | null = null
watch(clearanceStatus, () => {
  if (!watchersEnabled.value || !initialized.value || isUpdatingFromProps.value) return // Don't emit until initialized or during prop sync
  
  // Check if value actually changed
  const currentValue = JSON.stringify(clearanceStatus.value)
  if (currentValue === lastEmittedValue) return
  
  updateDeptCompletionStatus()
  // Debounce emit to prevent excessive updates
  if (emitTimeout) clearTimeout(emitTimeout)
  emitTimeout = setTimeout(() => {
    lastEmittedValue = JSON.stringify(clearanceStatus.value)
    emitUpdate()
  }, 1000) // Increased debounce time even more
}, { deep: true, flush: 'post' })

// Check if all items in a department are completed
const isDeptComplete = (key: string): boolean => {
  const dept = departments.value.find(d => d.key === key)
  if (!dept) return false
  
  const deptStatus = clearanceStatus.value[key]
  if (!deptStatus || !deptStatus.items) return false
  
  const items = dept.items
  // All items must exist and be checked
  return items.length > 0 && items.every(item => deptStatus.items[item] === true)
}

const updateDeptCompletionStatus = () => {
  selectedDeptKeys.value.forEach(key => {
    if (clearanceStatus.value[key]) {
      clearanceStatus.value[key].cleared = isDeptComplete(key)
    }
  })
}

// Add department to the list
const addDepartment = (deptName: string) => {
  if (!deptName || selectedDeptKeys.value.includes(deptName)) return
  
  // Add to departments list if not already there
  if (!departments.value.some(d => d.key === deptName)) {
    const templateItems = defaultChecklistItems[deptName] ?? defaultChecklistItems.Generic ?? []
    departments.value.push({
      key: deptName,
      title: `${deptName} Department`,
      items: [...templateItems]
    })
  }
  
  selectedDeptKeys.value.push(deptName)
  initializeDepartments()
}

// Get visible departments (those selected)
const visibleDepartments = computed(() => {
  return departments.value.filter(d => selectedDeptKeys.value.includes(d.key))
})

// Remove department (but not employee's department)
const removeDepartment = (deptKey: string) => {
  if (deptKey === employeeDeptKey.value) return // Cannot remove employee's department
  selectedDeptKeys.value = selectedDeptKeys.value.filter(k => k !== deptKey)
  // Clear status for removed department
  if (clearanceStatus.value[deptKey]) {
    delete clearanceStatus.value[deptKey]
  }
  emitUpdate()
}

// Get departments available to add (not already selected)
const availableDeptsToAdd = computed(() => {
  return allAvailableDepartments.value.filter(d => 
    !selectedDeptKeys.value.includes(d.name)
  )
})

function normalizeDeptMenuValue(item: unknown): string | undefined {
  if (typeof item === 'string') return item
  if (item && typeof item === 'object' && 'value' in item) {
    const v = (item as { value: unknown }).value
    return v != null ? String(v) : undefined
  }
  return undefined
}

// Handle dropdown selection to add department
const handleDeptSelection = (item: unknown) => {
  const deptName = normalizeDeptMenuValue(item)
  if (!deptName) {
    selectedDeptToAdd.value = undefined
    return
  }

  // Check if department is already added
  if (selectedDeptKeys.value.includes(deptName)) {
    // Department already exists, just reset the dropdown
    selectedDeptToAdd.value = undefined
    return
  }

  // Add the department
  addDepartment(deptName)
  selectedDeptToAdd.value = undefined // Reset dropdown
}

// Add custom checklist item to a department
const addCustomItem = (deptKey: string) => {
  const itemText = (newItemInputs.value[deptKey] || '').trim()
  if (!itemText) return
  
  const dept = departments.value.find(d => d.key === deptKey)
  if (!dept) return
  
  // Check for duplicates (case-insensitive)
  const normalizedItemText = itemText.toLowerCase()
  const isDuplicate = dept.items.some(item => item.toLowerCase() === normalizedItemText)
  if (isDuplicate) {
    // Could show a toast here, but for now just return
    return
  }
  
  // Add item to department's items array
  dept.items.push(itemText)
  
  // Initialize clearance status for the new item if not exists
  if (!clearanceStatus.value[deptKey]) {
    clearanceStatus.value[deptKey] = { items: {}, cleared: false, notes: '' }
  }
  if (!clearanceStatus.value[deptKey].items) {
    clearanceStatus.value[deptKey].items = {}
  }
  
  // Clear input and hide add item UI
  newItemInputs.value[deptKey] = ''
  showAddItemInput.value[deptKey] = false
  
  // Trigger update
  updateDeptCompletionStatus()
  emitUpdate()
}

// Remove custom checklist item from a department
const removeCustomItem = (deptKey: string, itemText: string) => {
  const dept = departments.value.find(d => d.key === deptKey)
  if (!dept) return
  
  
  const defaultItems = defaultChecklistItems[deptKey] || defaultChecklistItems['Generic'] || []
  const isDefaultItem = defaultItems.some(item => item === itemText)
  
  // Remove from items array
  const index = dept.items.indexOf(itemText)
  if (index > -1) {
    dept.items.splice(index, 1)
  }
  
  // Remove from clearance status
  if (clearanceStatus.value[deptKey]?.items?.[itemText] !== undefined) {
    delete clearanceStatus.value[deptKey].items[itemText]
  }
  
  // Trigger update
  updateDeptCompletionStatus()
  emitUpdate()
}

// Toggle add item input visibility
const toggleAddItemInput = (deptKey: string) => {
  showAddItemInput.value[deptKey] = !showAddItemInput.value[deptKey]
  if (showAddItemInput.value[deptKey]) {
    // Focus input when showing
    nextTick(() => {
      const input = document.querySelector(`[data-dept-input="${deptKey}"]`) as HTMLInputElement
      if (input) input.focus()
    })
  } else {
    // Clear input when hiding
    newItemInputs.value[deptKey] = ''
  }
}

const deptDropdownOptions = computed(() => {
  return allAvailableDepartments.value.map(dept => ({
    label: dept.name,
    value: dept.name
  }))
})

onMounted(async () => {
  if (initialized.value) return 
  watchersEnabled.value = false
  
  if (!departmentsLoaded.value) {
    await fetchAllDepartments()
  }
  await fetchEmployeeDepartment()
  initialized.value = true
  await nextTick()
  watchersEnabled.value = true
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="text-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin w-6 h-6 mx-auto" />
      <p class="text-sm text-gray-500 mt-2">Loading departments...</p>
    </div>
    
    <div v-else>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Clearance Checklist</h3>
          <p class="text-sm text-gray-500 mt-1">Complete the checklist for each department</p>
        </div>
        <USelectMenu
          v-model="selectedDeptToAdd"
          :options="deptDropdownOptions"
          placeholder="Add Department"
          searchable
          searchable-placeholder="Search departments..."
          value-attribute="value"
          option-attribute="label"
          class="w-48"
          @update:model-value="handleDeptSelection"
        />
      </div>

      <!-- Department cards -->
      <div v-for="dept in visibleDepartments" :key="dept.key" class="border rounded-lg p-4 bg-white shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <h4 class="font-semibold text-gray-900">{{ dept.title }}</h4>
            <UBadge 
              v-if="dept.key === employeeDeptKey" 
              color="info" 
              variant="soft"
              size="sm"
            >
              Employee Dept
            </UBadge>
          </div>
          <div class="flex items-center gap-3">
            <UBadge 
              :color="clearanceStatus[dept.key]?.cleared ? 'success' : 'warning'" 
              variant="soft"
            >
              {{ clearanceStatus[dept.key]?.cleared ? 'Complete' : 'Pending' }}
            </UBadge>
            <UButton
              v-if="dept.key !== employeeDeptKey"
              icon="i-heroicons-x-mark"
              variant="ghost"
              color="error"
              size="xs"
              @click="removeDepartment(dept.key)"
            />
          </div>
        </div>
        
        <div class="space-y-3">
          <label 
            v-for="(label, idx) in dept.items" 
            :key="idx" 
            class="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <UCheckbox 
              :model-value="!!(clearanceStatus[dept.key]?.items?.[label])"
              @update:model-value="(val: boolean | 'indeterminate') => {
                if (!clearanceStatus[dept.key]) {
                  clearanceStatus[dept.key] = { items: {}, cleared: false, notes: '' }
                }
                clearanceStatus[dept.key].items[label] = val === true
              }"
            />
            <span class="text-sm text-gray-700 flex-1">{{ label }}</span>
            <UButton
              icon="i-heroicons-x-mark"
              variant="ghost"
              color="error"
              size="xs"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="removeCustomItem(dept.key, label)"
            />
          </label>
        </div>
        <div class="mt-4 pt-4 border-t space-y-2">
          <div v-if="!showAddItemInput[dept.key]" class="flex justify-start">
            <UButton
              icon="i-heroicons-plus"
              label="Add Checklist Item"
              variant="outline"
              size="sm"
              color="neutral"
              @click="toggleAddItemInput(dept.key)"
            />
          </div>
          <div v-else class="flex items-center gap-2">
            <UInput
              :data-dept-input="dept.key"
              v-model="newItemInputs[dept.key]"
              placeholder="Enter checklist item..."
              class="flex-1"
              @keyup.enter="addCustomItem(dept.key)"
              @keyup.escape="toggleAddItemInput(dept.key)"
            />
            <UButton
              icon="i-heroicons-check"
              variant="solid"
              color="primary"
              size="sm"
              @click="addCustomItem(dept.key)"
              :disabled="!newItemInputs[dept.key]?.trim()"
            />
            <UButton
              icon="i-heroicons-x-mark"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="toggleAddItemInput(dept.key)"
            />
          </div>
        </div>
        
        <div class="mt-4 pt-4 border-t">
          <UTextarea 
            :model-value="clearanceStatus[dept.key]?.notes || ''"
            @update:modelValue="(val: string) => {
              if (!clearanceStatus[dept.key]) {
                clearanceStatus[dept.key] = { items: {}, cleared: false, notes: '' }
              }
              clearanceStatus[dept.key].notes = val
            }"
            placeholder="Additional notes (optional)"
            :rows="2"
            class="text-sm"
          />
        </div>
      </div>
    </div>
  </div>
</template>
