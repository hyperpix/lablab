<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  color?: string
  size?: number
}>(), {
  color: '#5227FF',
  size: 1,
})

const emit = defineEmits<{ open: [] }>()

function darkenColor(hex: string, percent: number): string {
  let color = hex.startsWith('#') ? hex.slice(1) : hex
  if (color.length === 3) color = color.split('').map(c => c + c).join('')
  const num = parseInt(color, 16)
  let r = (num >> 16) & 0xff
  let g = (num >> 8) & 0xff
  let b = num & 0xff
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))))
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))))
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
}

const folderBackColor = computed(() => darkenColor(props.color, 0.08))
</script>

<template>
  <div
    :style="{
      width:     `${160 * size}px`,
      height:    `${144 * size}px`,
      overflow:  'visible',
      flexShrink: 0,
    }"
    @click="emit('open')"
  >
    <div :style="{ transform: `scale(${size})`, transformOrigin: 'top left' }">
      <div
        class="folder"
        :style="{ '--folder-color': color, '--folder-back-color': folderBackColor }"
      >
        <div class="folder__back">
          <div class="paper paper-1" />
          <div class="paper paper-2" />
          <div class="paper paper-3" />
          <div class="folder__front" />
          <div class="folder__front right" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.folder {
  transition: transform 0.2s ease-in;
  cursor: pointer;
}

.folder:hover {
  transform: translateY(-6px);
}

.folder:hover .paper {
  transform: translate(-50%, 0%);
}

.folder:hover .folder__front {
  transform: skew(15deg) scaleY(0.6);
}

.folder:hover .right {
  transform: skew(-15deg) scaleY(0.6);
}

.folder__back {
  position: relative;
  width: 160px;
  height: 128px;
  background: var(--folder-back-color);
  border-radius: 0px 14px 14px 14px;
}

.folder__back::after {
  position: absolute;
  z-index: 0;
  bottom: 98%;
  left: 0;
  content: '';
  width: 48px;
  height: 16px;
  background: var(--folder-back-color);
  border-radius: 8px 8px 0 0;
}

.paper {
  position: absolute;
  z-index: 2;
  bottom: 10%;
  left: 50%;
  transform: translate(-50%, 10%);
  width: 70%;
  height: 80%;
  background: #e6e6e6;
  border-radius: 10px;
  transition: all 0.3s ease-in-out;
}

.paper.paper-2 {
  background: #f2f2f2;
  width: 80%;
  height: 70%;
}

.paper.paper-3 {
  background: #ffffff;
  width: 90%;
  height: 60%;
}

.folder__front {
  position: absolute;
  z-index: 3;
  width: 100%;
  height: 100%;
  background: var(--folder-color);
  border-radius: 5px 14px 14px 14px;
  transform-origin: bottom;
  transition: all 0.3s ease-in-out;
}
</style>
