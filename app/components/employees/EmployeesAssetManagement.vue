<script setup lang="ts">
const props = defineProps<{
  employee: { id: string; full_name: string }
  assetData: any
}>()

const emit = defineEmits(['update:assetData'])

const assetData = ref<any>({ assets: [...(props.assetData?.assets || [])] })

watch(() => props.assetData, (val) => {
  assetData.value = { assets: [...(val?.assets || [])] }
}, { deep: true })

const assetStatusOptions = [
  { value: '', label: 'Select status' },
  { value: 'returned', label: 'Returned' },
  { value: 'lost', label: 'Lost' }
]

const updateAssetStatus = (asset: any, status: string) => {
  asset.exitStatus = status
  if (status === 'returned') {
    asset.returnDate = new Date().toISOString().split('T')[0]
  } else {
    asset.returnDate = null
  }
  emitUpdate()
}

const handleStatusChange = (asset: any, value: string) => updateAssetStatus(asset, value)

const formatDate = (date: string) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString()
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES'
  }).format(value)
}

const emitUpdate = () => {
  emit('update:assetData', assetData.value)
}

const getAssetData = () => assetData.value

const resetAssetData = () => {
  assetData.value = { assets: [...(props.assetData?.assets || [])] }
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-600">Update the status of all company assets assigned to the employee. Any deductions for lost or damaged items will be automatically added to the final payroll when enabled.</p>
    <div v-if="assetData.assets.length === 0" class="text-sm text-gray-500">No assets assigned to this employee.</div>
    <div v-for="(asset, idx) in assetData.assets" :key="idx" class="border p-4 rounded-lg">
      <div class="flex justify-between items-start mb-3">
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900">{{ asset.name }}</h4>
          <p class="text-sm text-gray-500">{{ asset.description }}</p>
        </div>
        <USelect 
          v-model="asset.exitStatus"
          :options="assetStatusOptions"
          placeholder="Select status"
          @update:modelValue="handleStatusChange(asset, $event as string)"
          class="w-40"
        />
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-gray-600">Asset Value</p>
          <p class="font-semibold">{{ formatCurrency(asset.amount || 0) }}</p>
        </div>
        <div>
          <p class="text-gray-600">Status</p>
          <p class="font-semibold capitalize">{{ asset.exitStatus === '' ? 'Pending Return' : asset.exitStatus }}</p>
        </div>
        <div v-if="asset.returnDate">
          <p class="text-gray-600">Return Date</p>
          <p class="font-semibold">{{ formatDate(asset.returnDate) }}</p>
        </div>
        <div>
          <p class="text-gray-600">Serial Number</p>
          <p class="font-semibold">{{ asset.serial_number || 'N/A' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
