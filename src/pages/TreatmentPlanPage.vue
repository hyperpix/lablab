<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ListView, Button, Dialog, FormControl, Avatar, Dropdown, Badge } from 'frappe-ui'
import { useTopbar } from '@/composables/useTopbar'
import { getTreatmentPlans, createTreatmentPlan, getPatients, getTreatments } from '@/db/index'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideFilter      from '~icons/lucide/list-filter'
import LucideAZ          from '~icons/lucide/arrow-up-a-z'
import LucideZA          from '~icons/lucide/arrow-down-a-z'
import LucideColumns     from '~icons/lucide/columns-2'
import LucideTrash       from '~icons/lucide/trash-2'
import LucidePlus        from '~icons/lucide/plus'

const router = useRouter()
const route = useRoute()

const showDelete = ref(false)
const deleteTarget = ref<any>(null)

const search    = ref('')
const sortBy    = ref('Patient')
const sortDir   = ref<'asc'|'desc'>('asc')

const sortOptions = computed(() => [
  { label: 'Patient', selected: sortBy.value === 'Patient', onClick: () => sortBy.value = 'Patient' },
  { label: 'Date',    selected: sortBy.value === 'Date',    onClick: () => sortBy.value = 'Date'    },
])

const { setActions } = useTopbar()

// ── Add Plan Dialog ───────────────────────────────────────────────────────────
const showAddPlan = ref(false)
const savingPlan  = ref(false)
const allTreatments = ref<{ id: string; type: string }[]>([])

const planForm = reactive({
  patient_id: '',
  status: 'draft' as 'draft' | 'accepted' | 'completed' | 'cancelled',
  items: [] as { id: string; treatment_id: string; treatment_label: string; units: number; cost: number }[],
  discount: 0,
  tax: 0,
  paid_amount: 0,
  notes: '',
  title: '',
})

const patientOptions = computed(() =>
  allPatients.value.map((p: any) => ({ label: p.name, value: p.id }))
)

const treatmentOptions = computed(() =>
  allTreatments.value.map((t: any) => ({ label: t.type || t.id, value: t.id }))
)

const currency = '৳'

const subtotal = computed(() =>
  planForm.items.reduce((sum, item) => sum + item.units * item.cost, 0)
)

const totalBill = computed(() => {
  const discountAmt = (subtotal.value * planForm.discount) / 100
  const taxAmt = (subtotal.value * planForm.tax) / 100
  return subtotal.value - discountAmt + taxAmt
})

const amountDue = computed(() => totalBill.value - planForm.paid_amount)

const nextItemId = ref(1)

function addRow() {
  planForm.items.push({
    id: 'item-' + nextItemId.value++,
    treatment_id: '',
    treatment_label: '',
    units: 1,
    cost: 0,
  })
}

function removeRow(itemId: string) {
  planForm.items = planForm.items.filter(i => i.id !== itemId)
}

async function savePlan() {
  if (!planForm.patient_id) return
  savingPlan.value = true
  try {
    const totalPrice = totalBill.value
    const plan = await createTreatmentPlan({
      patient_id: planForm.patient_id,
      title: planForm.title || 'Treatment Plan',
      items: planForm.items.map(i => ({
        id: i.id,
        treatment_id: i.treatment_id,
        price: i.cost,
        is_done: false,
      })),
      status: planForm.status,
      total_price: totalPrice,
    })
    allRows.value.unshift(plan)
    showAddPlan.value = false
    // Reset form
    planForm.patient_id = ''
    planForm.status = 'draft'
    planForm.items = []
    planForm.discount = 0
    planForm.tax = 0
    planForm.paid_amount = 0
    planForm.notes = ''
    planForm.title = ''
    nextItemId.value = 1
  } catch (e) {
    console.error('Failed to create treatment plan', e)
    alert('Failed to create treatment plan')
  } finally {
    savingPlan.value = false
  }
}

