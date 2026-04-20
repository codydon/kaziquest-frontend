<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <HiringPanel id="hiring-settings" title="Hiring Settings" description="Manage applicant stages used across your hiring pipeline.">
    <UCard :ui="{ body: 'space-y-4' }">
      <div>
        <h3 class="font-semibold">
          Applicant Stages
        </h3>
        <p class="text-sm text-muted">
          Configure the statuses recruiters can use to progress applicants.
        </p>
      </div>

      <HiringApplicantStagesManager />
    </UCard>
  </HiringPanel>
</template>
