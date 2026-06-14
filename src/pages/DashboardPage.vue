<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Dropdown } from 'frappe-ui'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideCheck       from '~icons/lucide/check'
import LucideCalendar    from '~icons/lucide/calendar'
import LucideFlask       from '~icons/lucide/flask-conical'
import LucidePackage     from '~icons/lucide/package'
import LucideTruck       from '~icons/lucide/truck'
import LucideReceipt     from '~icons/lucide/receipt'
import LucideWrench      from '~icons/lucide/wrench'
import LucideMonitor     from '~icons/lucide/monitor'
import LucidePlus        from '~icons/lucide/plus'
import { getStatistics, getAppointments, type Statistics } from '@/db/index'
import ItemList from '@/components/ItemList.vue'

const router = useRouter()
const dateRange = ref('Last 30 Days')
const team      = ref('All Teams')

const dateRangeOptions = computed(() => [
  { label: 'Today',        selected: dateRange.value === 'Today',        onClick: () => dateRange.value = 'Today'        },
  { label: 'Last 7 Days',  selected: dateRange.value === 'Last 7 Days',  onClick: () => dateRange.value = 'Last 7 Days'  },
  { label: 'Last 30 Days', selected: dateRange.value === 'Last 30 Days', onClick: () => dateRange.value = 'Last 30 Days' },
  { label: 'Last 90 Days', selected: dateRange.value === 'Last 90 Days', onClick: () => dateRange.value = 'Last 90 Days' },
  { label: 'This Year',    selected: dateRange.value === 'This Year',    onClick: () => dateRange.value = 'This Year'    },
])

const teamOptions = computed(() => [
  { label: 'All Teams',  selected: team.value === 'All Teams',  onClick: () => team.value = 'All Teams'  },
  { label: 'Dr. Carter', selected: team.value === 'Dr. Carter', onClick: () => team.value = 'Dr. Carter' },
  { label: 'Dr. Rivera', selected: team.value === 'Dr. Rivera', onClick: () => team.value = 'Dr. Rivera' },
  { label: 'Dr. Lee',    selected: team.value === 'Dr. Lee',    onClick: () => team.value = 'Dr. Lee'    },
])

const stats = ref<Statistics>({ totalPatients: 0, totalAppointments: 0, revenue: 0, appointmentsByMonth: [], revenueByMonth: [], treatmentFrequency: [] })
const appointments = ref<Awaited<ReturnType<typeof getAppointments>>>([])

const todayStart = new Date(); todayStart.setHours(0,0,0,0)
const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999)
const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0)

const todayCount   = computed(() => appointments.value.filter(a => a.date >= todayStart.getTime() && a.date <= todayEnd.getTime()).length)
const monthRevenue = computed(() => appointments.value.filter(a => a.is_done && a.date >= monthStart.getTime()).reduce((s, a) => s + a.paid_amount, 0))
const pending      = computed(() => appointments.value.filter(a => !a.is_done).length)

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

const kpis = computed(() => [
  { label: 'Patients',             value: String(stats.value.totalPatients)  },
  { label: 'Appointments Today',   value: String(todayCount.value)           },
  { label: 'Revenue',              value: formatCurrency(monthRevenue.value) },
  { label: 'Pending',              value: String(pending.value)              },
])

// ── Appointments ──────────────────────────────────────────────────────────────
const appointmentItems: { label: string; description: string; icon: unknown; selected?: boolean }[] = []

// ── Lab Work ──────────────────────────────────────────────────────────────────
const labWorkGroups: { group: string; items: { label: string; description: string; icon: unknown; selected?: boolean }[] }[] = []

