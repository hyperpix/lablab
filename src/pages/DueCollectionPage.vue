<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTopbar } from '@/composables/useTopbar'
import { ListView, Button, Dialog, FormControl, Avatar, Badge, Dropdown, DatePicker } from 'frappe-ui'
import { getInvoices, getPatients, type Invoice } from '@/db/index'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideCheck       from '~icons/lucide/check'
import LucideFilter      from '~icons/lucide/list-filter'
import LucideAZ          from '~icons/lucide/arrow-up-a-z'
import LucideZA          from '~icons/lucide/arrow-down-a-z'
import LucideColumns     from '~icons/lucide/columns-2'
import LucidePencil      from '~icons/lucide/pencil'
import LucideTrash       from '~icons/lucide/trash-2'
import LucideSend        from '~icons/lucide/send'
import LucidePlus        from '~icons/lucide/plus'
import LucideCalendar    from '~icons/lucide/calendar'

const { setActions } = useTopbar()

const allInvoices = ref<Invoice[]>([])
const allPatients = ref<any[]>([])
const loading     = ref(true)
const search      = ref('')
const sortBy      = ref('Date')
const sortDir     = ref<'asc'|'desc'>('desc')

const showPayment = ref(false)
const selectedInvoice = ref<any>(null)
const globalPatientId = ref('')

const paymentForm = ref({
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  method: 'Cash',
  notes: ''
})

// Moved to onMounted to avoid race conditions during route transitions


const sortOptions = computed(() => [
  { label: 'Date',    selected: sortBy.value === 'Date',    onClick: () => sortBy.value = 'Date'    },
  { label: 'Patient', selected: sortBy.value === 'Patient', onClick: () => sortBy.value = 'Patient' },
  { label: 'Amount',  selected: sortBy.value === 'Amount',  onClick: () => sortBy.value = 'Amount'  },
])

const columns = [
  { label: 'Date',        key: 'issued_date_str', width: '110px' },
  { label: 'Amount',      key: 'due_display',     width: '110px' },
  { label: 'Patient',     key: 'patient',         width: '200px' },
  { label: 'Description', key: 'notes',           width: 'auto'  },
  { label: 'Status',      key: 'status',          width: '100px' },
  { label: '',            key: '_actions',        width: '100px' },
]

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return allInvoices.value
    .filter(inv => inv.paid_amount < inv.amount)
    .map(inv => {
      const pt = allPatients.value.find(p => p.id === inv.patient_id)
      const due = inv.amount - inv.paid_amount
      return {
        ...inv,
        patient_name: pt?.full_name || pt?.name || 'Unknown Patient',
        patient_image: pt?.image,
        total_display: `$${inv.amount.toLocaleString()}`,
        paid_display: `$${inv.paid_amount.toLocaleString()}`,
        due_display: `$${due.toLocaleString()}`,
        due_num: due,
        issued_date_str: new Date(inv.issued_date).toLocaleDateString(),
        status_label: due > 1000 ? 'Overdue' : 'Pending'
      }
    })
    .filter(r => !q || r.patient_name.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sortBy.value === 'Date') {
        return sortDir.value === 'asc' ? a.issued_date - b.issued_date : b.issued_date - a.issued_date
      }
      if (sortBy.value === 'Amount') {
        return sortDir.value === 'asc' ? a.due_num - b.due_num : b.due_num - a.due_num
      }
      return 0
    })
})

const totalOutstanding = computed(() => {
  return filteredRows.value.reduce((acc, curr) => acc + curr.due_num, 0)
})

