<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TabButtons, Badge, Button, Avatar, ListView, Dialog, FormControl, TextInput, FileUploader, Dropdown, Autocomplete } from 'frappe-ui'
import TeethChart from '@/components/TeethChart.vue'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideCheck       from '~icons/lucide/check'
import LucideX           from '~icons/lucide/x'
import LucidePlus from '~icons/lucide/plus'
import LucideActivity from '~icons/lucide/activity'
import LucideHistory from '~icons/lucide/history'
import LucideAlertCircle from '~icons/lucide/alert-circle'
import LucidePill from '~icons/lucide/pill'
import LucideStethoscope from '~icons/lucide/stethoscope'
import LucideMicroscope from '~icons/lucide/microscope'
import LucideFileText from '~icons/lucide/file-text'
import {
  getPatient, updatePatient, deletePatient,
  getAppointments, getInvoices, getTreatmentPlans,
  createAppointment, getPatientPrescriptions,
  type Patient, type Appointment, type ToothData, type Invoice, type TreatmentPlan
} from '@/db/index'

const route  = useRoute()
const router = useRouter()

const patient        = ref<Patient | null>(null)
const appointments   = ref<Appointment[]>([])
const prescriptions  = ref<any[]>([])
const invoices       = ref<Invoice[]>([])
const treatmentPlans = ref<TreatmentPlan[]>([])
const loading        = ref(true)

const activeTab = ref('overview')
const tabs = [
  { label: 'Overview',        value: 'overview'      },
  { label: 'Diagnostics',     value: 'diagnostics'   },
  { label: 'Appointments',    value: 'appointments'  },
  { label: 'Treatment Plans', value: 'plans'         },
  { label: 'Prescriptions',   value: 'prescriptions' },
  { label: 'Balances',        value: 'balances'      },
  { label: 'Chart',           value: 'teeth'         },
  { label: 'Gallery',         value: 'gallery'       },
]

// ── Edit Patient & Diagnostics ────────────────────────────────────────────────
const editing = ref(false)
const saving  = ref(false)
const form    = ref({ name: '', birth_year: 1990, gender: 'male' as 'male'|'female', phone: '', email: '', address: '' })

const diagnosticsForm = ref({
  chief_complaint: '',
  medical_history_notes: '',
  other_conditions: '',
  drug_history: '',
  clinical_findings: '',
  investigation_notes: '',
  diagnosis_notes: '',
})

function loadDiagnosticsFromNotes(notesVal: string, patientId: string) {
  try {
    if (notesVal) {
      const diagLine = notesVal.split('\n').find(l => l.startsWith('__DIAGNOSTICS__JSON:'))
      if (diagLine) {
        const parsed = JSON.parse(diagLine.substring(20))
        diagnosticsForm.value = {
          chief_complaint: parsed.chief_complaint || '',
          medical_history_notes: parsed.medical_history_notes || '',
          other_conditions: parsed.other_conditions || '',
          drug_history: parsed.drug_history || '',
          clinical_findings: parsed.clinical_findings || '',
          investigation_notes: parsed.investigation_notes || '',
          diagnosis_notes: parsed.diagnosis_notes || '',
        }
        return
      }
    }
    if (patientId === 'demo-1') {
      diagnosticsForm.value = {
        chief_complaint: 'Severe throbbing pain in the lower left quadrant for 3 days, aggravated by hot/cold stimuli.',
        medical_history_notes: 'Type 2 Diabetes, Hypertension (managed with medication).',
        other_conditions: 'Mild asthma, managed with occasional inhaler use.',
        drug_history: 'Metformin 500mg daily, Lisinopril 10mg daily. Allergic to Penicillin.',
        clinical_findings: 'Deep carious lesion on distal-occlusal of tooth #36. Extremely sensitive to percussion and temperature testing. Localized gingival inflammation around #36.',
        investigation_notes: 'Periapical radiograph of #36 shows a deep carious radiolucency extending to the pulp chamber, with widening of the periodontal ligament space around the mesial root.',
        diagnosis_notes: 'Symptomatic irreversible pulpitis with acute apical periodontitis of tooth #36.',
      }
    } else {
      diagnosticsForm.value = {
        chief_complaint: '',
        medical_history_notes: '',
        other_conditions: '',
        drug_history: '',
        clinical_findings: '',
        investigation_notes: '',
        diagnosis_notes: '',
      }
    }
  } catch (e) {
    console.error('Failed to parse diagnostics JSON', e)
  }
}

