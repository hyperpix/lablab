<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ListView, Button, Dialog, FormControl, Avatar, Dropdown, Badge } from 'frappe-ui'
import { useTopbar } from '@/composables/useTopbar'
import { getInvestigations, getPatients } from '@/db/index'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideCheck       from '~icons/lucide/check'
import LucideFilter      from '~icons/lucide/list-filter'
import LucideAZ          from '~icons/lucide/arrow-up-a-z'
import LucideZA          from '~icons/lucide/arrow-down-a-z'
import LucideColumns     from '~icons/lucide/columns-2'
import LucidePencil      from '~icons/lucide/pencil'
import LucideTrash       from '~icons/lucide/trash-2'
import LucidePlus        from '~icons/lucide/plus'
import LucideX           from '~icons/lucide/x'
import LucideTrash2      from '~icons/lucide/trash-2'

const showAdd    = ref(false)
const showEdit   = ref(false)
const showDelete = ref(false)
const saving     = ref(false)

const form = ref({
  patient_id: '',
  laboratory: '',
  items: [
    { test_name: '', units: 1, cost: 0 }
  ],
  discount_percent: 0,
  tax_percent: 0,
  paid_amount: 0,
  notes: '',
  status: 'pending' as 'pending' | 'in_progress' | 'completed'
})

const editTarget   = ref<any>(null)
const deleteTarget = ref<any>(null)

const search    = ref('')
const sortBy    = ref('Patient')
const sortDir   = ref<'asc'|'desc'>('asc')

const sortOptions = computed(() => [
  { label: 'Patient', selected: sortBy.value === 'Patient', onClick: () => sortBy.value = 'Patient' },
  { label: 'Date',    selected: sortBy.value === 'Date',    onClick: () => sortBy.value = 'Date'    },
])

const { setActions } = useTopbar()
// Moved to onMounted to avoid race conditions during route transitions


const columns = [
  { label: 'Patient',    key: 'patient',            width: '200px' },
  { label: 'Test(s)',    key: 'tests_summary',      width: '280px' },
  { label: 'Laboratory', key: 'laboratory',         width: '180px' },
  { label: 'Total',      key: 'total_display',      width: '100px' },
  { label: 'Due',        key: 'due_display',        width: '100px' },
  { label: 'Status',     key: 'status',             width: '110px' },
  { label: '',           key: '_actions',           width: '80px'  },
]

const allRows      = ref<any[]>([])
const allPatients  = ref<any[]>([])
const loading      = ref(true)

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return allRows.value.map(inv => {
    const pt = allPatients.value.find(p => p.id === inv.patient_id)
    const items = inv.items || [{ test_name: inv.test_name, units: 1, cost: inv.cost || 0 }]
    const subtotal = items.reduce((acc: number, i: any) => acc + ((i.units || 1) * (i.cost || 0)), 0)
    const discountVal = subtotal * ((inv.discount_percent || 0) / 100)
    const taxVal = (subtotal - discountVal) * ((inv.tax_percent || 0) / 100)
    const total = subtotal - discountVal + taxVal
    const paid = inv.paid_amount || 0
    const due = total - paid
    
    return {
      ...inv,
      patient_name: pt?.full_name || 'Unknown Patient',
      patient_image: pt?.image,
      tests_summary: items.map((i: any) => i.test_name).join(', ') || inv.test_name || '—',
      total_display: `$${total.toLocaleString()}`,
      due_display: `$${due.toLocaleString()}`,
      status_final: inv.status
    }
  }).filter(r =>
    !q || r.patient_name.toLowerCase().includes(q) || r.tests_summary.toLowerCase().includes(q) || r.laboratory?.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  setActions([{ label: 'New Request', variant: 'solid', theme: 'blue', onClick: () => { showAdd.value = true } }])
  try {
    const [invs, pts] = await Promise.all([getInvestigations(), getPatients()])
    allRows.value = invs
    allPatients.value = pts
  } catch (e) {
    console.error('Failed to load data:', e)
  } finally {
    loading.value = false
  }
})

const patientOptions = computed(() => 
  allPatients.value.map(p => ({ label: p.full_name, value: p.id }))
)

const testOptions = [
  { label: 'Full Mouth X-Ray', value: 'Full Mouth X-Ray' },
  { label: 'Bitewing X-Ray',   value: 'Bitewing X-Ray'   },
  { label: 'CBCT Scan',        value: 'CBCT Scan'        },
  { label: 'Blood Test (CBC)', value: 'Blood Test (CBC)' },
  { label: 'Biopsy',           value: 'Biopsy'           },
]

function addItem() {
  form.value.items.push({ test_name: '', units: 1, cost: 0 })
}

