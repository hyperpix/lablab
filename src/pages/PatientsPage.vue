<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ListView, Button, Dialog, FormControl, Avatar, Dropdown } from 'frappe-ui'
import { getPatients, createPatient, deletePatient, type Patient } from '@/db/index'
import { useTopbar } from '@/composables/useTopbar'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideCheck       from '~icons/lucide/check'
import LucideFilter      from '~icons/lucide/list-filter'
import LucideColumns     from '~icons/lucide/columns-2'
import LucideAZ          from '~icons/lucide/arrow-up-a-z'
import LucideZA          from '~icons/lucide/arrow-down-a-z'

const router  = useRouter()
const showAdd = ref(false)
const saving  = ref(false)

const sortBy  = ref('Last Modified')
const sortDir = ref<'asc' | 'desc'>('asc')
const sortOptions = computed(() => [
  { label: 'Last Modified', selected: sortBy.value === 'Last Modified', onClick: () => sortBy.value = 'Last Modified' },
  { label: 'Name',          selected: sortBy.value === 'Name',          onClick: () => sortBy.value = 'Name'          },
  { label: 'Birth Year',    selected: sortBy.value === 'Birth Year',    onClick: () => sortBy.value = 'Birth Year'    },
])

const { setActions } = useTopbar()
setActions([{ label: 'Add Patient', onClick: () => { showAdd.value = true } }])

const patients  = ref<Patient[]>([])
const loading   = ref(true)
const search    = ref('')

function getRowActions(patient: Patient) {
  return [
    { label: 'View Profile', onClick: () => router.push(`/patients/${patient.id}`) },
    { label: 'Create Prescription', onClick: () => router.push(`/prescriptions/create?patient_id=${patient.id}`) },
    {
      label: 'Delete Patient',
      onClick: () => {
        if (confirm(`Are you sure you want to delete patient "${patient.name}"? This action is permanent and will delete all associated appointments, prescriptions, and records.`)) {
          deletePatient(patient.id)
            .then(() => {
              patients.value = patients.value.filter(p => p.id !== patient.id)
            })
            .catch(err => {
              console.error('Failed to delete patient:', err)
              alert('Failed to delete patient.')
            })
        }
      }
    }
  ]
}

const form = ref({
  name: '', birth_year: '' as number | '',
  gender: '' as string,
  phone: '', email: '', address: '',
})

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return patients.value
  return patients.value.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.phone?.includes(q) ||
    p.email?.toLowerCase().includes(q)
  )
})

const columns = [
  { label: 'Name',       key: 'name',       width: '220px' },
  { label: 'Phone',      key: 'phone',      width: '160px' },
  { label: 'Email',      key: 'email',      width: 'auto'  },
  { label: 'Gender',     key: 'gender',     width: '110px' },
  { label: 'Birth Year', key: 'birth_year', width: '120px' },
  { label: '',           key: '_actions',   width: '90px'  },
]

onMounted(async () => {
  try {
    patients.value = await getPatients()
  } catch {}
  finally { loading.value = false }
})

async function savePatient() {
  saving.value = true
  try {
    const p = await createPatient({
      name: form.value.name || 'Unknown',
      birth_year: Number(form.value.birth_year) || 0,
      gender: (['male', 'female'].includes(form.value.gender) ? form.value.gender : 'male') as 'male' | 'female',
      phone: form.value.phone || '',
      email: form.value.email || '',
      address: form.value.address || '',
      tags: '', notes: '', galbum: '',
      medical_history: [], gallery: [], teeth: [], labels: [], allergies: [],
      next_recall_date: null,
    })
    patients.value.unshift(p)
    showAdd.value = false
    form.value = { name: '', birth_year: '', gender: '', phone: '', email: '', address: '' }
  } catch { alert('Failed to save patient') } finally { saving.value = false }
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <!-- Search row -->
    <div class="flex items-center justify-between">
      <div class="w-64">
        <FormControl
          v-model="search"
          placeholder="Search by name, phone, email…"
          :prefix-icon="'search'"
        />
      </div>
      <div class="flex items-center gap-1">
        <Button variant="subtle" size="sm" icon="refresh-cw" />
        <Button variant="subtle" size="sm">
          <template #prefix>
            <LucideFilter class="size-4" />
          </template>
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
          <template #prefix>
            <LucideColumns class="size-4" />
          </template>
          Columns
        </Button>
      </div>
    </div>

    <!-- List -->
    <ListView
      :columns="columns"
      :rows="filtered"
      row-key="id"
      :options="{
        selectable: false,
        showTooltip: false,
        onRowClick: (row: Patient) => router.push(`/patients/${row.id}`),
        emptyState: {
          title: loading ? 'Loading…' : 'No patients found',
          description: loading ? '' : 'Add your first patient to get started',
        },
      }"
      class="cursor-pointer"
    >
      <template #cell="{ item, column, row }">
        <div v-if="column.key === 'name'" class="flex items-center gap-2">
          <Avatar :label="item" size="sm" />
          <span class="text-sm font-medium text-ink-gray-9">{{ item }}</span>
        </div>
        <span v-else-if="column.key === 'gender'" class="text-sm text-ink-gray-8 capitalize">{{ item ?? '—' }}</span>
        <div v-else-if="column.key === '_actions'" class="flex items-center justify-end w-full" @click.stop>
          <Dropdown :options="getRowActions(row)">
            <template #default="{ open }">
              <Button variant="subtle" size="sm" class="h-7">
                Actions
                <template #suffix>
                  <LucideChevronDown :class="open ? 'rotate-180' : ''" class="size-4 text-ink-gray-6 transition-transform" />
                </template>
              </Button>
            </template>
          </Dropdown>
        </div>
        <span v-else class="text-sm text-ink-gray-8">{{ item ?? '—' }}</span>
      </template>
    </ListView>

    <!-- Add Patient Dialog -->
    <Dialog v-model="showAdd" :options="{ title: 'Add Patient', size: 'md' }">
      <template #body-content>
        <div class="flex flex-col gap-3">
          <FormControl label="Full Name *" v-model="form.name" placeholder="e.g. Sarah Johnson" />
          <div class="grid grid-cols-2 gap-3">
            <FormControl
              label="Birth Year"
              v-model="form.birth_year"
              type="number"
              :min="1900"
              :max="new Date().getFullYear()"
            />
            <FormControl
              type="select"
              label="Gender"
              v-model="form.gender"
              :options="[{ label: '', value: '' }, { label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]"
            />
          </div>
          <FormControl label="Phone" v-model="form.phone" placeholder="+1 555-0000" />
          <FormControl type="email" label="Email" v-model="form.email" placeholder="patient@email.com" />
          <FormControl label="Address" v-model="form.address" placeholder="Street, City, State" />
          <div class="flex gap-2 justify-end pt-2">
            <Button label="Cancel" variant="outline" @click="showAdd = false" />
            <Button
              label="Save Patient"
              variant="solid"
              theme="blue"
              :loading="saving"
              @click="savePatient"
            />
          </div>
        </div>
      </template>
    </Dialog>


  </div>
</template>