const columns = [
  { label: 'Patient',      key: 'patient',            width: '220px' },
  { label: 'Plan Title',   key: 'title',              width: '280px' },
  { label: 'Procedures',   key: 'items_count',        width: '120px' },
  { label: 'Total Value',  key: 'total_display',      width: '140px' },
  { label: 'Status',       key: 'status',             width: '120px' },
  { label: '',             key: '_actions',           width: '60px'  },
]

const allRows      = ref<any[]>([])
const allPatients  = ref<any[]>([])
const loading      = ref(true)

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return allRows.value.map(plan => {
    const pt = allPatients.value.find(p => p.id === plan.patient_id)
    return {
      ...plan,
      patient_name: pt?.name || 'Unknown Patient',
      patient_image: pt?.image,
      items_count: plan.items?.length || 0,
      total_display: `$${(plan.total_price || 0).toLocaleString()}`,
      status_final: plan.status || 'draft'
    }
  }).filter(r =>
    !q || r.patient_name.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  setActions([{ label: 'Record Scribe', variant: 'solid', theme: 'blue', onClick: () => { router.push('/scribe') } }])
  try {
    const [plans, pts, treatments] = await Promise.all([getTreatmentPlans(), getPatients(), getTreatments()])
    allRows.value = plans
    allPatients.value = pts
    allTreatments.value = treatments

    // If navigated from patient detail page, pre-select patient and open dialog
    const pid = route.query.patient_id as string
    if (pid) {
      planForm.patient_id = pid
      showAddPlan.value = true
    }
  } catch (e) {
    console.error('Failed to load treatment plans:', e)
  } finally {
    loading.value = false
  }
})

function openDelete(row: any) {
  deleteTarget.value = row
  showDelete.value = true
}

function confirmDelete() {
  allRows.value = allRows.value.filter(r => r.id !== deleteTarget.value.id)
  showDelete.value = false
  deleteTarget.value = null
}

