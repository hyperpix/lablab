<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { TabButtons, Button, FormControl, FileUploader, Dialog, Checkbox, Badge } from 'frappe-ui'
import LucideX from '~icons/lucide/x'
import {
  getAppointment, updateAppointment,
  getPatient, getStaff, getTreatments,
  createLabWork, getLabWork,
  type Appointment, type Patient, type StaffMember, type Treatment, type LabWork,
} from '@/db/index'

const route = useRoute()
const id    = route.params.id as string

const appt       = ref<Appointment | null>(null)
const patient    = ref<Patient | null>(null)
const staffList  = ref<StaffMember[]>([])
const treatments = ref<Treatment[]>([])
const loading    = ref(true)
const saving     = ref(false)

const activeTab = ref('appointment')
const tabs = [
  { label: 'Appointment',       value: 'appointment' },
  { label: 'Operative Details', value: 'operative'   },
  { label: 'Images',            value: 'images'      },
]

// ── Prescription row ──────────────────────────────────────────────────────────
interface PrescriptionRow {
  id:           string
  medication:   string
  dose:         string
  form:         string
  times_per_day:string
  units_per_time:string
  price:        string
  paid:         string
}

function blankRx(): PrescriptionRow {
  return { id: crypto.randomUUID(), medication: '', dose: '', form: 'tablet', times_per_day: '', units_per_time: '', price: '', paid: '' }
}

// ── Form state ────────────────────────────────────────────────────────────────
const form = ref({
  patient_id:   '',
  staff_id:     '',
  date:         '',
  time:         '',
  treatment_id: '',
  duration:     '',
  pre_op_notes: '',
  post_op_notes:'',
  is_done:      false,
  final_price:  '',
  paid_amount:  '',
})
const prescriptions = ref<PrescriptionRow[]>([blankRx()])
const images        = ref<string[]>([
  'https://picsum.photos/seed/appt1/400/400',
  'https://picsum.photos/seed/appt2/400/400',
  'https://picsum.photos/seed/appt3/400/400',
  'https://picsum.photos/seed/appt4/400/400',
])

