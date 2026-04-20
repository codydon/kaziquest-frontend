<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { payrollService } from '~~/services/payroll.service'
import { companyService } from '~~/services/company.service'
import type { Deduction } from '~/types/employee'
import PayrollMassDeductionModal from './PayrollMassDeductionModal.vue'
import { getDepartmentName, getPositionName } from '~/utils/getDepartmentPosition'
import { useAuthStore } from '~/stores/auth'

const toast = useToast()
useAuthStore()

interface MassDeduction {
  id: string
  deduction_template: Deduction
  apply_to: 'all' | 'selected' | 'filtered'
  filter_criteria?: Record<string, any>
  employee_ids?: string[]
  active: boolean
  created_by_name?: string
  affected_employees_count?: number
  created_at: string
  updated_at: string
}

type MassDeductionRow = MassDeduction & {
  name: string
  affected_count: number
  start_date?: string
  end_date?: string | null
}

const pageSize = ref(5)

const urlParams = reactive({
  page: 1,
  page_size: pageSize.value,
  paginate: true,
})

const computedUrlParams = computed(() => {
  return urlParams
})

const { data: massDeductionsData, status: massDeductionsStatus, refresh: refreshMassDeductions } = await payrollService.getMassDeductions(computedUrlParams.value) || { data: ref([]), status: ref('idle'), refresh: () => {} }

const loading = ref(false)
const selectedMassDeduction = ref<MassDeductionRow | null>(null)
const showDetailsModal = ref(false)
const showAffectedEmployeesModal = ref(false)
const affectedEmployees = ref<any[]>([])
const loadingAffectedEmployees = ref(false)
const showMassDeductionModal = ref(false)
const editMode = ref(false)

const columns: TableColumn<MassDeductionRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'apply_to', header: 'Applies To' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'active', header: 'Status' },
  { accessorKey: 'affected_count', header: 'Affected Employees' },
  { accessorKey: 'start_date', header: 'Start Date' },
  { accessorKey: 'end_date', header: 'End Date' },
  { id: 'actions', header: 'Actions' }
]

const formatApplyTo = (applyTo: string) => {
  const labels: Record<string, string> = {
    'all': 'All Active Employees',
    'selected': 'Selected Employees',
    'filtered': 'Filtered Employees'
  }
  return labels[applyTo] || applyTo
}

const formatDate = (dateString: string) => {
  if (!dateString) return '--'
  return new Date(dateString).toLocaleDateString()
}

const formatAmount = (deduction: MassDeductionRow) => {
  const template = deduction.deduction_template
  if (!template) return '--'
  
  // Check if it's a percentage-based deduction
  if (template.percentage !== undefined && template.percentage !== null) {
    return `${template.percentage}%`
  }
  
  // Check if it's an amount-based deduction
  if (template.amount !== undefined && template.amount !== null) {
    // Format as currency
    const amount = typeof template.amount === 'string' ? parseFloat(template.amount) : template.amount
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }
  
  return '--'
}

const getDeductionName = (massDeduction: MassDeductionRow) => {
  return massDeduction.deduction_template?.name || 'N/A'
}

const viewDetails = (massDeduction: MassDeductionRow) => {
  selectedMassDeduction.value = massDeduction
  showDetailsModal.value = true
}

const viewAffectedEmployees = async (massDeduction: MassDeductionRow) => {
  selectedMassDeduction.value = massDeduction
  loadingAffectedEmployees.value = true
  showAffectedEmployeesModal.value = true
  
  try {
    const { data } = await payrollService.getAffectedEmployees(massDeduction.id)
    if (data?.value) {
      affectedEmployees.value = Array.isArray(data.value) ? data.value : (data.value as any)?.results || []
    }
  } catch (error) {
    void 0 /* console.error('Error fetching affected employees:', error) */
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Failed to load affected employees',
      color: 'error'
    })
  } finally {
    loadingAffectedEmployees.value = false
  }
}

