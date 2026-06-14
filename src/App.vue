<template>
  <FrappeUIProvider>
    <RouterView />
  </FrappeUIProvider>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { FrappeUIProvider } from 'frappe-ui'
</script>
