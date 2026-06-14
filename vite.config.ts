import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { fileURLToPath, URL } from 'node:url'
// @ts-ignore
import * as LucideStatic from 'lucide-static'

// Resolve ~icons/lucide/icon-name → inline Vue components from lucide-static
const VIRTUAL_PREFIX = '~icons/lucide/'
const RESOLVED_PREFIX = '\0~icons/lucide/'

function camelToDash(key: string) {
  let s = key.replace(/[A-Z0-9]/g, m => '-' + m.toLowerCase())
  return s.startsWith('-') ? s.slice(1) : s
}

const iconMap: Record<string, string> = {}
for (const [key, svg] of Object.entries(LucideStatic)) {
  if (key === 'default' || typeof svg !== 'string') continue
  const fixed = svg.replace(/stroke-width="2"/g, 'stroke-width="1.5"')
  iconMap[camelToDash(key)] = fixed
  iconMap[key] = fixed
}

function lucideIconsPlugin() {
  return {
    name: 'dently-lucide-icons',
    resolveId(id: string) {
      if (id.startsWith(VIRTUAL_PREFIX)) return RESOLVED_PREFIX + id.slice(VIRTUAL_PREFIX.length)
    },
    load(id: string) {
      if (!id.startsWith(RESOLVED_PREFIX)) return
      const name = id.slice(RESOLVED_PREFIX.length)
      const svg = iconMap[name]
      const innerHTML = svg
        ? (svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1] ?? '').replace(/>\s+</g, '><').trim()
        : ''
      return `import { h } from 'vue'
export default {
  inheritAttrs: false,
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16', height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.5',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      ...this.$attrs,
      innerHTML: ${JSON.stringify(innerHTML)},
    })
  }
}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({ include: ['events', 'buffer', 'process', 'stream', 'util', 'path', 'crypto'] }),
    vue(),
    lucideIconsPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api/band': {
        target: 'https://app.band.ai/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/band/, ''),
      }
    }
  },
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    exclude: ['frappe-ui'],
    include: [
      'feather-icons',
      'highlight.js',
      'highlight.js/lib/core',
      'interactjs',
      'debug',
    ],
  },
})
