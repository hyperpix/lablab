<script setup>
import { ref, computed, onMounted } from 'vue'
import { ListView, Button, Dialog, FormControl, Dropdown } from 'frappe-ui'
import { useTopbar } from '@/composables/useTopbar'
import { getTreatments, createTreatment, updateTreatment, deleteTreatment } from '@/db/index'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideCheck       from '~icons/lucide/check'
import LucideFilter      from '~icons/lucide/list-filter'
import LucideAZ          from '~icons/lucide/arrow-up-a-z'
import LucideZA          from '~icons/lucide/arrow-down-a-z'
import LucideColumns     from '~icons/lucide/columns-2'
import LucidePencil      from '~icons/lucide/pencil'
import LucideTrash       from '~icons/lucide/trash-2'

const showAdd    = ref(false)
const showEdit   = ref(false)
const showDelete = ref(false)
const form       = ref({ name: '', duration: '', cost: '' })
const editTarget = ref(null)
const deleteTarget = ref(null)

const search  = ref('')
const sortBy  = ref('Name')
const sortDir = ref('asc')
const loading = ref(true)

const sortOptions = computed(() => [
  { label: 'Name',     selected: sortBy.value === 'Name',     onClick: () => sortBy.value = 'Name'     },
  { label: 'Duration', selected: sortBy.value === 'Duration', onClick: () => sortBy.value = 'Duration' },
  { label: 'Cost',     selected: sortBy.value === 'Cost',     onClick: () => sortBy.value = 'Cost'     },
])

const { setActions } = useTopbar()
setActions([{ label: 'Add Treatment', onClick: () => { showAdd.value = true } }])

const columns = [
  { label: 'Name',           key: 'name'                    },
  { label: 'Duration (min)', key: 'duration', width: '160px' },
  { label: 'Cost',           key: 'cost',     width: '120px' },
  { label: '',               key: '_actions', width: '80px'  },
]

const allRows = ref([])