function msToTime(ms: number) {
  const d = new Date(ms)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function msToDate(ms: number) {
  return new Date(ms).toISOString().slice(0, 10)
}

function dateTimeToMs(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr || '00:00'}`).getTime()
}

// ── Derived options ───────────────────────────────────────────────────────────
const staffOptions = computed(() => [
  { label: '—', value: '' },
  ...staffList.value.map(s => ({ label: s.name, value: s.id })),
])

const treatmentOptions = computed(() => [
  { label: '—', value: '' },
  ...treatments.value.map(t => ({ label: t.type, value: t.id })),
])

// ── Load ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [a, staff, txs] = await Promise.all([getAppointment(id), getStaff(), getTreatments()])
    appt.value      = a ?? DEMO_APPOINTMENTS.find(d => d.id === id) ?? null
    staffList.value  = staff
    treatments.value = txs
    if (a) {
      if (a.patient_id) patient.value = await getPatient(a.patient_id)
      form.value = {
        patient_id:    a.patient_id ?? '',
        staff_id:      a.staff_ids?.[0] ?? '',
        date:          a.date ? msToDate(a.date) : '',
        time:          a.date ? msToTime(a.date) : '',
        treatment_id:  a.treatment_id ?? '',
        duration:      '',
        pre_op_notes:  a.complaint ?? '',
        post_op_notes: a.notes ?? '',
        is_done:       a.is_done ?? false,
        final_price:   a.final_price ? String(a.final_price) : '',
        paid_amount:   a.paid_amount ? String(a.paid_amount) : '',
      }
      if (Array.isArray(a.prescriptions) && a.prescriptions.length) {
        const parsed = (a.prescriptions as unknown[]).map((p: unknown) => {
          const rx = p as Record<string, string>
          return rx.medication !== undefined ? (rx as unknown as PrescriptionRow) : blankRx()
        })
        prescriptions.value = parsed
      }
    }
  } catch {}
  finally { loading.value = false }
})

// ── Save ──────────────────────────────────────────────────────────────────────
async function save() {
  if (!appt.value) return
  saving.value = true
  try {
    const dateMs = form.value.date ? dateTimeToMs(form.value.date, form.value.time) : appt.value.date
    await updateAppointment(appt.value.id, {
      staff_ids:     form.value.staff_id ? [form.value.staff_id] : [],
      date:          dateMs,
      treatment_id:  form.value.treatment_id || null,
      treatment_ids: form.value.treatment_id ? [form.value.treatment_id] : [],
      complaint:     form.value.pre_op_notes,
      notes:         form.value.post_op_notes,
      is_done:       form.value.is_done,
      final_price:   parseFloat(form.value.final_price) || 0,
      paid_amount:   parseFloat(form.value.paid_amount) || 0,
      prescriptions: prescriptions.value as unknown as { prescription: string; id: string }[],
    })
  } catch { alert('Failed to save') }
  finally { saving.value = false }
}

function addRx()          { prescriptions.value.push(blankRx()) }
function removeRx(i: number) { prescriptions.value.splice(i, 1) }

// ── Labwork ───────────────────────────────────────────────────────────────────
const labworks       = ref<LabWork[]>([])
const showLabworkDialog = ref(false)
const savingLabwork  = ref(false)
const labworkForm    = ref({ lab_name: '', case_details: '', is_received: false })

function openLabworkDialog() {
  labworkForm.value = { lab_name: '', case_details: '', is_received: false }
  showLabworkDialog.value = true
}

async function saveLabwork() {
  if (!appt.value) return
  savingLabwork.value = true
  try {
    const lw = await createLabWork({
      case_title:          '',
      case_details:        labworkForm.value.case_details,
      patient_id:          appt.value.patient_id,
      operating_staff_ids: appt.value.staff_ids ?? [],
      involved_teeth:      appt.value.involved_teeth ?? [],
      lab_name:            labworkForm.value.lab_name,
      lab_contact:         '',
      price:               0,
      is_paid:             false,
      is_sent:             false,
      sent_date:           0,
      is_received:         labworkForm.value.is_received,
      received_date:       0,
    })
    labworks.value.push(lw)
    showLabworkDialog.value = false
  } catch { alert('Failed to save labwork') }
  finally { savingLabwork.value = false }
}

const confirmDeleteIdx = ref<number | null>(null)
const previewImg       = ref<string | null>(null)

function onImageUpload(file: File) {
  images.value.push(URL.createObjectURL(file))
}

function confirmRemove(idx: number) { confirmDeleteIdx.value = idx }
function cancelRemove()             { confirmDeleteIdx.value = null }
function removeImage(idx: number)   { images.value.splice(idx, 1); confirmDeleteIdx.value = null }
</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <div v-if="loading" class="text-sm text-ink-gray-5">Loading…</div>
    <div v-else-if="!appt"  class="text-sm text-ink-red-3">Appointment not found.</div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-ink-gray-9">Appointment</h1>
        <Button label="Save Changes" variant="solid" theme="blue" :loading="saving" @click="save" />
      </div>

      <!-- Tabs -->
      <TabButtons :buttons="tabs" v-model="activeTab" />

      <!-- ── Appointment ──────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'appointment'" class="flex flex-col gap-4">

          <!-- Patient (read-only) -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-gray-5">Patient</label>
            <div class="flex items-center gap-2 h-8 px-3 rounded-md border border-outline-gray-2 bg-surface-gray-1">
              <Avatar v-if="patient" :label="patient.name" size="xs" />
              <span class="text-sm text-ink-gray-8">{{ patient?.name ?? '—' }}</span>
            </div>
          </div>

          <!-- Doctor -->
          <FormControl type="select" label="Doctor" v-model="form.staff_id" :options="staffOptions" />

          <!-- Date + Time -->
          <div class="grid grid-cols-2 gap-4">
            <FormControl type="date" label="Date *" v-model="form.date" />
            <FormControl type="time" label="Time" v-model="form.time" />
          </div>

          <!-- Treatment + Duration -->
          <FormControl type="select" label="Treatment" v-model="form.treatment_id" :options="treatmentOptions" />
          <div class="flex flex-col gap-1.5">
            <FormControl type="number" label="Duration (minutes)" v-model="form.duration" placeholder="— suggested by treatment" />
          </div>

          <!-- Pre-op notes -->
          <FormControl type="textarea" label="Pre-op notes" v-model="form.pre_op_notes" placeholder="Complaint / pre-operative notes…" />
      </div>

      <!-- ── Operative Details ────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'operative'" class="flex flex-col gap-4">

          <!-- Post-op notes -->
          <FormControl type="textarea" label="Post-operative notes" v-model="form.post_op_notes" placeholder="Diagnosis / post-operative notes…" />

          <!-- Prescriptions -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-ink-gray-5">Prescription</span>
              <Button label="+ Add" variant="outline" size="sm" @click="addRx" />
            </div>

            <div
              v-for="(rx, i) in prescriptions"
              :key="rx.id"
              class="flex flex-col gap-3"
            >
              <div class="grid grid-cols-2 gap-3">
                <FormControl label="Medication name" v-model="rx.medication" placeholder="e.g. Amoxicillin" />
                <FormControl label="Dose (mg)" type="number" v-model="rx.dose" placeholder="e.g. 500" />
              </div>
              <div class="grid grid-cols-3 gap-3">
                <FormControl type="select" label="Form" v-model="rx.form"
                  :options="[{ label:'Tablet', value:'tablet' },{ label:'Capsule', value:'capsule' },{ label:'Syrup', value:'syrup' },{ label:'Injection', value:'injection' }]" />
                <FormControl label="Times per day" type="number" v-model="rx.times_per_day" placeholder="e.g. 3" />
                <FormControl label="Units per time" type="number" v-model="rx.units_per_time" placeholder="e.g. 1" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <FormControl label="Price in USD" type="number" v-model="rx.price" placeholder="0.00" />
                <FormControl label="Paid in USD"  type="number" v-model="rx.paid"  placeholder="0.00" />
              </div>
              <div v-if="prescriptions.length > 1" class="flex justify-end">
                <button class="text-xs text-ink-red-3 hover:underline" @click="removeRx(i)">Remove</button>
              </div>
            </div>
          </div>

          <!-- Done -->
          <Checkbox label="Appointment is done" v-model="form.is_done" />

          <!-- Actions -->
          <div class="flex items-center gap-2 pt-1">
            <Button v-if="form.is_done" label="Print Invoice" variant="outline" />
            <Button label="Add labwork for this appointment" variant="outline" @click="openLabworkDialog" />
          </div>

          <!-- Labwork list -->
          <div v-if="labworks.length" class="flex flex-col gap-3 pt-2">
            <span class="text-xs font-medium text-ink-gray-5">Labworks for this appointment</span>
            <div v-for="lw in labworks" :key="lw.id" class="flex flex-col gap-2 rounded-lg border border-outline-gray-2 p-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-ink-gray-9">{{ lw.lab_name || '—' }}</span>
                <Badge :label="lw.is_received ? 'Received' : 'Pending'" :theme="lw.is_received ? 'green' : 'orange'" variant="subtle" />
              </div>
              <span v-if="lw.case_details" class="text-xs text-ink-gray-6">{{ lw.case_details }}</span>
            </div>
          </div>
      </div>

      <!-- ── Images ───────────────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'images'" class="flex flex-col gap-4">
        <FileUploader :file-types="['image/*']" @success="onImageUpload">
          <template #default="{ uploading, progress, openFileSelector }">
            <Button variant="outline" @click="openFileSelector" :loading="uploading">
              {{ uploading ? `Uploading ${progress}%` : 'Upload Image' }}
            </Button>
          </template>
        </FileUploader>

        <div v-if="images.length" class="grid grid-cols-3 gap-3">
          <div
            v-for="(img, i) in images"
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

    <!-- Add Labwork dialog -->
    <Dialog v-model="showLabworkDialog" :options="{ title: 'Add Labwork', size: 'sm' }">
      <template #body-content>
        <div class="flex flex-col gap-3">
          <FormControl label="Laboratory" v-model="labworkForm.lab_name" placeholder="e.g. Dental Lab Co." />
          <FormControl type="textarea" label="Order notes" v-model="labworkForm.case_details" placeholder="Instructions, details…" />
          <Checkbox label="Labwork received" :checked="labworkForm.is_received" @change="labworkForm.is_received = !labworkForm.is_received" />
          <div class="flex gap-2 justify-end pt-2">
            <Button label="Cancel" variant="outline" @click="showLabworkDialog = false" />
            <Button label="Save" variant="solid" theme="blue" :loading="savingLabwork" @click="saveLabwork" />
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

    </template>

  <!-- Image lightbox -->
  <Teleport to="body">
    <div
      v-if="previewImg"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      @click="previewImg = null"
    >
      <img
        :src="previewImg"
        class="max-w-[90vw] max-h-[90vh] rounded-lg object-contain shadow-2xl"
        @click.stop
      />
      <button
        class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
        @click="previewImg = null"
      >
        <LucideX class="size-4 text-white" />
      </button>
    </div>
  </Teleport>
  </div>
</template>
