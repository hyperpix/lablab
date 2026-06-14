<script setup lang="ts">
defineProps<{
  item: {
    name: string
    label: string
    phone?: string
    email?: string
    gender?: string
  }
  active: boolean
}>()
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
    :class="active ? 'bg-surface-gray-2' : ''"
  >
    <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
      {{ item.label?.[0]?.toUpperCase() ?? '?' }}
    </div>
    <div class="flex-1 min-w-0">
      <div class="text-sm font-medium text-ink-gray-9 truncate">{{ item.label }}</div>
      <div class="text-xs text-ink-gray-5 truncate">
        <span v-if="item.phone">{{ item.phone }}</span>
        <span v-if="item.phone && item.email"> · </span>
        <span v-if="item.email">{{ item.email }}</span>
        <span v-if="!item.phone && !item.email">No contact info</span>
      </div>
    </div>
    <span class="text-xs text-ink-gray-4 capitalize flex-shrink-0">{{ item.gender }}</span>
  </div>
</template>
