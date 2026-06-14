<script setup lang="ts">
import { ref, reactive, computed, markRaw, onMounted, onBeforeUnmount } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { Sidebar, SidebarItem, CommandPalette, CommandPaletteItem, Breadcrumbs, Button, FormControl } from 'frappe-ui'
import { useAuthStore } from '@/stores/auth'
import { getSetting, getPatients, type Patient } from '@/db/index'

import PatientCommandItem from '@/components/PatientCommandItem.vue'
import AppLogo from '@/components/AppLogo.vue'
import { useTopbar } from '@/composables/useTopbar'

import Dashboard    from '~icons/lucide/layout-dashboard'
import Patients     from '~icons/lucide/users'
import Calendar     from '~icons/lucide/calendar'
import Treatments   from '~icons/lucide/stethoscope'


import LogoutIcon   from '~icons/lucide/log-out'
import Moon         from '~icons/lucide/moon'
import SearchIcon   from '~icons/lucide/search'
import Bell         from '~icons/lucide/bell'
import SunIcon      from '~icons/lucide/sun'
import FilterIcon   from '~icons/lucide/list-filter'
import SortIcon     from '~icons/lucide/arrow-up-down'
import RefreshIcon  from '~icons/lucide/refresh-cw'
import Plan         from '~icons/lucide/clipboard-list'
import Investigate  from '~icons/lucide/microscope'
import Due          from '~icons/lucide/wallet'


const auth      = useAuthStore()
const router    = useRouter()
const route     = useRoute()
const { actions: topbarActions, toolbarConfig, toolbarSearch, clearAll } = useTopbar()

const isCollapsed = ref(false)

router.beforeEach(() => { clearAll() })

const breadcrumbs = computed(() => {
  const p = route.path
  if (p.startsWith('/patients/') && p.length > '/patients/'.length) {
    return [
      { label: 'Patients', route: '/patients' },
      { label: 'Profile' },
    ]
  }
  if (p.startsWith('/appointments/') && p.length > '/appointments/'.length) {
    return [
      { label: 'Appointments', route: '/appointments' },
      { label: 'Details' },
    ]
  }
  const map: Record<string, string> = {
    '/':                    'Dashboard',
    '/patients':            'Patients',
    '/appointments':        'Appointments',
    '/treatments':          'Treatments',
    '/prescriptions/create': 'New Prescription',
    '/scribe':              'Scribe',
    '/billing/plan':        'Treatment Plan',
    '/billing/investigate': 'Investigation',
    '/billing/due':         'Due Collection',
  }
  return [{ label: map[p] ?? '' }]
})

const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark')
function toggleThemeIcon() {
  const next = isDark.value ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  isDark.value = !isDark.value
}
const clinicName = ref('')
const showSearch  = ref(false)
const searchQuery = ref('')
const allPatients = ref<Patient[]>([])

const navItems = [
  { name: 'nav-dashboard',    title: 'Dashboard',      icon: markRaw(Dashboard),   route: '/'             },
  { name: 'nav-patients',     title: 'Patients',       icon: markRaw(Patients),    route: '/patients'     },
  { name: 'nav-appointments', title: 'Appointments',   icon: markRaw(Calendar),    route: '/appointments' },
  { name: 'nav-treatments',   title: 'Treatments',     icon: markRaw(Treatments),  route: '/treatments'   },
  { name: 'nav-billing-plan', title: 'Treatment Plan', icon: markRaw(Plan),        route: '/billing/plan' },
  { name: 'nav-investigations', title: 'Investigations', icon: markRaw(Investigate), route: '/billing/investigate' },
  { name: 'nav-billing-due',  title: 'Due Collection', icon: markRaw(Due),         route: '/billing/due'  },
]

const searchGroups = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  const navGroup = {
    title:     'Jump to',
    component: markRaw(CommandPaletteItem),
    items:     (!q ? navItems : navItems.filter(n => n.title.toLowerCase().includes(q))),
  }
  if (!q) return [navGroup]
  const filteredPts = allPatients.value.filter(p =>
    p.name.toLowerCase().includes(q) || p.phone?.includes(q) || p.email?.toLowerCase().includes(q)
  ).slice(0, 6)
  const groups = []
  if (navGroup.items.length) groups.push(navGroup)
  if (filteredPts.length) {
    groups.push({
      title:     'Patients',
      component: markRaw(PatientCommandItem),
      items:     filteredPts.map(p => ({
        name: p.id, title: p.name, label: p.name, phone: p.phone ?? '', email: p.email ?? '', gender: p.gender ?? '',
      })),
    })
  }
  return groups
})

function onSearchSelect(item: { name: string; route?: string }) {
  showSearch.value = false
  if (item.route) router.push(item.route)
  else router.push(`/patients/${item.name}`)
}

function openSearch() { showSearch.value = true }
function toggleTheme() { toggleThemeIcon() }
function handleLogout() { auth.logout(); router.push('/login') }