onMounted(async () => {
  try {
    const [s, a] = await Promise.all([getStatistics(), getAppointments()])
    stats.value        = s
    appointments.value = a
  } catch {}
})
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- Filters -->
    <div class="flex items-center gap-2">
      <Dropdown :options="dateRangeOptions">
        <template #default="{ open }">
          <Button variant="outline" size="sm">
            {{ dateRange }}
            <template #suffix>
              <LucideChevronDown :class="open ? 'rotate-180' : ''" class="size-4 text-ink-gray-6 transition-transform" />
            </template>
          </Button>
        </template>
        <template #item-suffix="{ selected }">
          <LucideCheck v-if="selected" class="size-4 text-ink-gray-7" />
        </template>
      </Dropdown>
      <Dropdown :options="teamOptions">
        <template #default="{ open }">
          <Button variant="outline" size="sm">
            {{ team }}
            <template #suffix>
              <LucideChevronDown :class="open ? 'rotate-180' : ''" class="size-4 text-ink-gray-6 transition-transform" />
            </template>
          </Button>
        </template>
        <template #item-suffix="{ selected }">
          <LucideCheck v-if="selected" class="size-4 text-ink-gray-7" />
        </template>
      </Dropdown>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="kpi in kpis"
        :key="kpi.label"
        class="rounded-lg border border-outline-gray-2 bg-surface-white p-5 flex flex-col gap-2"
      >
        <span class="text-xs font-medium text-ink-gray-5 tracking-wide">{{ kpi.label }}</span>
        <span class="text-3xl font-bold text-ink-gray-9">{{ kpi.value }}</span>
      </div>
    </div>

    <!-- Two ItemLists -->
    <div class="grid grid-cols-2 gap-4">

      <!-- Appointments -->
      <div class="rounded-lg border border-outline-gray-2 bg-surface-white p-1.5 min-h-[300px] flex flex-col">
        <div class="px-2 pt-1.5 pb-1 text-xs font-medium text-ink-gray-4 tracking-wide">
          Appointments today
        </div>
        <template v-if="appointmentItems.length">
          <ItemList :items="appointmentItems">
            <template #item-prefix="{ item }">
              <component :is="item.icon" class="size-4 text-ink-gray-6" />
            </template>
            <template #item-suffix="{ item }">
              <LucideCheck v-if="item.selected" class="size-4 text-ink-green-3" />
            </template>
          </ItemList>
        </template>
        <template v-else>
          <div class="flex flex-col items-center justify-center flex-1 gap-3 px-4 text-center">
            <div>
              <p class="text-sm font-medium text-ink-gray-6">No appointments today</p>
              <p class="text-xs text-ink-gray-4 mt-1">Schedule a new appointment to get started</p>
            </div>
            <Button variant="solid" theme="gray" size="sm" @click="router.push('/appointments')">
              <template #prefix>
                <LucidePlus class="size-4" />
              </template>
              New Appointment
            </Button>
          </div>
        </template>
      </div>

      <!-- Investigations -->
      <div class="rounded-lg border border-outline-gray-2 bg-surface-white p-1.5 min-h-[300px] flex flex-col">
        <div class="px-2 pt-1.5 pb-1 text-xs font-medium text-ink-gray-4 tracking-wide">
          Investigations
        </div>
        <template v-if="labWorkGroups.length">
          <ItemList :groups="labWorkGroups">
            <template #item-prefix="{ item }">
              <component :is="item.icon" class="size-4 text-ink-gray-6" />
            </template>
            <template #item-suffix="{ item }">
              <LucideCheck v-if="item.selected" class="size-4 text-ink-green-3" />
            </template>
          </ItemList>
        </template>
        <template v-else>
          <div class="flex flex-col items-center justify-center flex-1 gap-3 px-4 text-center">
            <div>
              <p class="text-sm font-medium text-ink-gray-6">No lab work in progress</p>
              <p class="text-xs text-ink-gray-4 mt-1">Lab cases will appear here once you add them</p>
            </div>
            <Button variant="solid" theme="gray" size="sm" @click="router.push('/appointments')">
              <template #prefix>
                <LucidePlus class="size-4" />
              </template>
              New Lab Work
            </Button>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>