const toggleActive = async (massDeduction: MassDeductionRow) => {
  const actionText = massDeduction.active ? 'deactivate' : 'activate'
  const ok = confirm(
    `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} this mass deduction "${getDeductionName(massDeduction)}"?`
  )
  if (!ok) return

  loading.value = true
  try {
    const response = massDeduction.active
      ? await payrollService.deactivateMassDeduction(massDeduction.id)
      : await payrollService.activateMassDeduction(massDeduction.id)

    if ((response.data?.value as { success?: boolean })?.success === false) {
      throw new Error((response.data?.value as { message?: string })?.message || 'Failed to update')
    }

    toast.add({
      icon: 'i-heroicons-check-circle',
      title: `Mass deduction ${actionText}d successfully`,
      color: 'success'
    })
    refreshMassDeductions()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: `Failed to ${actionText} mass deduction`,
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const deleteMassDeduction = async (massDeduction: MassDeductionRow) => {
  const ok = confirm(
    `Delete mass deduction "${getDeductionName(massDeduction)}"? Individual deductions stay but will no longer link to this mass deduction.`
  )
  if (!ok) return

  loading.value = true
  try {
    const response = await payrollService.deleteMassDeduction(massDeduction.id)

    if (response.error?.value) {
      throw new Error((response.error.value as { data?: { message?: string } })?.data?.message || 'Failed to delete')
    }

    toast.add({
      icon: 'i-heroicons-check-circle',
      title: 'Mass deduction deleted successfully',
      color: 'success'
    })
    refreshMassDeductions()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Failed to delete mass deduction',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const applyToEmployees = async (_massDeduction: MassDeductionRow) => {
  const ok = confirm('Apply to employees that match the criteria but do not have deductions yet?')
  if (!ok) return

  loading.value = true
  try {
    toast.add({
      icon: 'i-heroicons-information-circle',
      title: 'Feature coming soon',
      description: 'The apply action will be available in the next update',
      color: 'info'
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Failed to apply mass deduction',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}



const handleModalSuccess = () => {
  refreshMassDeductions()
}

// Watch for pagination changes
let timeout: ReturnType<typeof setTimeout> | undefined;
watch(urlParams, (newParams, oldParams) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    refreshMassDeductions();
  }, 300);
}, {deep: true});

// Reset page to 1 when page_size changes
watch(() => urlParams.page_size, () => {
  urlParams.page = 1
})

const massDeductions = computed((): MassDeductionRow[] => {
  if (!massDeductionsData.value) return []
  const data = Array.isArray(massDeductionsData.value)
    ? massDeductionsData.value
    : (massDeductionsData.value as { results?: MassDeduction[] })?.results || []

  return data.map((md: MassDeduction) => ({
    ...md,
    name: md.deduction_template?.name || 'N/A',
    affected_count: md.affected_employees_count || 0,
    start_date: md.deduction_template?.start_date,
    end_date: md.deduction_template?.end_date || null
  }))
})

// Get pagination info from response
const paginationInfo = computed(() => {
  if (!massDeductionsData.value) {
    return null
  }
  // If it's an array, no pagination
  if (Array.isArray(massDeductionsData.value)) {
    return null
  }
  // Return the pagination object (should have results, current_page, count, etc.)
  const data = massDeductionsData.value as any
  if (data.results && Array.isArray(data.results)) {
    return data
  }
  return null
})


// modal
const openDeductionModal = (type: string) => {
    if (type === 'Add') {
        editMode.value = false
        selectedMassDeduction.value = null  // Clear any previous selection
    }
    showMassDeductionModal.value = true
}

const openEditModal = (data: MassDeductionRow) => {
  selectedMassDeduction.value = data
  editMode.value = true
  showMassDeductionModal.value = true
}

const filterDepartment = ref<any>(null)

// Fetch departments
const { data: departments } = await companyService.fetchDepartments()
const departmentsList = computed<any[]>(() => (departments.value as any[]) || [])

// Position caching system for table display
const positionsCache = ref<Map<string | number, any[]>>(new Map())
const positionsLoading = ref<Set<string | number>>(new Set())

/**
 * Fetch positions for a department and cache them
 * @param departmentId - Department ID
 * @param departmentName - Department name (fallback if ID not available)
 * @returns Array of positions
 */
const getPositionsForDepartment = async (departmentId?: string | number, departmentName?: string): Promise<any[]> => {
  // Use department ID as cache key, fallback to name
  const cacheKey = departmentId || departmentName || ''
  
  // Return cached positions if available
  if (positionsCache.value.has(cacheKey)) {
    return positionsCache.value.get(cacheKey) || []
  }
  
  // If already loading, return empty array (will be populated when loading completes)
  if (positionsLoading.value.has(cacheKey)) {
    return []
  }
  
  // Fetch positions
  try {
    positionsLoading.value.add(cacheKey)
    
    // Find department by ID or name
    let dept = null
    if (departmentId) {
      dept = departmentsList.value.find((d: any) => 
        d.id === departmentId || 
        d.id === Number(departmentId) ||
        String(d.id) === String(departmentId)
      )
    }
    
    if (!dept && departmentName) {
      dept = departmentsList.value.find((d: any) => d.name === departmentName)
    }
    
    if (!dept) {
      positionsCache.value.set(cacheKey, [])
      return []
    }
    
    const res = await companyService.fetchPositions({ department: dept.name })
    const positionsArray = Array.isArray(res) ? res : []
    positionsCache.value.set(cacheKey, positionsArray)
    return positionsArray
  } catch (error) {
    void 0 /* console.error('Error fetching positions:', error) */
    positionsCache.value.set(cacheKey, [])
    return []
  } finally {
    positionsLoading.value.delete(cacheKey)
  }
}

/**
 * Get all positions for display (aggregated from cache)
 */
const getAllPositions = computed(() => {
  const allPositions: any[] = []
  positionsCache.value.forEach((positions) => {
    allPositions.push(...positions)
  })
  return allPositions
})

/**
 * Format the "Applies To" display for a mass deduction row (synchronous version for template)
 * @param row - Mass deduction row data
 * @returns Formatted string for display
 */
const formatAppliesToDisplay = (row: MassDeductionRow): string => {
  // If apply_to is 'all' and no filter criteria, show simple label
  if (row.apply_to === 'all' && (!row.filter_criteria || Object.keys(row.filter_criteria).length === 0)) {
    return formatApplyTo(row.apply_to)
  }
  
  // If apply_to is 'selected', show count
  if (row.apply_to === 'selected') {
    const count = row.employee_ids?.length || 0
    return `${count} Selected Employee${count !== 1 ? 's' : ''}`
  }
  
  // If filtered, show department and position details
  if (row.apply_to === 'filtered' || (row.filter_criteria && Object.keys(row.filter_criteria).length > 0)) {
    const criteria = row.filter_criteria || {}
    const parts: string[] = []
    
    // Get department name
    const deptName = getDepartmentName(criteria, departmentsList.value)
    if (deptName) {
      parts.push(deptName)
    }
    
    // Get position name from cached positions
    const posName = getPositionName(criteria, getAllPositions.value)
    if (posName) {
      parts.push(posName)
    }
    
    if (parts.length > 0) {
      return parts.join(' - ')
    }
    
    return formatApplyTo(row.apply_to || 'filtered')
  }
  
  return formatApplyTo(row.apply_to)
}

// Pre-fetch positions for all mass deductions when data loads
watch(massDeductions, async (newDeductions) => {
  if (!newDeductions || newDeductions.length === 0) return
  
  // Collect unique department IDs from filter_criteria
  const departmentIds = new Set<string | number>()
  newDeductions.forEach((md: any) => {
    if (md.filter_criteria?.department_id) {
      departmentIds.add(md.filter_criteria.department_id)
    }
  })
  
  // Pre-fetch positions for all departments in parallel
  const fetchPromises = Array.from(departmentIds).map(deptId => 
    getPositionsForDepartment(deptId)
  )
  
  await Promise.all(fetchPromises)
}, { immediate: true })

</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-semibold">Mass Deductions</h2>
        <p class="text-sm text-gray-500">Manage mass deductions for employees</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton 
          label="Add Mass Deduction" 
          icon="i-heroicons-plus" 
          color="primary"
          @click="openDeductionModal('Add')"
        />
        <UButton 
        label="Refresh" 
        icon="i-heroicons-arrow-path" 
        variant="outline"
        :loading="massDeductionsStatus === 'pending'"
        @click="refreshMassDeductions()"
        />
      </div>
    </div>
     <div class="p-1 border border-default rounded-lg">
       <UTable
         :data="massDeductions"
         :columns="columns"
         class="border-0"
         :loading="massDeductionsStatus === 'pending' || loading"
       >
         <template #name-cell="{ row }">
           <div class="font-bold text-lg text-highlighted">{{ row.original.name }}</div>
           <div class="text-xs text-muted">{{ row.original.deduction_template?.type || 'N/A' }}</div>
         </template>

         <template #apply_to-cell="{ row }">
           <UBadge
             :label="formatAppliesToDisplay(row.original)"
             color="neutral"
             variant="soft"
           />
         </template>

         <template #amount-cell="{ row }">
           <span class="font-medium">{{ formatAmount(row.original) }}</span>
         </template>

         <template #active-cell="{ row }">
           <UBadge
             :label="row.original.active ? 'Active' : 'Inactive'"
             :color="row.original.active ? 'success' : 'error'"
             variant="soft"
           />
         </template>

         <template #affected_count-cell="{ row }">
           <span>{{ row.original.affected_count || 0 }}</span>
         </template>

         <template #start_date-cell="{ row }">
           {{ formatDate(row.original.start_date ?? '') }}
         </template>

         <template #end_date-cell="{ row }">
           {{ formatDate(row.original.end_date ?? '') }}
         </template>

         <template #actions-cell="{ row }">
           <div class="flex items-center gap-2">
             <UTooltip text="Edit">
               <UButton
                 icon="i-heroicons-pencil"
                 color="neutral"
                 variant="ghost"
                 size="xs"
                 @click="openEditModal(row.original)"
               />
             </UTooltip>
             <UTooltip :text="`Change status to ${row.original.active ? 'Inactive' : 'Active'}`">
               <UButton
                 :icon="row.original.active ? 'i-heroicons-pause' : 'i-heroicons-play'"
                 :color="row.original.active ? 'warning' : 'success'"
                 variant="ghost"
                 size="xs"
                 @click="toggleActive(row.original)"
               />
             </UTooltip>
           </div>
         </template>
       </UTable>
       <div
         v-if="paginationInfo && paginationInfo.count"
         class="flex flex-col gap-3 justify-between p-4 sm:flex-row sm:items-center"
       >
         <p class="text-sm text-muted">
           Showing
           {{ ((paginationInfo.current_page - 1) * (paginationInfo.current_page_count || urlParams.page_size)) + 1 }}
           –
           {{ Math.min((paginationInfo.current_page_count || urlParams.page_size) * paginationInfo.current_page, paginationInfo.count) }}
           of {{ paginationInfo.count }}
         </p>
         <UPagination
           v-model:page="urlParams.page"
           :items-per-page="urlParams.page_size"
           :total="paginationInfo.count || 0"
         />
         <div class="flex items-center gap-2">
           <span class="text-sm text-muted">Per page</span>
           <USelect
             v-model="urlParams.page_size"
             size="sm"
             class="w-24"
             :items="[
               { label: '5', value: 5 },
               { label: '10', value: 10 },
               { label: '20', value: 20 },
               { label: '30', value: 30 },
               { label: '40', value: 40 }
             ]"
             value-key="value"
             label-key="label"
           />
         </div>
       </div>
      </div>


    <!-- Mass Deduction Modal (Create/Edit) -->
    <PayrollMassDeductionModal
      v-if="showMassDeductionModal"
      :open="showMassDeductionModal"
      :edit-mode="editMode"
      :mass-deduction-data="selectedMassDeduction || undefined"
      @close="showMassDeductionModal = false"
      @success="handleModalSuccess"
    />
  </div>
</template>