function statusTheme(status: string) {
  switch (status) {
    case 'accepted': return 'green'
    case 'completed': return 'blue'
    case 'cancelled': return 'red'
    default: return 'orange' // draft
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-0">
      <div class="w-64">
        <FormControl
          v-model="search"
          placeholder="Search plans…"
          :prefix-icon="'search'"
        />
      </div>
      <div class="flex items-center gap-1">
        <Button variant="solid" theme="blue" size="sm" @click="showAddPlan = true">
          <template #prefix><LucidePlus class="size-4" /></template>
          Add Treatment Plan
        </Button>
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
          title: loading ? 'Loading…' : 'No treatment plans',
          description: loading ? '' : 'Record Scribe to generate a treatment plan'
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
            :theme="statusTheme(item.status_final)"
            variant="subtle"
            class="capitalize"
          />
        </div>
        <div v-else-if="column.key === '_actions'" class="flex items-center justify-end gap-1 w-full">
          <button
            class="flex items-center justify-center w-7 h-7 rounded text-ink-gray-4 hover:bg-surface-red-1 hover:text-ink-red-3 transition-colors"
            @click.stop="openDelete(row)"
          >
            <LucideTrash class="size-3.5" />
          </button>
        </div>
        <span v-else-if="column.key === 'total_display'" class="text-sm text-ink-gray-9 font-medium">
          {{ item }}
        </span>
        <span v-else class="text-sm text-ink-gray-8">{{ item ?? '—' }}</span>
      </template>
    </ListView>

    <!-- Delete Dialog -->
    <Dialog v-model="showDelete" :options="{ title: 'Delete Treatment Plan', size: 'sm' }">
      <template #body-content>
        <p class="text-sm text-ink-gray-7 mb-4">
          Are you sure you want to delete this treatment plan? This action cannot be undone.
        </p>
        <div class="flex gap-2 justify-end">
          <Button label="Cancel" variant="outline" @click="showDelete = false" />
          <Button label="Delete" variant="solid" theme="red" @click="confirmDelete" />
        </div>
      </template>
    </Dialog>

    <!-- Add Treatment Plan Dialog -->
    <Dialog v-model="showAddPlan" :options="{ title: 'Add Treatment Plan', size: 'lg' }">
      <template #body-content>
        <div class="flex flex-col gap-4">
          <!-- Patient -->
          <FormControl
            type="select"
            label="Patient"
            v-model="planForm.patient_id"
            :options="patientOptions"
            placeholder="Select patient"
          />

          <!-- Status -->
          <FormControl
            type="select"
            label="Status"
            v-model="planForm.status"
            :options="[
              { label: 'Draft', value: 'draft' },
              { label: 'Accepted', value: 'accepted' },
              { label: 'Completed', value: 'completed' },
              { label: 'Cancelled', value: 'cancelled' },
            ]"
          />

          <!-- Treatment Items Table -->
          <div>
            <div class="text-xs font-medium text-ink-gray-5 mb-2">Treatment Items</div>
            <table class="w-full text-sm" v-if="planForm.items.length">
              <thead>
                <tr class="text-left text-xs text-ink-gray-4">
                  <th class="pb-1.5 pr-2">Treatment</th>
                  <th class="pb-1.5 pr-2 w-20">Units</th>
                  <th class="pb-1.5 pr-2 w-24">Cost</th>
                  <th class="pb-1.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in planForm.items" :key="item.id" class="border-t border-outline-gray-1">
                  <td class="py-1.5 pr-2">
                    <FormControl
                      type="select"
                      v-model="item.treatment_id"
                      :options="treatmentOptions"
                      placeholder="Select"
                      size="sm"
                    />
                  </td>
                  <td class="py-1.5 pr-2">
                    <FormControl type="number" v-model="item.units" :min="1" size="sm" />
                  </td>
                  <td class="py-1.5 pr-2">
                    <FormControl type="number" v-model="item.cost" :min="0" size="sm" />
                  </td>
                  <td class="py-1.5">
                    <button
                      class="flex items-center justify-center w-7 h-7 rounded text-ink-gray-4 hover:bg-surface-red-1 hover:text-ink-red-3 transition-colors"
                      @click="removeRow(item.id)"
                    >
                      <LucideTrash class="size-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <Button variant="subtle" size="sm" @click="addRow" class="mt-2">
              <template #prefix><LucidePlus class="size-4" /></template>
              Add Row
            </Button>
          </div>

          <!-- Discount, Tax, Paid Amount -->
          <div class="grid grid-cols-3 gap-3">
            <FormControl label="Discount (%)" type="number" v-model="planForm.discount" :min="0" :max="100" />
            <FormControl label="Tax (%)" type="number" v-model="planForm.tax" :min="0" :max="100" />
            <FormControl label="Paid Amount ({{ currency }})" type="number" v-model="planForm.paid_amount" :min="0" />
          </div>

          <!-- Notes -->
          <FormControl label="Notes" type="textarea" v-model="planForm.notes" placeholder="Notes..." rows="2" />

          <!-- Totals -->
          <div class="border-t border-outline-gray-2 pt-3 flex flex-col gap-1 text-sm">
            <div class="flex justify-between text-ink-gray-6">
              <span>Subtotal</span>
              <span>{{ currency }}{{ subtotal.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-ink-gray-8 font-semibold text-base">
              <span>Total Bill</span>
              <span>{{ currency }}{{ totalBill.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-ink-gray-8 font-semibold text-base">
              <span>Amount Due</span>
              <span class="text-ink-red-3">{{ currency }}{{ Math.max(0, amountDue).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </template>
      <template #actions>
        <div class="flex gap-2 justify-end w-full">
          <Button label="Cancel" variant="outline" @click="showAddPlan = false" />
          <Button label="Save Plan" variant="solid" theme="blue" :loading="savingPlan" @click="savePlan" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