async function fetchTreatments() {
  loading.value = true
  try {
    let txs = await getTreatments()
    if (txs.length === 0) {
      // Seed default treatments if DB table is empty
      const defaults = [
        { type: 'Root Canal',        expenses: 850,   duration: 90  },
        { type: 'Teeth Whitening',   expenses: 300,   duration: 60  },
        { type: 'Dental Implant',    expenses: 2400,  duration: 120 },
        { type: 'Braces Adjustment', expenses: 150,   duration: 30  },
        { type: 'Crown Placement',   expenses: 1100,  duration: 75  },
        { type: 'Cavity Filling',    expenses: 180,   duration: 45  },
        { type: 'Gum Treatment',     expenses: 420,   duration: 60  },
        { type: 'Extraction',        expenses: 220,   duration: 30  },
      ]
      for (const d of defaults) {
        await createTreatment(d)
      }
      txs = await getTreatments()
    }
    allRows.value = txs.map(t => ({
      id: t.id,
      name: t.type,
      duration: String(t.duration),
      cost: `$${t.expenses.toLocaleString()}`,
    }))
  } catch (err) {
    console.error('Failed to load treatments:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchTreatments)

const rows = computed(() => {
  const q = search.value.toLowerCase()
  let list = allRows.value.filter(r =>
    !q || r.name.toLowerCase().includes(q)
  )

  list.sort((a, b) => {
    let valA, valB
    if (sortBy.value === 'Name') {
      valA = a.name.toLowerCase()
      valB = b.name.toLowerCase()
    } else if (sortBy.value === 'Duration') {
      valA = parseInt(a.duration) || 0
      valB = parseInt(b.duration) || 0
    } else if (sortBy.value === 'Cost') {
      valA = parseFloat(a.cost.replace(/[^0-9.]/g, '')) || 0
      valB = parseFloat(b.cost.replace(/[^0-9.]/g, '')) || 0
    }

    if (valA < valB) return sortDir.value === 'asc' ? -1 : 1
    if (valA > valB) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })

  return list
})

async function saveForm() {
  try {
    const costNum = parseFloat(form.value.cost) || 0
    const durNum = parseInt(form.value.duration) || 0
    await createTreatment({
      type: form.value.name,
      expenses: costNum,
      duration: durNum,
    })
    await fetchTreatments()
    showAdd.value = false
    form.value = { name: '', duration: '', cost: '' }
  } catch (err) {
    alert('Failed to save treatment')
  }
}

function openEdit(row) {
  editTarget.value = row
  form.value = {
    name:     row.name,
    duration: row.duration,
    cost:     row.cost.replace('$', '').replace(/,/g, ''),
  }
  showEdit.value = true
}

async function saveEdit() {
  try {
    const costNum = parseFloat(form.value.cost) || 0
    const durNum = parseInt(form.value.duration) || 0
    await updateTreatment(editTarget.value.id, {
      type: form.value.name,
      expenses: costNum,
      duration: durNum,
    })
    await fetchTreatments()
    showEdit.value = false
    editTarget.value = null
    form.value = { name: '', duration: '', cost: '' }
  } catch (err) {
    alert('Failed to save changes')
  }
}

function openDelete(row) {
  deleteTarget.value = row
  showDelete.value = true
}

async function confirmDelete() {
  try {
    await deleteTreatment(deleteTarget.value.id)
    await fetchTreatments()
    showDelete.value = false
    deleteTarget.value = null
  } catch (err) {
    alert('Failed to delete treatment')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <!-- Search + filter row -->
    <div class="flex items-center justify-between">
      <div class="w-64">
        <FormControl
          v-model="search"
          placeholder="Search treatments…"
          :prefix-icon="'search'"
        />
      </div>
      <div class="flex items-center gap-1">
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
            <template #item-suffix="{ selected }">
              <LucideCheck v-if="selected" class="size-4 text-ink-gray-7" />
            </template>
          </Dropdown>
        </div>
        <Button variant="subtle" size="sm">
          <template #prefix><LucideColumns class="size-4" /></template>
          Columns
        </Button>
      </div>
    </div>

    <ListView
      :columns="columns"
      :rows="rows"
      row-key="id"
      :options="{ selectable: false, showTooltip: false, emptyState: { title: 'No treatments', description: 'Add a treatment to get started' } }"
    >
      <template #cell="{ item, column, row }">
        <!-- Action buttons column -->
        <div v-if="column.key === '_actions'" class="flex items-center justify-end gap-1 w-full">
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
        <span v-else class="text-sm text-ink-gray-8">{{ item ?? '—' }}</span>
      </template>
    </ListView>

    <!-- Add dialog -->
    <Dialog v-model="showAdd" :options="{ title: 'Add Treatment', size: 'sm' }">
      <template #body-content>
        <div class="flex flex-col gap-3">
          <FormControl label="Name"               v-model="form.name"     placeholder="e.g. Root Canal" />
          <FormControl label="Duration (minutes)" type="number" v-model="form.duration" placeholder="e.g. 60" />
          <FormControl label="Cost ($)"           type="number" v-model="form.cost"     placeholder="e.g. 850" />
          <div class="flex gap-2 justify-end pt-2">
            <Button label="Cancel"         variant="outline" @click="showAdd = false" />
            <Button label="Save Treatment" variant="solid" theme="blue" @click="saveForm" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Edit dialog -->
    <Dialog v-model="showEdit" :options="{ title: 'Edit Treatment', size: 'sm' }">
      <template #body-content>
        <div class="flex flex-col gap-3">
          <FormControl label="Name"               v-model="form.name"     placeholder="e.g. Root Canal" />
          <FormControl label="Duration (minutes)" type="number" v-model="form.duration" placeholder="e.g. 60" />
          <FormControl label="Cost ($)"           type="number" v-model="form.cost"     placeholder="e.g. 850" />
          <div class="flex gap-2 justify-end pt-2">
            <Button label="Cancel"          variant="outline" @click="showEdit = false" />
            <Button label="Save Changes"    variant="solid" theme="blue" @click="saveEdit" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Delete confirmation dialog -->
    <Dialog v-model="showDelete" :options="{ title: 'Delete Treatment', size: 'sm' }">
      <template #body-content>
        <div class="flex flex-col gap-4">
          <p class="text-sm text-ink-gray-7">
            Are you sure you want to delete <span class="font-medium text-ink-gray-9">{{ deleteTarget?.name }}</span>? This cannot be undone.
          </p>
          <div class="flex gap-2 justify-end">
            <Button label="Cancel" variant="outline" @click="showDelete = false" />
            <Button label="Delete" variant="solid" theme="red" @click="confirmDelete" />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>