onMounted(async () => {
  setActions([
    { 
      label: 'Pay Due', 
      variant: 'solid', 
      theme: 'blue', 
      onClick: () => { 
        selectedInvoice.value = null
        globalPatientId.value = ''
        paymentForm.value = {
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          method: 'Cash',
          notes: ''
        }
        showPayment.value = true 
      } 
    },
    { label: 'Bulk Reminder', variant: 'outline', onClick: () => {} }
  ])
  try {
    const [invs, pts] = await Promise.all([getInvoices(), getPatients()])
    allInvoices.value = invs
    allPatients.value = pts

    const pid = route.query.patient_id as string
    if (pid) {
      globalPatientId.value = pid
      const due = allInvoices.value
        .filter(i => i.patient_id === pid)
        .reduce((acc, i) => acc + (i.amount - i.paid_amount), 0)
      paymentForm.value.amount = due
      showPayment.value = true
    }

    if (allInvoices.value.length === 0) {
      const mockPatient = allPatients.value[0]?.id || 'mock-id'
      allInvoices.value = [
        {
          id: 'inv-1',
          patient_id: mockPatient,
          amount: 2500,
          paid_amount: 500,
          notes: 'Orthodontic Phase 1 - Braces adjustment',
          issued_date: Date.now() - 86400000 * 5,
          appointment_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'inv-2',
          patient_id: mockPatient,
          amount: 800,
          paid_amount: 0,
          notes: 'Root Canal Treatment',
          issued_date: Date.now() - 86400000 * 2,
          appointment_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    }
  } catch (e) {
    console.error('Failed to load dues:', e)
  } finally {
    loading.value = false
  }
})

function openPayment(row: any) {
  selectedInvoice.value = row
  paymentForm.value = {
    amount: row.due_num,
    date: new Date().toISOString().split('T')[0],
    method: 'Cash',
    notes: ''
  }
  showPayment.value = true
}

function savePayment() {
  showPayment.value = false
}

const patientOptions = computed(() => 
  allPatients.value.map(p => ({ label: p.full_name, value: p.id }))
)

const activePatientDue = computed(() => {
  if (selectedInvoice.value) return selectedInvoice.value.due_num
  if (globalPatientId.value) {
    const invs = allInvoices.value.filter(i => i.patient_id === globalPatientId.value)
    return invs.reduce((acc, i) => acc + (i.amount - i.paid_amount), 0)
  }
  return 0
})
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-0">
      <div class="w-64">
        <FormControl
          v-model="search"
          placeholder="Search collections…"
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
          title: loading ? 'Loading…' : 'No outstanding dues',
          description: loading ? '' : 'All payments are settled!'
        }
      }"
    >
      <template #cell="{ item, column, row }">
        <div v-if="column.key === 'patient'" class="flex items-center gap-2">
          <Avatar :label="row.patient_name" :image="row.patient_image" size="sm" />
          <span class="text-sm font-medium text-ink-gray-9">{{ row.patient_name }}</span>
        </div>
        <div v-else-if="column.key === 'status'">
          <Badge
            :label="row.status_label"
            :theme="row.status_label === 'Overdue' ? 'red' : 'orange'"
            variant="subtle"
          />
        </div>
        <div v-else-if="column.key === 'due_display'" class="text-sm font-semibold text-ink-gray-9">
          {{ item }}
        </div>
        <div v-else-if="column.key === '_actions'" class="flex items-center justify-end gap-1 w-full">
          <Button size="sm" variant="solid" theme="blue" label="Pay Due" @click.stop="openPayment(row)" />
        </div>
        <span v-else class="text-sm text-ink-gray-8 truncate max-w-xs">{{ item ?? '—' }}</span>
      </template>
    </ListView>

    <!-- Payment Collection Dialog (XL Match) -->
    <Dialog v-model="showPayment" :options="{ title: 'Collect Payment', size: 'xl' }">
      <template #body-content>
        <div class="flex flex-col gap-4 pt-1 w-full text-ink-gray-9">
          
          <!-- Patient Field -->
          <FormControl 
            v-if="selectedInvoice"
            label="Patient"
            v-model="selectedInvoice.patient_name"
            disabled
          />
          <FormControl 
            v-else
            label="Patient"
            type="select" 
            v-model="globalPatientId" 
            :options="patientOptions" 
            placeholder="Select patient to pay"
          />

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="block text-sm text-ink-gray-9 mb-0.5">Payment Date</label>
              <DatePicker 
                v-model="paymentForm.date" 
                format="MMM D, YYYY"
              >
                <template #prefix>
                  <LucideCalendar class="size-4 text-ink-gray-5" />
                </template>
              </DatePicker>
            </div>
            <FormControl label="Payment Method" type="select" v-model="paymentForm.method" :options="['Cash', 'Credit Card', 'Bank Transfer', 'Insurance']" />
          </div>

          <FormControl label="Amount to Collect ($)" type="number" v-model="paymentForm.amount" />
          
          <FormControl label="Payment Notes" type="textarea" v-model="paymentForm.notes" placeholder="e.g. Partial payment, Check #123..." />

          <div class="flex flex-col gap-1 pt-3 border-t mt-1 w-full">
            <div v-if="selectedInvoice" class="flex justify-between items-center text-xs opacity-70">
              <span>Original Invoice Total</span>
              <span>{{ selectedInvoice?.total_display }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-dashed mt-1 pt-2">
              <span class="text-sm font-normal">Remaining After This Payment</span>
              <span class="text-lg font-normal text-ink-gray-9">
                ${{ (activePatientDue - paymentForm.amount).toLocaleString() }}
              </span>
            </div>
          </div>

          <div class="flex gap-2 justify-end pt-4 border-t w-full">
            <Button label="Cancel" variant="outline" @click="showPayment = false" />
            <Button label="Record Payment" variant="solid" theme="blue" @click="savePayment" />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>
