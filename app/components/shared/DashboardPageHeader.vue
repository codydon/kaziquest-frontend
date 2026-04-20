<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  breadcrumb?: string
  backTo?: string
  onBack?: () => void
  showBack?: boolean
  showSidebarToggle?: boolean
}>(), {
  breadcrumb: '',
  backTo: '',
  showBack: true,
  showSidebarToggle: true
})

const router = useRouter()

function onBackClick() {
  if (typeof props.onBack === 'function') {
    props.onBack()
    return
  }
  if (props.backTo) {
    void router.push(props.backTo)
    return
  }
  void router.back()
}
</script>

<template>
  <div class="relative">
    <UDashboardSidebarCollapse
      v-if="showSidebarToggle"
      square
      size="sm"
      class="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-default bg-default shadow-sm lg:inline-flex"
    />
    <UDashboardNavbar :ui="{ right: 'gap-3' }">
      <template #leading>
        <div class="flex min-w-0 items-start gap-2">
          <UButton
            v-if="showBack"
            icon="i-lucide-arrow-left"
            variant="ghost"
            color="neutral"
            square
            aria-label="Go back"
            @click="onBackClick"
          />
          <div class="min-w-0">
            <p class="truncate text-base font-semibold text-highlighted sm:text-lg">
              {{ title }}
            </p>
            <p v-if="breadcrumb" class="truncate text-xs text-primary/80">
              {{ breadcrumb }}
            </p>
          </div>
        </div>
      </template>
      <template #default>
        <slot />
      </template>
      <template #trailing>
        <slot name="trailing" />
      </template>
      <template #right>
        <slot name="right" />
      </template>
    </UDashboardNavbar>
    <slot name="toolbar" />
  </div>
</template>