function removeItem(idx: number) {
  form.value.items.splice(idx, 1)
}

const financials = computed(() => {
  const subtotal = form.value.items.reduce((acc, item) => acc + (item.units * (item.cost || 0)), 0)
  const discountVal = subtotal * (Number(form.value.discount_percent) / 100)
  const taxVal = (subtotal - discountVal) * (Number(form.value.tax_percent) / 100)
  const total = subtotal - discountVal + taxVal
  const paid = Number(form.value.paid_amount) || 0
  const due = total - paid
  return { subtotal, discountVal, taxVal, total, paid, due }
})

async function saveForm() {
  showAdd.value = false
  resetForm()
}

function resetForm() {
  form.value = {
    patient_id: '',
    laboratory: '',
    items: [{ test_name: '', units: 1, cost: 0 }],
    discount_percent: 0,
    tax_percent: 0,
    paid_amount: 0,
    notes: '',
    status: 'pending'
  }
}

function openEdit(row: any) {
  editTarget.value = row
  form.value = {
    patient_id: row.patient_id,
    laboratory: row.laboratory || '',
    items: row.items ? row.items.map((i: any) => ({ ...i })) : [{ test_name: row.test_name, units: 1, cost: row.cost || 0 }],
    discount_percent: row.discount_percent || 0,
    tax_percent: row.tax_percent || 0,
    paid_amount: row.paid_amount || 0,
    notes: row.notes || '',
    status: row.status || 'pending'
  }
  showEdit.value = true
}

function openDelete(row: any) {
  deleteTarget.value = row
  showDelete.value = true
}