onMounted(async () => {
  try {
    const [v, pts] = await Promise.all([getSetting('clinicName'), getPatients()])
    if (v) clinicName.value = v as string
    allPatients.value = pts ?? []
  } catch (e) {
    console.error('Failed to load patients', e)
    allPatients.value = []
  }
})

const sidebar = reactive({
  header: {
    title: 'Dently',
    subtitle: computed(() => clinicName.value || auth.session?.name || ''),
    logo: markRaw(AppLogo),
    menuItems: [
      { label: 'Toggle Theme', icon: markRaw(Moon),       onClick: toggleTheme   },
    ],
  },
  sections: [
    {
      label: 'Main',
      collapsible: false,
      items: [
        { label: 'Search',       icon: markRaw(SearchIcon), onClick: openSearch },
        { label: 'Dashboard',    icon: markRaw(Dashboard),  to: '/'             },
        { label: 'Patients',     icon: markRaw(Patients),   to: '/patients'     },
        { label: 'Appointments', icon: markRaw(Calendar),   to: '/appointments' },
        { label: 'Treatments',   icon: markRaw(Treatments), to: '/treatments'   },
        { label: 'Treatment Plan', icon: markRaw(Plan),        to: '/billing/plan'         },
        { label: 'Investigations',  icon: markRaw(Investigate), to: '/billing/investigate'  },
        { label: 'Due Collection',  icon: markRaw(Due),         to: '/billing/due'          },
      ],
    },
  ],
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-surface-white">
    <Sidebar :header="sidebar.header" :sections="sidebar.sections" v-model:collapsed="isCollapsed">


      <template #sidebar-item="{ item, isCollapsed }">
        <Button
          v-if="item.label === 'Search'"
          variant="ghost"
          class="!w-full focus-visible:ring-0 focus:outline-none hover:bg-surface-gray-2"
          @click="openSearch"
        >
          <template #icon>
            <div class="flex w-full items-center justify-between transition-all ease-in-out px-2 py-1">
              <div class="flex items-center truncate">
                <span class="grid flex-shrink-0 place-items-center">
                  <SearchIcon class="size-4 text-ink-gray-6" />
                </span>
                <span
                  class="flex-1 flex-shrink-0 truncate text-sm transition-all ease-in-out"
                  :class="isCollapsed ? 'ml-0 w-0 overflow-hidden opacity-0' : 'ml-2 w-auto opacity-100'"
                >Search</span>
              </div>
            </div>
          </template>
        </Button>
        <SidebarItem
          v-else
          :label="item.label"
          :icon="item.icon"
          :to="item.to"
          :is-active="item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)"
          :suffix="item.suffix"
        />
      </template>
    </Sidebar>

    <div class="flex flex-col flex-1 min-w-0">
      <header class="flex items-center justify-between h-[49px] px-5 border-b border-outline-gray-2 flex-shrink-0">
        <div class="flex items-center gap-2">
          <Breadcrumbs :items="breadcrumbs" />
        </div>
        <div class="flex items-center gap-1">
          <template v-if="toolbarConfig">
            <button v-if="toolbarConfig.refresh" class="flex items-center justify-center w-7 h-7 rounded text-ink-gray-5 hover:bg-surface-gray-2 hover:text-ink-gray-8 transition-colors" @click="toolbarConfig.onRefresh?.()"><RefreshIcon class="size-3.5" /></button>
            <button v-if="toolbarConfig.filter" class="flex items-center gap-1.5 px-2.5 h-7 rounded text-sm text-ink-gray-6 hover:bg-surface-gray-2 hover:text-ink-gray-8 transition-colors"><FilterIcon class="size-3.5" />Filter</button>
            <button v-if="toolbarConfig.sort" class="flex items-center gap-1.5 px-2.5 h-7 rounded text-sm text-ink-gray-6 hover:bg-surface-gray-2 hover:text-ink-gray-8 transition-colors"><SortIcon class="size-3.5" />Sort</button>
            <div v-if="topbarActions.length" class="w-px h-4 bg-outline-gray-2 mx-1" />
          </template>
          <Button
            v-for="action in topbarActions"
            :key="action.label"
            :label="action.label"
            :variant="action.variant ?? 'solid'"
            :theme="action.theme ?? 'blue'"
            :loading="action.loading"
            size="sm"
            @click="action.onClick"
          />
        </div>
      </header>
      <div v-if="toolbarConfig" class="flex items-center px-5 h-10 bg-surface-white flex-shrink-0">
        <div class="w-64"><FormControl v-model="toolbarSearch" :placeholder="toolbarConfig.searchPlaceholder ?? 'Search…'" size="sm" :prefix-icon="'search'" /></div>
      </div>
      <main class="flex-1 overflow-y-auto p-7">
        <RouterView />
      </main>
    </div>

    <CommandPalette v-model:show="showSearch" v-model:searchQuery="searchQuery" :groups="searchGroups" @select="onSearchSelect" />
  </div>
</template>
