<script setup lang="ts">
defineProps<{
  items?: {
    label: string
    description?: string
    selected?: boolean
    disabled?: boolean
    icon?: any
    onClick?: () => void
  }[]
  groups?: {
    group: string
    items: {
      label: string
      description?: string
      selected?: boolean
      disabled?: boolean
      icon?: any
      onClick?: () => void
    }[]
  }[]
}>()
</script>

<template>
  <div class="flex flex-col">

    <!-- Flat mode -->
    <template v-if="items">
      <button
        v-for="item in items"
        :key="item.label"
        :disabled="item.disabled"
        class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors w-full"
        :class="[
          item.selected  ? 'bg-surface-gray-2' : 'hover:bg-surface-gray-1',
          item.disabled  ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        ]"
        @click="item.onClick?.()"
      >
        <span class="flex-shrink-0">
          <slot name="item-prefix" :item="item" />
        </span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm text-ink-gray-8 truncate">{{ item.label }}</span>
          <span v-if="item.description" class="block text-xs text-ink-gray-5 truncate">{{ item.description }}</span>
        </span>
        <span class="flex-shrink-0">
          <slot name="item-suffix" :item="item" />
        </span>
      </button>
    </template>

    <!-- Grouped mode -->
    <template v-if="groups">
      <div v-for="group in groups" :key="group.group" class="flex flex-col">
        <span class="px-2 py-1.5 text-xs font-medium text-ink-gray-4 uppercase tracking-wide">
          {{ group.group }}
        </span>
        <button
          v-for="item in group.items"
          :key="item.label"
          :disabled="item.disabled"
          class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors w-full"
          :class="[
            item.selected  ? 'bg-surface-gray-2' : 'hover:bg-surface-gray-1',
            item.disabled  ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
          ]"
          @click="item.onClick?.()"
        >
          <span class="flex-shrink-0">
            <slot name="item-prefix" :item="item" />
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-sm text-ink-gray-8 truncate">{{ item.label }}</span>
            <span v-if="item.description" class="block text-xs text-ink-gray-5 truncate">{{ item.description }}</span>
          </span>
          <span class="flex-shrink-0">
            <slot name="item-suffix" :item="item" />
          </span>
        </button>
      </div>
    </template>

  </div>
</template>