function confirmDelete() {
  allRows.value = allRows.value.filter(r => r.id !== deleteTarget.value.id)
  showDelete.value = false
  deleteTarget.value = null
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-0">
      <div class="w-64">
        <FormControl
          v-model="search"
          placeholder="Search investigations…"
          :prefix-icon="'search'"
        />
      </div>
      <div class="flex items-center gap-1">
        <Button variant="subtle" size="sm" icon="refresh-cw" />
        <Button variant="subtle" size="sm">
          <template #prefix><LucideFilter class="size-4" /></template>
          Filter
        </Button>
        <div class="flex items-center">
          <Button
            variant="subtle"
            size="sm"
            class="!rounded-r-none !border-r-0"
            @click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'"
          >
            <LucideAZ v-if="sortDir === 'asc'" class="size-4" />
            <LucideZA v-else class="size-4" />
          </Button>
          <Dropdown :options="sortOptions">
            <template #default="{ open }">
              <Button variant="subtle" size="sm" class="!rounded-l-none">
                {{ sortBy }}
                <template #suffix>
                  <LucideChevronDown :class="open ? 'rotate-180' : ''" class="size-4 text-ink-gray-6 transition-transform" />
                </template>
              </Button>
            </template>
          </Dropdown>
        </div>
        <Button variant="subtle" size="sm">
          <template #prefix><LucideColumns class="size-4" /></template>
          Columns
        </Button>
      </div>
    </div>

    <!-- List View -->
    <ListView
      :columns="columns"
      :rows="filteredRows"
      row-key="id"
      :options="{
        selectable: false,
        showTooltip: false,
        emptyState: {
          title: loading ? 'Loading…' : 'No investigations',
          description: loading ? '' : 'Request a test to get started'
        }
      }"
    >
      <template #cell="{ item, column, row }">
        <div v-if="column.key === 'patient'" class="flex items-center gap-2">
          <Avatar :label="item.patient_name" :image="item.patient_image" size="sm" />
          <span class="text-sm font-medium text-ink-gray-9">{{ item.patient_name }}</span>
        </div>
        <div v-else-if="column.key === 'status'">
          <Badge
            :label="item.status_final"
            :theme="item.status_final === 'completed' ? 'green' : item.status_final === 'in_progress' ? 'blue' : 'orange'"
            variant="subtle"
            class="capitalize"
          />
        </div>
        <div v-else-if="column.key === '_actions'" class="flex items-center justify-end gap-1 w-full">
          <button
            class="flex items-center justify-center w-7 h-7 rounded text-ink-gray-4 hover:bg-surface-gray-2 hover:text-ink-gray-8 transition-colors"
            @click.stop="openEdit(row)"
          >
            <LucidePencil class="size-3.5" />
          </button>
          <button
            class="flex items-center justify-center w-7 h-7 rounded text-ink-gray-4 hover:bg-surface-red-1 hover:text-ink-red-3 transition-colors"
            @click.stop="openDelete(row)"
          >
            <LucideTrash class="size-3.5" />
          </button>
        </div>
        <span v-else-if="column.key === 'due_display'" class="text-sm text-ink-gray-9 font-medium">
          {{ item }}
        </span>
        <span v-else class="text-sm text-ink-gray-8">{{ item ?? '—' }}</span>
      </template>
    </ListView>

    <!-- XL Dialog UI -->
    <Dialog v-model="showAdd" :options="{ title: 'Investigation Request', size: 'xl' }">
      <template #body-content>
        <div class="flex flex-col gap-3 pt-1 w-full text-ink-gray-9">
          <div class="grid grid-cols-2 gap-4 w-full">
            <FormControl
              class="w-full"
              label="Patient"
              type="select"
              v-model="form.patient_id"
              :options="patientOptions"
              placeholder="Select patient"
            />
            <FormControl 
              class="w-full"
              label="Laboratory" 
              v-model="form.laboratory" 
              placeholder="e.g. Central Radiology"
            />
          </div>

          <div class="flex flex-col gap-2 mt-2 w-full">
            <div class="flex flex-col gap-2 w-full">
              <!-- Proportional Header -->
              <div class="grid grid-cols-[2fr_1fr_1fr_40px] gap-4 w-full px-0.5">
                <span class="text-xs font-medium text-ink-gray-5">Test / Investigation</span>
                <span class="text-xs font-medium text-ink-gray-5">Units</span>
                <span class="text-xs font-medium text-ink-gray-5">Cost</span>
                <div class="w-10"></div>
              </div>
              
              <!-- Items Rows -->
              <div v-for="(item, idx) in form.items" :key="idx" class="grid grid-cols-[2fr_1fr_1fr_40px] gap-4 items-center w-full px-0.5">
                <div class="w-full">
                  <FormControl 
                    class="w-full"
                    type="select"
                    v-model="item.test_name" 
                    :options="testOptions"
                    placeholder="Select test" 
                  />
                </div>
                <div class="w-full">
                  <FormControl 
                    class="w-full"
                    type="number" 
                    v-model="item.units" 
                    placeholder="Qty" 
                  />
                </div>
                <div class="w-full">
                  <FormControl 
                    class="w-full"
                    type="number" 
                    v-model="item.cost" 
                    placeholder="Price" 
                  />
                </div>
                <div class="flex items-center justify-center h-full">
                  <button 
                    v-if="form.items.length > 1"
                    class="flex items-center justify-center w-7 h-7 rounded text-ink-gray-4 hover:bg-surface-red-1 hover:text-ink-red-3 transition-colors"
                    @click="removeItem(idx)"
                  >
                    <LucideTrash2 class="size-4" />
                  </button>
                  <div v-else class="w-7 h-7"></div>
                </div>
              </div>
            </div>

            <div class="flex items-center mt-1 px-0.5">
              <Button variant="subtle" size="sm" @click="addItem">
                <template #prefix><LucidePlus class="size-3.5" /></template>
                Add Test
              </Button>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-4 border-t pt-4 mt-2 w-full">
            <FormControl class="w-full" label="Status" type="select" v-model="form.status" :options="['pending', 'in_progress', 'completed']" />
            <FormControl class="w-full" label="Discount (%)" type="number" v-model="form.discount_percent" />
            <FormControl class="w-full" label="Tax (%)" type="number" v-model="form.tax_percent" />
            <FormControl class="w-full" label="Paid Amount ($)" type="number" v-model="form.paid_amount" />
          </div>

          <FormControl class="w-full" label="Clinical Notes" type="textarea" v-model="form.notes" placeholder="Notes..." />

          <div class="flex flex-col gap-1 pt-3 border-t mt-1 w-full text-ink-gray-9">
            <div class="flex justify-between items-center text-xs opacity-70">
              <span>Subtotal</span>
              <span>${{ financials.subtotal.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-dashed mt-1 pt-2">
              <span class="text-sm font-normal">Total Bill</span>
              <span class="text-lg font-normal text-blue-600">${{ financials.total.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm font-normal">Amount Due</span>
              <span class="text-lg font-normal">
                ${{ financials.due.toLocaleString() }}
              </span>
            </div>
          </div>

          <div class="flex gap-2 justify-end pt-4 border-t w-full">
            <Button label="Cancel" variant="outline" @click="showAdd = false" />
            <Button label="Save Request" variant="solid" theme="blue" @click="saveForm" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Delete Dialog -->
    <Dialog v-model="showDelete" :options="{ title: 'Delete Request', size: 'sm' }">
      <template #body-content>
        <p class="text-sm text-ink-gray-7 mb-4">
          Are you sure you want to delete this investigation request?
        </p>
        <div class="flex gap-2 justify-end">
          <Button label="Cancel" variant="outline" @click="showDelete = false" />
          <Button label="Delete" variant="solid" theme="red" @click="confirmDelete" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