function startEdit() {
  if (!patient.value) return
  form.value = {
    name:       patient.value.name,
    birth_year: patient.value.birth_year,
    gender:     patient.value.gender ?? 'male',
    phone:      patient.value.phone ?? '',
    email:      patient.value.email ?? '',
    address:    patient.value.address ?? '',
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  if (patient.value) {
    loadDiagnosticsFromNotes(patient.value.notes, patient.value.id)
  }
}

async function saveEdit() {
  editing.value = false
  if (!patient.value) return
  saving.value = true
  try {
    const currentNotes = patient.value.notes || ''
    const suggestionLine = currentNotes.split('\n').find(l => l.startsWith('__AI_SUGGESTION__JSON:'))
    let notesStr = '__DIAGNOSTICS__JSON:' + JSON.stringify(diagnosticsForm.value)
    if (suggestionLine) {
      notesStr += '\n' + suggestionLine
    }
    patient.value = await updatePatient(patient.value.id, {
      ...form.value,
      notes: notesStr
    })
  } catch {
    alert('Failed to save patient changes')
  } finally {
    saving.value = false
  }
}

// ── In-page Appointment Dialog ───────────────────────────────────────────
const showAddAppt = ref(false)
const apptSaving  = ref(false)
const apptForm    = ref({
  date:      new Date().toISOString().split('T')[0],
  fromTime:  '09:00',
  toTime:    '10:00',
  complaint: '',
  notes:     '',
})

async function bookAppointment() {
  if (!patient.value) return
  apptSaving.value = true
  try {
    const dateEpoch = new Date(`${apptForm.value.date}T${apptForm.value.fromTime}`).getTime()
    const [fh, fm] = apptForm.value.fromTime.split(':').map(Number)
    const [th, tm] = apptForm.value.toTime.split(':').map(Number)
    const duration = ((th * 60 + tm) - (fh * 60 + fm)) * 60 * 1000

    await createAppointment({
      patient_id:   patient.value.id,
      treatment_id: null,
      treatment_ids: [],
      staff_ids:    [],
      date:         dateEpoch,
      time:         Math.max(duration, 30 * 60 * 1000),
      involved_teeth: [],
      paid_amount:  0,
      final_price:  0,
      units:        1,
      is_done:      false,
      complaint:    apptForm.value.complaint,
      diagnosis:    '',
      notes:        apptForm.value.notes,
      prescriptions: [],
      reminder_24h_sent: false,
      reminder_1h_sent:  false,
    })

    // Refresh appointments list
    const id = route.params.id as string
    appointments.value = await getAppointments({ patientId: id })
    showAddAppt.value = false
  } catch {
    alert('Failed to book appointment')
  } finally {
    apptSaving.value = false
  }
}

// ── Prescription Management ──────────────────────────────────────────────────
const viewRx = ref<any | null>(null)

function viewPrescription(rx: any) {
  viewRx.value = rx
}





function editRx() {
  if (!viewRx.value) return
  router.push(`/prescriptions/create?patient_id=${viewRx.value.patient_id}&rx_id=${viewRx.value.id}`)
}


// ── Teeth Chart ──────────────────────────────────────────────────────────────
const chartType       = ref<'permanent' | 'deciduous'>('permanent')
const showToothEdit   = ref(false)
const selectedTooth   = ref<number | null>(null)
const toothCondition  = ref<ToothData['condition']>('sound')
const toothNote       = ref('')
const savingTooth     = ref(false)

const CONDITIONS: ToothData['condition'][] = [
  'sound', 'filled', 'compromised', 'endo', 'missing', 'rotated', 'displaced', 'gum-recessed',
]

function conditionColor(c: string) {
  return ({ compromised:'#FFCDD2', endo:'#D1C4E9', filled:'#FFE082', missing:'#BDBDBD', rotated:'#B2EBF2', 'gum-recessed':'#F48FB1', displaced:'#b2dfdb' } as Record<string,string>)[c] ?? 'transparent'
}

// Convert teeth array → Record<ISO, {condition, concern, notes}> for TeethChart
const teethMap = computed(() => {
  const map: Record<number, { condition: string; concern: boolean; notes: string[] }> = {}
  for (const t of patient.value?.teeth ?? []) {
    map[t.ISO] = {
      condition: t.condition,
      concern:   t.condition !== 'sound' || (t.notes?.length ?? 0) > 0,
      notes:     t.notes ?? [],
    }
  }
  return map
})

function openToothEdit(iso: number) {
  selectedTooth.value  = iso
  const existing       = patient.value?.teeth?.find(t => t.ISO === iso)
  toothCondition.value = existing?.condition ?? 'sound'
  toothNote.value      = existing?.notes?.[0] ?? ''
  showToothEdit.value  = true
}

async function saveTooth() {
  if (!patient.value || selectedTooth.value === null) return
  savingTooth.value = true
  try {
    const existing = patient.value.teeth?.filter(t => t.ISO !== selectedTooth.value) ?? []
    const updated: ToothData[] = [
      ...existing,
      { ISO: selectedTooth.value, condition: toothCondition.value, notes: toothNote.value ? [toothNote.value] : [] },
    ]
    patient.value = await updatePatient(patient.value.id, { teeth: updated })
    showToothEdit.value = false
  } catch {
    alert('Failed to save tooth data')
  } finally {
    savingTooth.value = false
  }
}


// ── Gallery ───────────────────────────────────────────────────────────────────
const galleryImages = ref<string[]>([
  'https://picsum.photos/seed/dental1/400/400',
  'https://picsum.photos/seed/dental2/400/400',
  'https://picsum.photos/seed/dental3/400/400',
  'https://picsum.photos/seed/dental4/400/400',
  'https://picsum.photos/seed/dental5/400/400',
])

const confirmDeleteIdx = ref<number | null>(null)
const previewImg       = ref<string | null>(null)

function onImageUpload(file: File) {
  const url = URL.createObjectURL(file)
  galleryImages.value.push(url)
}

function confirmRemove(idx: number) { confirmDeleteIdx.value = idx }
function cancelRemove()             { confirmDeleteIdx.value = null }

function removeImage(idx: number) {
  galleryImages.value.splice(idx, 1)
  confirmDeleteIdx.value = null
}

// ── Derived ListView Rows/Columns ────────────────────────────────────────────
const apptColumns = [
  { label: 'Visit',     key: 'visitLabel', width: '90px'  },
  { label: 'Date',      key: 'dateLabel',  width: '160px' },
  { label: 'Complaint', key: 'complaint',  width: '240px' },
  { label: 'Status',    key: 'status',     width: '110px' },
  { label: '',          key: '_actions'  },
]
const apptRows = computed(() => {
  const sorted = [...appointments.value].sort((a, b) => (a.date ?? 0) - (b.date ?? 0))
  return sorted.map((a, i) => ({
    id:         a.id,
    visitN:     i + 1,
    visitLabel: `Visit ${i + 1}`,
    dateLabel:  a.date ? new Date(a.date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—',
    complaint:  a.complaint || '—',
    status:     a.is_done ? 'Done' : 'Pending',
  }))
})

const statusTheme = (s: string) => ({ Done:'green', Pending:'orange' }[s] ?? 'gray')

const planColumns = [
  { label: 'Date',      key: 'created_at', width: '120px' },
  { label: 'Name',      key: 'name',       width: 'auto'  },
  { label: 'Status',    key: 'status',     width: '120px' },
]
const planRows = computed(() => {
  return treatmentPlans.value.map(p => ({
    id: p.id,
    name: (p as any).name || (p as any).title || 'Treatment Plan',
    status: p.status,
    created_at: new Date(p.created_at).toLocaleDateString(),
  }))
})

const rxColumns = [
  { label: 'Date',         key: 'issued_date_str', width: '120px' },
  { label: 'Prescription', key: 'medication',      width: '35%'   },
  { label: 'Duration',     key: 'duration',        width: 'auto'  },
  { label: '',             key: '_actions',        width: '100px' },
]
const rxRows = computed(() => {
  return prescriptions.value.map(rx => {
    const medNames: string[] = []
    const durations: string[] = []

    const blocks = (rx.medication || '').split(/,\s*(?![^()]*\))/g)

    blocks.forEach(block => {
      if (!block.trim()) return

      const match = block.match(/^(.*?)\s*\((.*?)\)$/)
      if (match) {
        medNames.push(match[1].trim())
        const details = match[2].split(',')
        durations.push(details[details.length - 1].trim())
      } else {
        medNames.push(block.trim())
        durations.push('—')
      }
    })

    const cleanNames = medNames.map(n => {
       let clean = n.replace(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|IU|unit|units|%)\b/gi, '')
                    .replace(/\b(Tablet|Capsule|Syrup|Injection|Suspension|Drop|Sachet|Cap|Tab|Tabs)\b/gi, '')
                    .replace(/ - /g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
       return clean || 'Medicine'
    })

    const cleanDurations = durations.map(d => {
        let clean = d.replace(/\b[mae]\s*:?\s*\d+\b/gi, '')
                     .replace(/^[,\s]+|[,\s]+$/g, '')
                     .trim()
        return clean || '—'
    })

    let finalDuration = cleanDurations.join(', ')
    if (finalDuration.replace(/[—,\s]/g, '') === '' && rx.duration) {
         finalDuration = rx.duration
    }

    return {
      id: rx.id,
      medication: cleanNames.join(', '),
      duration: finalDuration,
      issued_date_str: new Date(rx.issued_date).toLocaleDateString('en-GB'),
    }
  })
})

const invColumns = [
  { label: 'Date',      key: 'issued_date_str', width: '120px' },
  { label: 'Amount',    key: 'amount_display',  width: '120px' },
  { label: 'Due',       key: 'due_display',     width: '120px' },
  { label: 'Notes',     key: 'notes',           width: 'auto'  },
]
const invRows = computed(() => {
  return invoices.value.map(inv => {
    const due = inv.amount - inv.paid_amount
    return {
      id: inv.id,
      amount_display: `$${inv.amount.toLocaleString()}`,
      due_display: `$${due.toLocaleString()}`,
      notes: inv.notes || '—',
      issued_date_str: new Date(inv.issued_date).toLocaleDateString(),
    }
  })
})

// ── Load Patient Lifecycle ───────────────────────────────────────────────────
onMounted(async () => {
  const id = route.params.id as string
  try {
    const [p, a, inv, plans, rx] = await Promise.all([
      getPatient(id),
      getAppointments({ patientId: id }),
      getInvoices(),
      getTreatmentPlans(),
      getPatientPrescriptions(id)
    ])
    patient.value      = p ?? null
    appointments.value = a ?? []
    prescriptions.value = rx ?? []
    invoices.value      = inv.filter(i => i.patient_id === id)
    treatmentPlans.value = plans.filter(pl => pl.patient_id === id)

    if (patient.value) {
      form.value = {
        name: patient.value.name,
        birth_year: patient.value.birth_year,
        gender: patient.value.gender,
        phone: patient.value.phone ?? '',
        email: patient.value.email ?? '',
        address: patient.value.address ?? '',
      }
      loadDiagnosticsFromNotes(patient.value.notes, patient.value.id)
    }
  } catch (err) {
    console.error('Failed to load patient detail page:', err)
  } finally {
    loading.value = false
  }
})

function triggerDeletePatient() {
  if (!patient.value) return
  if (confirm(`Are you sure you want to delete patient "${patient.value.name}"? This action is permanent and will delete all associated appointments, prescriptions, and records.`)) {
    deletePatient(patient.value.id)
      .then(() => {
        router.push('/patients')
      })
      .catch(err => {
        console.error('Failed to delete patient:', err)
        alert('Failed to delete patient.')
      })
  }
}
</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <div v-if="loading" class="text-sm text-ink-gray-5">Loading…</div>
    <div v-else-if="!patient" class="text-sm text-ink-red-3">Patient not found.</div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <Avatar :label="patient.name" size="lg" />
          <h1 class="text-xl font-semibold text-ink-gray-9">{{ patient.name }}</h1>
        </div>
        <div class="flex items-center gap-2">
          <template v-if="editing">
            <Button label="Cancel" variant="outline" @click="cancelEdit" />
            <Button label="Save Changes" variant="solid" theme="blue" :loading="saving" @click="saveEdit" />
          </template>
          <template v-else>
            <Button v-if="activeTab === 'prescriptions'" label="Add Prescription" variant="solid" theme="blue" @click="router.push(`/prescriptions/create?patient_id=${patient.id}`)" />
            <Button v-else-if="activeTab === 'plans'" label="Add Treatment Plan" variant="solid" theme="blue" @click="router.push(`/billing/plan?patient_id=${patient.id}`)" />
            <Button v-else-if="activeTab === 'appointments'" label="Add Appointment" variant="solid" theme="blue" @click="showAddAppt = true" />
            <Button v-else-if="activeTab === 'balances'" label="Record Payment" variant="solid" theme="blue" @click="router.push(`/billing/due?patient_id=${patient.id}`)" />
            <Button v-else label="Edit Patient" variant="outline" @click="startEdit" />
            <Button label="Delete Patient" variant="outline" theme="red" @click="triggerDeletePatient" />
          </template>
        </div>
      </div>

      <!-- Tabs -->
      <TabButtons :buttons="tabs" v-model="activeTab" />

      <!-- ── Overview Tab ───────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'overview'" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Full Name</label>
          <TextInput v-if="editing" v-model="form.name" placeholder="Full name" />
          <TextInput v-else :model-value="patient.name" :disabled="true" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Email</label>
          <TextInput v-if="editing" v-model="form.email" type="email" placeholder="email@example.com" />
          <TextInput v-else :model-value="patient.email || ''" placeholder="—" :disabled="true" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Phone</label>
          <TextInput v-if="editing" v-model="form.phone" type="tel" placeholder="+1 555-0000" />
          <TextInput v-else :model-value="patient.phone || ''" placeholder="—" :disabled="true" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Address</label>
          <TextInput v-if="editing" v-model="form.address" placeholder="Street, City, State" />
          <TextInput v-else :model-value="patient.address || ''" placeholder="—" :disabled="true" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-gray-5">Birth Year</label>
            <TextInput v-if="editing" v-model="form.birth_year" type="number" placeholder="e.g. 1990" />
            <TextInput v-else :model-value="String(patient.birth_year || '')" placeholder="—" :disabled="true" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-gray-5">Gender</label>
            <FormControl v-if="editing" type="select" v-model="form.gender" :options="[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]" />
            <TextInput v-else :model-value="patient.gender === 'male' ? 'Male' : patient.gender === 'female' ? 'Female' : ''" placeholder="—" :disabled="true" />
          </div>
        </div>
      </div>

      <!-- ── Diagnostics Tab ────────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'diagnostics'" class="flex flex-col gap-4">
        <!-- Chief Complaint (Full Width) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Chief Complaint</label>
          <FormControl v-if="editing" type="textarea" v-model="diagnosticsForm.chief_complaint" placeholder="Enter chief complaint..." :rows="3" />
          <FormControl v-else type="textarea" :model-value="diagnosticsForm.chief_complaint || 'No chief complaint recorded.'" :disabled="true" :rows="3" />
        </div>

        <!-- Remaining Grid Fields (2-Column Grid) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Left Column -->
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-gray-5">Clinical Findings</label>
              <FormControl v-if="editing" type="textarea" v-model="diagnosticsForm.clinical_findings" placeholder="Enter clinical findings..." :rows="3" />
              <FormControl v-else type="textarea" :model-value="diagnosticsForm.clinical_findings || 'No clinical findings recorded.'" :disabled="true" :rows="3" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-gray-5">Investigation</label>
              <FormControl v-if="editing" type="textarea" v-model="diagnosticsForm.investigation_notes" placeholder="Enter investigation notes..." :rows="3" />
              <FormControl v-else type="textarea" :model-value="diagnosticsForm.investigation_notes || 'No investigation notes recorded.'" :disabled="true" :rows="3" />
            </div>
          </div>

          <!-- Right Column -->
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-gray-5">Medical History</label>
              <FormControl v-if="editing" type="textarea" v-model="diagnosticsForm.medical_history_notes" placeholder="Enter medical history..." :rows="3" />
              <FormControl v-else type="textarea" :model-value="diagnosticsForm.medical_history_notes || 'No medical history recorded.'" :disabled="true" :rows="3" />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-gray-5">Other Medical Conditions</label>
              <FormControl v-if="editing" type="textarea" v-model="diagnosticsForm.other_conditions" placeholder="Enter other medical conditions..." :rows="3" />
              <FormControl v-else type="textarea" :model-value="diagnosticsForm.other_conditions || 'No other medical conditions specified.'" :disabled="true" :rows="3" />
            </div>
          </div>
        </div>

        <!-- Drug History (Full Width) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Drug History</label>
          <FormControl v-if="editing" type="textarea" v-model="diagnosticsForm.drug_history" placeholder="Enter drug history..." :rows="3" />
          <FormControl v-else type="textarea" :model-value="diagnosticsForm.drug_history || 'No drug history recorded.'" :disabled="true" :rows="3" />
        </div>

        <!-- Diagnosis (Full Width) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Diagnosis</label>
          <FormControl v-if="editing" type="textarea" v-model="diagnosticsForm.diagnosis_notes" placeholder="Enter diagnosis..." :rows="3" />
          <FormControl v-else type="textarea" :model-value="diagnosticsForm.diagnosis_notes || 'No diagnosis recorded.'" :disabled="true" :rows="3" />
        </div>
      </div>




      <!-- ── Appointments Tab ───────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'appointments'" class="flex-1">
        <ListView :columns="apptColumns" :rows="apptRows" row-key="id"
          :options="{ selectable:false, showTooltip:false, emptyState:{ title:'No appointments', description:'No appointments recorded for this patient' } }"
        >
          <template #cell="{ item, column, row }">
            <Badge v-if="column.key === 'status'" :label="item" :theme="statusTheme(item)" variant="subtle" />
            <span v-else-if="column.key === 'visitLabel'" class="text-xs font-medium text-ink-gray-5">{{ item }}</span>
            <div v-else-if="column.key === '_actions'" class="flex items-center justify-end w-full">
              <Button size="sm" variant="solid" theme="blue" @click.stop="router.push(`/scribe?patient_id=${patient?.id}`)">
                <template #prefix>
                  <LucidePlus class="size-3.5" />
                </template>
                Start Scribe
              </Button>
            </div>
            <span v-else class="text-sm text-ink-gray-8">{{ item ?? '—' }}</span>
          </template>
        </ListView>
      </div>

      <!-- ── Treatment Plans Tab ────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'plans'" class="flex-1">
        <ListView :columns="planColumns" :rows="planRows" row-key="id"
          :options="{ selectable:false, showTooltip:false, emptyState:{ title:'No treatment plans', description:'No plans found for this patient' } }"
        >
          <template #cell="{ item, column }">
            <Badge v-if="column.key === 'status'" :label="item" :theme="item === 'Completed' ? 'green' : 'orange'" variant="subtle" />
            <span v-else class="text-sm text-ink-gray-8">{{ item ?? '—' }}</span>
          </template>
        </ListView>
      </div>

      <!-- ── Prescriptions Tab ──────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'prescriptions'" class="flex-1 flex flex-col gap-3">
        <ListView :columns="rxColumns" :rows="rxRows" row-key="id"
          :options="{ selectable:false, showTooltip:false, emptyState:{ title:'No prescriptions', description:'No active prescriptions' } }"
        >
          <template #cell="{ item, column, row }">
            <div v-if="column.key === '_actions'" class="flex items-center justify-end w-full" @click.stop>
              <Dropdown :options="[
                { label: 'View Details', onClick: () => viewPrescription(prescriptions.find(r => r.id === row.id)!) },
                { label: 'Follow-up',    onClick: () => router.push('/prescriptions/create?patient_id=' + patient.id) },
                { label: 'Edit',         onClick: () => router.push('/prescriptions/create?patient_id=' + patient.id + '&rx_id=' + row.id) },
                { label: 'Delete',       onClick: () => {} }
              ]">
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

        <!-- View Prescription Dialog -->
        <Dialog :open="!!viewRx" @close="viewRx = null">
          <template #body-title>
            Prescription Details
          </template>
          <template #body-content>
            <div v-if="viewRx" class="flex flex-col gap-3 text-sm">
              <div><strong>Date:</strong> {{ new Date(viewRx.issued_date).toLocaleDateString('en-GB') }}</div>
              <div><strong>Doctor:</strong> {{ viewRx.doctor_id }}</div>
              <div><strong>Medication:</strong> {{ viewRx.medication }}</div>
              <div><strong>Dosage:</strong> {{ viewRx.dosage }}</div>
              <div><strong>Frequency:</strong> {{ viewRx.frequency }}</div>
              <div><strong>Duration:</strong> {{ viewRx.duration }}</div>
              <div v-if="viewRx.notes"><strong>Notes:</strong><br>{{ viewRx.notes }}</div>
            </div>
          </template>
          <template #actions>
            <div class="flex items-center gap-2 w-full">
              <div class="flex-1"></div>
              <Button variant="solid" theme="blue" @click="viewRx = null">Close</Button>
            </div>
          </template>
        </Dialog>
      </div>

      <!-- ── Balances Tab ───────────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'balances'" class="flex-1">
        <ListView :columns="invColumns" :rows="invRows" row-key="id"
          :options="{ selectable:false, showTooltip:false, emptyState:{ title:'No invoices', description:'All clear!' } }"
        >
          <template #cell="{ item, column }">
            <span v-if="column.key === 'due_display'" class="text-sm font-semibold text-ink-red-3">{{ item }}</span>
            <span v-else class="text-sm text-ink-gray-8">{{ item ?? '—' }}</span>
          </template>
        </ListView>
      </div>

      <!-- ── Dental Chart & Anatomy Tab ─────────────────────────────────────── -->
      <div v-else-if="activeTab === 'teeth'" class="flex flex-col gap-4">
        <!-- Teeth Chart -->
        <div class="rounded-lg border border-outline-gray-2 bg-surface-white p-4">
          <!-- Chart + overlaid controls -->
          <div class="relative">
            <TeethChart :teeth="teethMap" :type="chartType" @tooth-click="openToothEdit" />

            <!-- Chart type dropdown pinned inside top-left -->
            <div class="absolute top-0 left-0">
              <Dropdown :options="[
                { label: 'Permanent',           selected: chartType === 'permanent', onClick: () => chartType = 'permanent' },
                { label: 'Deciduous (Primary)', selected: chartType === 'deciduous', onClick: () => chartType = 'deciduous' },
              ]">
                <template #default="{ open }">
                  <Button size="sm" variant="outline">
                    {{ chartType === 'permanent' ? 'Permanent' : 'Deciduous (Primary)' }}
                    <template #suffix>
                      <LucideChevronDown :class="open ? 'rotate-180' : ''" class="size-4 text-ink-gray-6" />
                    </template>
                  </Button>
                </template>
                <template #item-suffix="{ selected }">
                  <LucideCheck v-if="selected" class="size-4 text-ink-gray-7" />
                </template>
              </Dropdown>
            </div>

            <!-- Legend card pinned inside top-right -->
            <div class="absolute top-0 right-0 rounded-lg border border-outline-gray-2 bg-surface-white p-3 flex flex-col gap-2 w-40">
              <span class="text-xs font-medium text-ink-gray-5">Conditions</span>
              <div
                v-for="c in CONDITIONS.filter(x => x !== 'sound')"
                :key="c"
                class="flex items-center gap-2"
              >
                <div class="w-2.5 h-2.5 rounded-sm flex-shrink-0" :style="{ background: conditionColor(c) }" />
                <span class="text-xs text-ink-gray-7 capitalize">{{ c.replace('-', ' ') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Gallery Tab ────────────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'gallery'" class="flex flex-col gap-4">
        <!-- Upload -->
        <FileUploader
          :file-types="['image/*']"
          @success="onImageUpload"
        >
          <template #default="{ uploading, progress, openFileSelector }">
            <Button variant="outline" @click="openFileSelector" :loading="uploading">
              {{ uploading ? `Uploading ${progress}%` : 'Upload Image' }}
            </Button>
          </template>
        </FileUploader>

        <!-- Grid -->
        <div v-if="galleryImages.length" class="grid grid-cols-3 gap-3">
          <div
            v-for="(img, i) in galleryImages"
            :key="i"
            class="relative group rounded-lg overflow-hidden border border-outline-gray-2 aspect-square bg-surface-gray-1 cursor-pointer"
            @click="previewImg = img"
          >
            <img :src="img" class="w-full h-full object-cover" />
            <Button
              variant="solid"
              class="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity !bg-black/60 hover:!bg-black/80 !p-1 !min-w-0 !h-6 !w-6"
              @click.stop="confirmRemove(i)"
            >
              <template #icon><LucideX class="size-3 text-white" /></template>
            </Button>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-outline-gray-3 text-ink-gray-4 gap-2">
          <span class="text-sm">No images yet</span>
          <span class="text-xs">Upload X-rays, photos, or documents</span>
        </div>
      </div>
    </template>

    <!-- Add Appointment Dialog -->
    <Dialog v-model="showAddAppt" :options="{ title: 'Add Appointment', size: 'sm' }">
      <template #body-content>
        <div class="flex flex-col gap-3">
          <FormControl type="date" label="Date" v-model="apptForm.date" />
          <div class="grid grid-cols-2 gap-3">
            <FormControl type="time" label="From Time" v-model="apptForm.fromTime" />
            <FormControl type="time" label="To Time" v-model="apptForm.toTime" />
          </div>
          <FormControl label="Complaint" v-model="apptForm.complaint" placeholder="e.g. Toothache" />
          <FormControl type="textarea" label="Notes" v-model="apptForm.notes" placeholder="Additional details..." />
          <div class="flex gap-2 justify-end pt-2">
            <Button label="Cancel" variant="outline" @click="showAddAppt = false" />
            <Button label="Save" variant="solid" theme="blue" :loading="apptSaving" @click="bookAppointment" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Tooth Edit Dialog -->
    <Dialog v-model="showToothEdit" :options="{ title: `Tooth ${selectedTooth}`, size: 'sm' }">
      <template #body-content>
        <div class="flex flex-col gap-3">
          <FormControl type="select" label="Condition" v-model="toothCondition"
            :options="CONDITIONS.map(c => ({ label: c.replace('-', ' '), value: c }))" />
          <FormControl label="Note (optional)" v-model="toothNote" placeholder="e.g. Filled 2023, Awaiting crown…" />
          <div class="flex gap-2 justify-end pt-2">
            <Button label="Cancel" variant="outline" @click="showToothEdit = false" />
            <Button label="Save" variant="solid" theme="blue" :loading="savingTooth" @click="saveTooth" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Confirm image delete -->
    <Dialog :model-value="confirmDeleteIdx !== null" @update:model-value="cancelRemove" :options="{ title: 'Delete image?', size: 'sm' }">
      <template #body-content>
        <p class="text-sm text-ink-gray-7 mb-4">This image will be permanently removed.</p>
        <div class="flex gap-2 justify-end">
          <Button label="Cancel" variant="outline" @click="cancelRemove" />
          <Button label="Delete" variant="solid" theme="red" @click="removeImage(confirmDeleteIdx!)" />
        </div>
      </template>
    </Dialog>

    <!-- Image lightbox -->
    <Teleport to="body">
      <div
        v-if="previewImg"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        @click="previewImg = null"
      >
        <img :src="previewImg" class="max-w-[90vw] max-h-[90vh] rounded-lg object-contain shadow-2xl" @click.stop />
        <button
          class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
          @click="previewImg = null"
        >×</button>
      </div>
    </Teleport>

  </div>
</template>
