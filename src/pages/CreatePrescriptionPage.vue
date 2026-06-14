<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch, onUnmounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FormControl, TabButtons, TextInput, Avatar, ListView, Combobox, Autocomplete } from 'frappe-ui'
import { getPatients, getPatient, createPatientPrescription, updatePatientPrescription, getPatientPrescriptions, type Patient } from '@/db/index'
import { useTopbar } from '@/composables/useTopbar'
import LucidePlus from '~icons/lucide/plus'
import LucideTrash from '~icons/lucide/trash-2'
import LucidePrinter from '~icons/lucide/printer'

const route = useRoute()
const router = useRouter()
const { setActions, setToolbar } = useTopbar()

const patients = ref<Patient[]>([])
const loading = ref(true)
const saving = ref(false)
const selectedPatient = ref<Patient | null>(null)

// ── A4 sheet scaling ──────────────────────────────────────────────────
const A4_WIDTH_PX = 793.7   // 210mm at 96dpi
const sheetWrapperRef = ref<HTMLElement | null>(null)
const scaleFactor = ref(1)
let sheetResizeObserver: ResizeObserver | null = null

const sheetStyle = computed(() => ({
  transform: `scale(${scaleFactor.value})`,
  transformOrigin: 'top center',
}))

const wrapperStyle = computed(() => {
  const s = scaleFactor.value
  return {
    width: `${A4_WIDTH_PX * s}px`,
    minHeight: `${1122.5 * s}px`,
    flexShrink: 0 as const,
  }
})

function updateSheetScale() {
  const container = sheetWrapperRef.value?.parentElement
  if (!container) return
  const cw = container.clientWidth - 32 // 32px padding
  const s = Math.min(1, Math.max(0.3, cw / A4_WIDTH_PX))
  scaleFactor.value = Math.round(s * 100) / 100
}

const activeTab = ref('chief_complaint')
const tabs = [
  { label: 'Chief Complaint', value: 'chief_complaint' },
  { label: 'Systemic Alert',  value: 'systemic_alert'  },
  { label: 'Investigation',   value: 'investigation'   },
  { label: 'Diagnosis',       value: 'diagnosis'       },
  { label: 'Medicine',        value: 'medicine'        },
  { label: 'Suggestion',      value: 'suggestions'     },
]

const form = ref({
  patient_id: '',
  patient_name: '',
  chief_complaint: '',
  systemic_alert: '',
  investigation: '',
  diagnosis: '',
  suggestions: '',
  posting_date: new Date().toISOString().split('T')[0],
  healthcare_practitioner: 'Dr. Ishrak Ahmed',
})

interface MedicineItem {
  id: string
  medication: string
  dosage: string
  frequency: string
  freqM: number // Morning dose
  freqA: number // Afternoon dose
  freqE: number // Evening dose
  duration: string
  reason: string
}

function buildFrequency(m: number, a: number, e: number): string {
  if (!m && !a && !e) return ''
  const parts: string[] = []
  if (m) parts.push(`M:${m}`)
  if (a) parts.push(`A:${a}`)
  if (e) parts.push(`E:${e}`)
  return parts.join(' ')
}

function parseFrequency(freq: string): { freqM: number; freqA: number; freqE: number } {
  const m = freq.match(/M:(\d+)/)
  const a = freq.match(/A:(\d+)/)
  const e = freq.match(/E:(\d+)/)
  return {
    freqM: m ? parseInt(m[1]) : 0,
    freqA: a ? parseInt(a[1]) : 0,
    freqE: e ? parseInt(e[1]) : 0,
  }
}

// Map common text frequencies to (M, A, E) numbers
function textFreqToMAE(text: string): { freqM: number; freqA: number; freqE: number } {
  const t = text.toLowerCase().trim()
  if (t.includes('four times daily')) return { freqM: 1, freqA: 1, freqE: 2 }
  if (t.includes('three times daily') || t.includes('3 times daily')) return { freqM: 1, freqA: 1, freqE: 1 }
  if (t.includes('twice daily') || t.includes('2 times daily')) return { freqM: 1, freqA: 0, freqE: 1 }
  if (t.includes('once daily') || t.includes('1 time daily') || t.includes('daily')) return { freqM: 1, freqA: 0, freqE: 0 }
  if (t.includes('every 4 hours')) return { freqM: 1, freqA: 1, freqE: 1 }
  if (t.includes('every 6 hours')) return { freqM: 1, freqA: 1, freqE: 0 }
  if (t.includes('every 8 hours')) return { freqM: 1, freqA: 0, freqE: 1 }
  if (t.includes('every 12 hours')) return { freqM: 1, freqA: 0, freqE: 1 }
  if (t.includes('at bedtime')) return { freqM: 0, freqA: 0, freqE: 1 }
  return { freqM: 0, freqA: 0, freqE: 0 }
}

// Update frequency string whenever M/A/E values change
function updateFrequency(item: MedicineItem) {
  item.frequency = buildFrequency(item.freqM, item.freqA, item.freqE)
}

const medicines = ref<MedicineItem[]>([
  { id: '1', medication: '', dosage: '1 tablet', frequency: 'M:1 A:0 E:0', freqM: 1, freqA: 0, freqE: 0, duration: '7 days', reason: '' }
])

const COMPLAINTS    = ['Toothache', 'Sensitivity to Cold/Hot', 'Swelling', 'Bleeding Gums', 'Broken Tooth', 'Routine Checkup']
const ALERTS        = ['Penicillin Allergy', 'Sulfa Allergy', 'Hypertension', 'Diabetes', 'Bleeding Disorder', 'None']
const INVESTIGATIONS = ['IOPA X-Ray', 'OPG X-Ray', 'CBCT Scan', 'Vitality Testing', 'Clinical Examination']
const DIAGNOSES     = ['Irreversible Pulpitis', 'Acute Periodontitis', 'Deep Dentinal Caries', 'Impacted Third Molar', 'Periapical Abscess']
const SUGGESTIONS   = ['Take after meals', 'Avoid very hot or cold food', 'Follow up in 1 week', 'Maintain oral hygiene']

// Autocomplete option helpers
const getMedicationName = (med: any): string => {
  if (!med) return ''
  if (typeof med === 'string') return med.trim()
  if (typeof med === 'object') {
    if (med.value) return String(med.value).trim()
    if (med.label) return String(med.label).trim()
  }
  return String(med).trim()
}

const toOpts = (arr: string[]) => arr.map(v => ({ label: v, value: v }))

import ALL_MEDICINES from '@/data/medicines.json'

// ── Parsed Medicine Data ─────────────────────────────────────────────
interface ParsedMedicine {
  original: string
  brandName: string
  dosage: string
  form: string
  genericName: string
  manufacturer: string
  displayBox: string
}

function parseMedicineEntry(entry: string): ParsedMedicine {
  const parts = entry.split(' - ')
  const brandFull = parts[0] || ''
  const genericName = parts.length >= 3 ? parts.slice(1, -1).join(' - ') : (parts.length >= 2 ? parts[1] : '')
  const manufacturer = parts.length >= 2 ? parts[parts.length - 1] : ''

  let brandName = brandFull
  let dosage = ''
  let form = ''

  // Extract brand name and dosage from "BrandName strength (Form)"
  const brandMatch = brandFull.match(/^(.+?)\s+(\d[\d\s\/\+\.\,]*\s*(?:mg|mcg|g|ml|IU|unit|units|%)\s*)(?:\((.+?)\))?$/i)
  if (brandMatch) {
    brandName = brandMatch[1].trim()
    dosage = brandMatch[2].trim()
    form = brandMatch[3] || ''
  }

  return {
    original: entry,
    brandName,
    dosage: dosage || brandFull,
    form,
    genericName,
    manufacturer,
    displayBox: dosage ? `${brandName} - ${dosage}` : brandFull,
  }
}

// Pre-parse all medicines once
const ALL_PARSED_MEDICINES: ParsedMedicine[] = ALL_MEDICINES.map(parseMedicineEntry)

// Convert parsed medicine to Autocomplete option
function toMedOption(m: ParsedMedicine) {
  return {
    label: m.displayBox,
    value: m.original,
    manufacturer: m.manufacturer,
    genericName: m.genericName,
  }
}

const ALL_MED_OPTIONS = ALL_PARSED_MEDICINES.map(toMedOption)

// Pre-sort: dental medicines first, then the rest in original order.
// This way, common dental brands (like Napa = paracetamol) appear at the top
// of filtered results since Autocomplete's internal search preserves array order.
const DENTAL_GENERIC_KEYWORDS = [
  'amoxicillin', 'metronidazole', 'ibuprofen', 'paracetamol', 'acetaminophen',
  'clindamycin', 'diclofenac', 'naproxen', 'chlorhexidine', 'doxycycline',
  'erythromycin', 'omeprazole', 'cetirizine', 'penicillin', 'cefalexin',
  'cefadroxil', 'co-amoxiclav', 'lidocaine', 'articaine',
  'dexamethasone', 'prednisolone',
]

function isDentalMedicine(opt: any): boolean {
  const generic = (opt.genericName || '').toLowerCase()
  return DENTAL_GENERIC_KEYWORDS.some(kw => generic.includes(kw))
}

const ALL_MED_OPTIONS_SORTED = [
  ...ALL_MED_OPTIONS.filter(isDentalMedicine),
  ...ALL_MED_OPTIONS.filter(opt => !isDentalMedicine(opt)),
]

// Return stable reference — no reactive changes, so dropdown behaves normally.
function getMedicationOptions() {
  return ALL_MED_OPTIONS_SORTED
}



const DOSAGE_OPTIONS = toOpts([
  '1 tablet', '2 tablets', '½ tablet',
  '1 capsule', '2 capsules',
  '5ml', '10ml', '15ml', '20ml',
  '1 teaspoon', '2 teaspoons',
  '1 sachet', '1 drop', '2 drops',
])

const DURATION_OPTIONS = toOpts([
  '3 days', '5 days', '7 days', '10 days', '14 days',
  '1 month', '2 months', '3 months',
  'Until finished', 'Ongoing',
])

const patientOptions = computed(() =>
  patients.value.map(p => ({ label: p.name, value: p.name }))
)

const selectedPatientOption = computed({
  get() {
    if (!form.value.patient_name) return null
    return { label: form.value.patient_name, value: form.value.patient_name }
  },
  set(val: any) {
    if (val) {
      form.value.patient_name = typeof val === 'object' ? val.value : val
    } else {
      form.value.patient_name = ''
    }
  }
})

function addMedicine() {
  medicines.value.push({ id: String(Date.now()), medication: '', dosage: '1 tablet', frequency: 'M:1 A:0 E:0', freqM: 1, freqA: 0, freqE: 0, duration: '7 days', reason: '' })
}

function removeMedicine(index: number) {
  medicines.value.splice(index, 1)
  if (medicines.value.length === 0) addMedicine()
}

function onFreqInput(val: number | string, rowId: string, slot: 'M' | 'A' | 'E') {
  const num = typeof val === 'string' ? parseInt(val) || 0 : val || 0
  const clamped = Math.min(9, Math.max(0, num))
  
  const idx = medicines.value.findIndex(m => m.id === rowId)
  if (idx === -1) return
  const item = medicines.value[idx]
  if (slot === 'M') item.freqM = clamped
  else if (slot === 'A') item.freqA = clamped
  else if (slot === 'E') item.freqE = clamped
  updateFrequency(item)
  
  // Auto-advance to next input when a digit is entered
  if (clamped > 0) {
    const slotIdx = { M: 0, A: 1, E: 2 }[slot]
    nextTick(() => {
      const container = document.querySelector(`.freq-inputs[data-row-id="${rowId}"]`)
      if (!container) return
      const inputs = container.querySelectorAll<HTMLInputElement>('input[type="number"]')
      if (slotIdx < inputs.length - 1) {
        inputs[slotIdx + 1].focus()
        inputs[slotIdx + 1].select()
      }
    })
  }
}

// ListView columns & rows for the medicine tab
const medColumns = [
  { label: '#',          key: 'num',        width: '48px'  },
  { label: 'Medication', key: 'medication'               },
  { label: 'Dosage',     key: 'dosage',     width: '110px' },
  { label: 'Frequency',  key: 'frequency',  width: '160px' },
  { label: 'Duration',   key: 'duration',   width: '90px'  },
  { label: 'Reason',     key: 'reason',     width: '180px' },
  { label: '',           key: '_actions',   width: '60px'  },
]

const medRows = computed(() =>
  medicines.value.map((m, i) => ({ ...m, num: i + 1 }))
)

function loadAiSuggestionForPatient(patient: any) {
  if (!patient || !patient.notes) return
  const match = patient.notes.match(/__AI_SUGGESTION__JSON:(.+)$/m)
  if (!match) return

  try {
    const data = JSON.parse(match[1])
    form.value.chief_complaint = data.chief_complaint || ''
    form.value.systemic_alert = data.systemic_alert || ''
    form.value.investigation = data.investigation || ''
    form.value.diagnosis = data.diagnosis || ''
    form.value.suggestions = data.suggestions || ''

    if (data.prescriptions && Array.isArray(data.prescriptions)) {
      medicines.value = data.prescriptions.map((rx: any, idx: number) => {
        const mae = textFreqToMAE(rx.frequency || rx.sig || '')
        return {
          id: String(idx + 1),
          medication: rx.name || rx.medication || '',
          dosage: rx.dosage || '',
          frequency: buildFrequency(mae.freqM, mae.freqA, mae.freqE),
          freqM: mae.freqM,
          freqA: mae.freqA,
          freqE: mae.freqE,
          duration: rx.duration || '',
          reason: rx.reason || ''
        }
      })
      if (medicines.value.length === 0) {
        medicines.value = [{ id: '1', medication: '', dosage: '1 tablet', frequency: 'M:1 A:0 E:0', freqM: 1, freqA: 0, freqE: 0, duration: '7 days', reason: '' }]
      }
    }
  } catch (err) {
    console.error('Failed to parse AI suggestion JSON from patient notes:', err)
  }
}

function selectPatient(patientId: string) {
  let found = patients.value.find(p => String(p.id) === String(patientId))
  if (!found && patientId === 'demo-1') {
    found = patients.value.find(p => p.name === 'Sarah Johnson') || patients.value[0]
  }
  selectedPatient.value = found || null
  if (found) {
    form.value.patient_id = found.id
    form.value.patient_name = found.name
    const rxId = route.query.rx_id as string
    if (!rxId) {
      loadAiSuggestionForPatient(found)
    }
  }
}

function toggleBadge(field: 'chief_complaint' | 'systemic_alert' | 'investigation' | 'diagnosis' | 'suggestions', value: string) {
  if (value === 'None') { form.value[field] = 'None'; return }
  const current = form.value[field]
  if (!current)                     form.value[field] = value
  else if (current.includes(value)) form.value[field] = current.split(', ').filter(v => v !== value).join(', ')
  else                              form.value[field] = current === 'None' ? value : `${current}, ${value}`
}

onMounted(async () => {
  setToolbar(null)
  updateNavActions()
  try { patients.value = await getPatients() }
  catch (e) { console.error('Failed to load patients:', e) }
  finally { loading.value = false }

  await nextTick()
  // ── A4 sheet scaling setup ──
  updateSheetScale()
  const container = sheetWrapperRef.value?.parentElement
  if (container) {
    sheetResizeObserver = new ResizeObserver(() => updateSheetScale())
    sheetResizeObserver.observe(container)
  }

  const pid = (route.query.patientId || route.query.patient_id) as string
  const rxId = route.query.rx_id as string
  if (pid) {
    form.value.patient_id = pid
    selectPatient(pid)
    if (!selectedPatient.value) {
      try {
        const p = await getPatient(pid)
        if (p) {
          selectedPatient.value = p
          if (!rxId) {
            loadAiSuggestionForPatient(p)
          }
        }
      } catch (e) {
        console.error('Failed to resolve patient fallback:', e)
      }
    }
  }

  if (rxId) {
    try {
      const rxList = await getPatientPrescriptions()
      const rx = rxList.find(r => r.id === rxId)
      if (rx) {
        // Pre-fill form from existing prescription
        // Notes parsing
        const notes = rx.notes || ''
        const lines = notes.split('\n')
        lines.forEach(l => {
          if (l.startsWith('Chief Complaint: ')) form.value.chief_complaint = l.replace('Chief Complaint: ', '')
          if (l.startsWith('Systemic Alert: '))  form.value.systemic_alert = l.replace('Systemic Alert: ', '')
          if (l.startsWith('Investigation: '))   form.value.investigation = l.replace('Investigation: ', '')
          if (l.startsWith('Diagnosis: '))       form.value.diagnosis = l.replace('Diagnosis: ', '')
          if (l.startsWith('Suggestions: '))     form.value.suggestions = l.replace('Suggestions: ', '')
        })
        form.value.posting_date = new Date(rx.issued_date).toISOString().split('T')[0]
        
        // Medicines parsing
        // Medication format: "MedName (Dosage, Frequency, Duration), ..."
        const medParts = rx.medication.split(', ')
        const rxNotes = rx.notes || ''
        medicines.value = medParts.map((p, idx) => {
          const match = p.match(/^(.+?)\s+\((.+?),\s*(.+?),\s*(.+?)\)$/)
          let medication = p
          let dosage = ''
          let frequency = ''
          let duration = ''
          let freqM = 0
          let freqA = 0
          let freqE = 0

          if (match) {
            medication = match[1]
            dosage = match[2]
            frequency = match[3]
            const mae = parseFrequency(match[3])
            freqM = mae.freqM
            freqA = mae.freqA
            freqE = mae.freqE
            duration = match[4]
          }

          // Try to extract reason from rxNotes
          let reason = ''
          const cleanMed = medication.split(' - ')[0].trim().toLowerCase()
          const lines = rxNotes.split('\n')
          for (const line of lines) {
            if (line.toLowerCase().startsWith(cleanMed) || line.toLowerCase().includes(`${cleanMed}:`)) {
              const reasonMatch = line.match(/Reason:\s*(.+?)(?:\.|\s*Warning:|$)/i)
              if (reasonMatch) {
                reason = reasonMatch[1].trim()
                break
              }
              const colonIdx = line.indexOf(':')
              if (colonIdx !== -1) {
                reason = line.substring(colonIdx + 1).replace(/Reason:|Warning:/gi, '').trim()
                break
              }
            }
          }

          return {
            id: String(idx + 1),
            medication,
            dosage,
            frequency,
            freqM,
            freqA,
            freqE,
            duration,
            reason
          }
        })
      }
    } catch (e) {
      console.error('Failed to load prescription for editing:', e)
    }
  }
})

onBeforeUnmount(() => {
  sheetResizeObserver?.disconnect()
  sheetResizeObserver = null
})

async function save(opts?: { print?: boolean }) {
  if (!form.value.patient_id) { alert('Please select a patient'); return }
  const activeMeds = medicines.value.filter(m => getMedicationName(m.medication))
  if (!activeMeds.length) { alert('Please add at least one medication'); return }

  saving.value = true
  const notesParts: string[] = []
  if (form.value.chief_complaint) notesParts.push(`Chief Complaint: ${form.value.chief_complaint}`)
  if (form.value.systemic_alert)  notesParts.push(`Systemic Alert: ${form.value.systemic_alert}`)
  if (form.value.investigation)   notesParts.push(`Investigation: ${form.value.investigation}`)
  if (form.value.diagnosis)       notesParts.push(`Diagnosis: ${form.value.diagnosis}`)
  if (form.value.suggestions)     notesParts.push(`Suggestions: ${form.value.suggestions}`)

  // Append reasons for each medicine
  activeMeds.forEach(m => {
    if (m.reason) {
      const medName = getMedicationName(m.medication).split(' - ')[0].trim()
      notesParts.push(`${medName}: Reason: ${m.reason}.`)
    }
  })

  const rxData = {
    patient_id: form.value.patient_id,
    doctor_id:  'mock-doctor-1',
    medication: activeMeds.map(m => {
      const medName = getMedicationName(m.medication)
      const cleanName = medName.split(' - ')[0].trim()
      return `${cleanName} (${m.dosage}, ${m.frequency}, ${m.duration})`
    }).join(', '),
    dosage:     activeMeds[0].dosage,
    frequency:  activeMeds[0].frequency,
    duration:   activeMeds[0].duration,
    notes:      notesParts.join('\n'),
  }

  try {
    const rxId = route.query.rx_id as string
    if (rxId) {
      await updatePatientPrescription(rxId, rxData)
    } else {
      await createPatientPrescription(rxData)
    }
    
    if (opts?.print) {
      window.print()
    }
    router.back()
  } catch (e) {
    console.error('Failed to save prescription:', e)
    alert('Failed to save prescription')
  } finally {
    saving.value = false
  }
}

function printPrescription() {
  window.print()
}

function cancel() { router.back() }

function updateNavActions() {
  setActions([
    {
      label: 'Cancel',
      variant: 'outline',
      onClick: cancel,
    },
    {
      label: 'Print',
      variant: 'outline',
      onClick: printPrescription,
    },
    {
      label: 'Save & Print',
      variant: 'solid',
      theme: 'blue',
      loading: saving.value,
      onClick: () => save({ print: true }),
    }
  ])
}

watch(saving, () => {
  updateNavActions()
})

watch(() => form.value.patient_name, (newName) => {
  if (!newName) {
    selectedPatient.value = null
    form.value.patient_id = ''
    return
  }
  const found = patients.value.find(p => p.name.toLowerCase() === newName.toLowerCase())
  if (found) {
    selectedPatient.value = found
    form.value.patient_id = found.id
    const rxId = route.query.rx_id as string
    if (!rxId) {
      loadAiSuggestionForPatient(found)
    }
  } else {
    selectedPatient.value = {
      id: 'custom-patient',
      name: newName,
      birth_year: 1990,
      gender: 'male',
    }
    form.value.patient_id = 'custom-patient'
  }
})
function clearPatientSelection() {
  selectedPatient.value = null
  form.value.patient_id = ''
  form.value.patient_name = ''
}

// Clinical Prescription Templates
const CLINICAL_TEMPLATES = [
  {
    name: 'Root Canal Treatment (RCT)',
    chief_complaint: 'Severe toothache, sensitivity to cold and hot food',
    systemic_alert: 'None',
    investigation: 'IOPA X-Ray of the offending tooth',
    diagnosis: 'Irreversible Pulpitis',
    suggestions: 'Take after meals, Avoid very hot or cold food, Follow up in 1 week',
    medicines: [
      { medication: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'Three times daily', duration: '5 days' },
      { medication: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '3 days' },
      { medication: 'Chlorhexidine Mouthwash 0.2%', dosage: '10ml', frequency: 'Twice daily', duration: '7 days' },
    ]
  },
  {
    name: 'Simple Tooth Extraction',
    chief_complaint: 'Broken tooth, inability to chew on it',
    systemic_alert: 'None',
    investigation: 'Clinical examination and visual assessment, OPG X-Ray',
    diagnosis: 'Grossly Caries Tooth / Unsalvageable Tooth',
    suggestions: 'Do not spit or gargle for 24 hours, Bite on the cotton pack firmly for 1 hour, Avoid hot or spicy food today',
    medicines: [
      { medication: 'Paracetamol 1000mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '3 days' },
      { medication: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'Three times daily', duration: '5 days' },
    ]
  },
  {
    name: 'Scaling & Prophylaxis (Gums)',
    chief_complaint: 'Bleeding gums when brushing, bad breath',
    systemic_alert: 'None',
    investigation: 'Clinical Examination & Periodontal probing',
    diagnosis: 'Chronic Generalized Gingivitis',
    suggestions: 'Brush twice daily, Use dental floss daily, Follow up in 6 months for checkup',
    medicines: [
      { medication: 'Chlorhexidine Mouthwash 0.2%', dosage: '10ml', frequency: 'Twice daily', duration: '14 days' },
    ]
  },
  {
    name: 'Deep Dental Caries (Restoration)',
    chief_complaint: 'Mild food lodgement, transient sensitivity to sweet',
    systemic_alert: 'None',
    investigation: 'Clinical Examination and Vitality testing',
    diagnosis: 'Deep Dentinal Caries',
    suggestions: 'Maintain proper oral hygiene, Avoid sticky foods, Brush twice daily',
    medicines: []
  }
]

const templateNames = computed(() => CLINICAL_TEMPLATES.map(t => t.name))
const selectedTemplateName = ref('')

watch(selectedTemplateName, (templateName) => {
  if (!templateName) return
  const t = CLINICAL_TEMPLATES.find(x => x.name === templateName)
  if (t) {
    form.value.chief_complaint = t.chief_complaint
    form.value.systemic_alert = t.systemic_alert
    form.value.investigation = t.investigation
    form.value.diagnosis = t.diagnosis
    form.value.suggestions = t.suggestions
    
    if (t.medicines && t.medicines.length > 0) {
      medicines.value = t.medicines.map((m, idx) => {
        const mae = textFreqToMAE(m.frequency)
        return {
          id: String(idx + 1),
          medication: m.medication,
          dosage: m.dosage,
          frequency: buildFrequency(mae.freqM, mae.freqA, mae.freqE),
          freqM: mae.freqM,
          freqA: mae.freqA,
          freqE: mae.freqE,
          duration: m.duration,
          reason: (m as any).reason || ''
        }
      })
    } else {
      medicines.value = [{ id: '1', medication: '', dosage: '1 tablet', frequency: 'M:1 A:0 E:0', freqM: 1, freqA: 0, freqE: 0, duration: '7 days', reason: '' }]
    }
  }
})
const templateOptions = computed(() =>
  CLINICAL_TEMPLATES.map(t => ({ label: t.name, value: t.name }))
)

const selectedTemplateOption = computed({
  get() {
    if (!selectedTemplateName.value) return null
    return { label: selectedTemplateName.value, value: selectedTemplateName.value }
  },
  set(val: any) {
    if (val) {
      selectedTemplateName.value = typeof val === 'object' ? val.value : val
    } else {
      selectedTemplateName.value = ''
    }
  }
})


</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <div v-if="loading" class="text-sm text-ink-gray-5">Loading…</div>

    <template v-else>
      <div class="grid grid-cols-12 gap-6 items-start">
      <!-- LEFT: form -->
      <div class="col-span-7 flex flex-col gap-5">
      <div class="flex flex-col gap-1.5 mb-1">
        <label class="text-xs font-medium text-ink-gray-5">Patient <span class="text-red-500">*</span></label>
        <Combobox
          :key="patients.length"
          v-model="form.patient_name"
          :options="patientOptions"
          placeholder="Search or pick a patient..."
          open-on-focus
          :disabled="!!(route.query.patientId || route.query.patient_id)"
          class="w-full"
        />
        <!-- Dynamic patient details helper row -->
        <div v-if="selectedPatient && selectedPatient.id !== 'custom-patient'" class="text-xs text-ink-gray-5 mt-0.5 ml-0.5">
          ID: {{ selectedPatient.id }} &nbsp;|&nbsp; <span class="capitalize">{{ selectedPatient.gender }}</span> &nbsp;|&nbsp; {{ new Date().getFullYear() - selectedPatient.birth_year }} yrs
        </div>
      </div>

      <!-- Template Selector (Labeled exactly like Posting Date) -->
      <div class="flex flex-col gap-1.5 mb-1">
        <label class="text-xs font-medium text-ink-gray-5">Select from Template</label>
        <Combobox
          v-model="selectedTemplateName"
          :options="templateOptions"
          placeholder="Select a clinical template (Root Canal, Extraction...)"
          open-on-focus
          class="w-full"
        />
      </div>

      <!-- Metadata row (posting date + practitioner) -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Posting Date</label>
          <TextInput type="date" v-model="form.posting_date" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Healthcare Practitioner</label>
          <TextInput v-model="form.healthcare_practitioner" placeholder="Dr. name…" />
        </div>
      </div>

      <!-- Tabs -->
      <TabButtons :buttons="tabs" v-model="activeTab" />

      <!-- ── Chief Complaint ───────────────────────────────────────────── -->
      <div v-if="activeTab === 'chief_complaint'" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Chief Complaint</label>
          <FormControl type="textarea" v-model="form.chief_complaint" placeholder="Describe the patient's main complaints…" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Quick Select</label>
          <div class="flex flex-wrap gap-2">
            <Button v-for="item in COMPLAINTS" :key="item" variant="subtle" size="sm" @click="toggleBadge('chief_complaint', item)">
              + {{ item }}
            </Button>
          </div>
        </div>
      </div>

      <!-- ── Systemic Alert ────────────────────────────────────────────── -->
      <div v-if="activeTab === 'systemic_alert'" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Systemic Alert / Medical History</label>
          <FormControl type="textarea" v-model="form.systemic_alert" placeholder="Allergies, chronic conditions, medications the patient is on…" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Quick Select</label>
          <div class="flex flex-wrap gap-2">
            <Button v-for="item in ALERTS" :key="item" variant="subtle" size="sm" theme="red" @click="toggleBadge('systemic_alert', item)">
              + {{ item }}
            </Button>
          </div>
        </div>
      </div>

      <!-- ── Investigation ─────────────────────────────────────────────── -->
      <div v-if="activeTab === 'investigation'" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Recommended Investigations</label>
          <FormControl type="textarea" v-model="form.investigation" placeholder="X-rays, lab tests, or other investigations ordered…" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Quick Select</label>
          <div class="flex flex-wrap gap-2">
            <Button v-for="item in INVESTIGATIONS" :key="item" variant="subtle" size="sm" @click="toggleBadge('investigation', item)">
              + {{ item }}
            </Button>
          </div>
        </div>
      </div>

      <!-- ── Diagnosis ──────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'diagnosis'" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Clinical Diagnosis</label>
          <FormControl type="textarea" v-model="form.diagnosis" placeholder="Confirmed clinical diagnosis…" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Quick Select</label>
          <div class="flex flex-wrap gap-2">
            <Button v-for="item in DIAGNOSES" :key="item" variant="subtle" size="sm" @click="toggleBadge('diagnosis', item)">
              + {{ item }}
            </Button>
          </div>
        </div>
      </div>

      <!-- ── Medicine ───────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'medicine'" class="flex flex-col gap-4">
        <ListView
          :columns="medColumns"
          :rows="medRows"
          row-key="id"
          :options="{ selectable: false, showTooltip: false, emptyState: { title: 'No medications', description: 'Click Add Row to add a medication' } }"
        >
          <template #cell="{ column, row }">
            <!-- Row number -->
            <span v-if="column.key === 'num'" class="text-xs font-medium text-ink-gray-5">{{ row.num }}</span>

            <!-- Medication (searchable autocomplete) -->
            <Autocomplete
              v-else-if="column.key === 'medication'"
              :options="getMedicationOptions()"
              v-model="medicines[medicines.findIndex(m => m.id === row.id)].medication"
              placeholder="Search medication..."
              :max-options="50"
            >
              <template #item-suffix="{ option }">
                <span v-if="option.manufacturer" class="text-xs text-ink-gray-5 whitespace-nowrap ml-2">{{ option.manufacturer }}</span>
              </template>
            </Autocomplete>

            <!-- Dosage -->
            <FormControl
              v-else-if="column.key === 'dosage'"
              type="autocomplete"
              :options="DOSAGE_OPTIONS"
              v-model="medicines[medicines.findIndex(m => m.id === row.id)].dosage"
              placeholder="Dosage"
            />

            <!-- Frequency: 3 small number inputs (Morning / Afternoon / Evening) -->
            <div v-else-if="column.key === 'frequency'" class="flex items-center gap-0.5 freq-inputs" :data-row-id="row.id">
              <TextInput
                type="number"
                size="sm"
                variant="subtle"
                class="freq-num-wrap"
                min="0"
                max="9"
                data-slot="M"
                :modelValue="medicines[medicines.findIndex(m => m.id === row.id)].freqM"
                @update:modelValue="onFreqInput($event, row.id, 'M')"
              />
              <span class="text-xs text-ink-gray-4">-</span>
              <TextInput
                type="number"
                size="sm"
                variant="subtle"
                class="freq-num-wrap"
                min="0"
                max="9"
                data-slot="A"
                :modelValue="medicines[medicines.findIndex(m => m.id === row.id)].freqA"
                @update:modelValue="onFreqInput($event, row.id, 'A')"
              />
              <span class="text-xs text-ink-gray-4">-</span>
              <TextInput
                type="number"
                size="sm"
                variant="subtle"
                class="freq-num-wrap"
                min="0"
                max="9"
                data-slot="E"
                :modelValue="medicines[medicines.findIndex(m => m.id === row.id)].freqE"
                @update:modelValue="onFreqInput($event, row.id, 'E')"
              />
            </div>

            <!-- Duration -->
            <FormControl
              v-else-if="column.key === 'duration'"
              type="autocomplete"
              :options="DURATION_OPTIONS"
              v-model="medicines[medicines.findIndex(m => m.id === row.id)].duration"
              placeholder="Duration"
            />

            <!-- Reason -->
            <FormControl
              v-else-if="column.key === 'reason'"
              v-model="medicines[medicines.findIndex(m => m.id === row.id)].reason"
              placeholder="Reason for prescribing..."
            />

            <!-- Delete action -->
            <div v-else-if="column.key === '_actions'" class="flex items-center justify-end w-full">
              <button
                class="flex items-center justify-center w-7 h-7 rounded text-ink-gray-4 hover:bg-surface-red-1 hover:text-ink-red-3 transition-colors cursor-pointer"
                @click.stop="removeMedicine(medicines.findIndex(m => m.id === row.id))"
              >
                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </template>
        </ListView>

        <Button variant="outline" size="sm" class="self-start" @click="addMedicine">
          <template #prefix><LucidePlus class="size-3.5" /></template>
          Add Row
        </Button>
      </div>

      <!-- ── Suggestion ─────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'suggestions'" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Suggestions &amp; Recommendations</label>
          <FormControl type="textarea" v-model="form.suggestions" placeholder="Dietary instructions or follow-up advice…" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium text-ink-gray-5">Quick Select</label>
          <div class="flex flex-wrap gap-2">
            <Button v-for="item in SUGGESTIONS" :key="item" variant="subtle" size="sm" @click="toggleBadge('suggestions', item)">
              + {{ item }}
            </Button>
          </div>
        </div>
      </div>

      </div><!-- /col left -->

      <!-- RIGHT: professional prescription pad preview (sticky) -->
      <div class="col-span-5 sticky top-6 self-start flex flex-col gap-2">

        <div class="prescription-sheet-container overflow-auto border border-outline-gray-2 rounded-lg bg-surface-gray-2 p-4 max-h-[calc(100vh-140px)] flex justify-center">
          <div class="sheet-wrapper" ref="sheetWrapperRef" :style="wrapperStyle">
          <div class="prescription-sheet" :style="sheetStyle">

            <table class="header-table">
                <tr>
                    <td class="logo-cell">
                        <div class="clinic-name">Dently Clinic <span class="clinic-sub">&amp; Braces Centre</span></div>
                    </td>
                    <td class="doctor-cell">
                        <div class="doctor-name">{{ form.healthcare_practitioner.startsWith('Dr') ? form.healthcare_practitioner : 'Dr. ' + form.healthcare_practitioner }}</div>
                        <div>Orthodontist &amp; Dental Surgeon</div>
                        <div>Reg No: BMDC/4881</div>
                        <div class="clinic-address">House 12, Dhanmondi, Dhaka &bull; +880 1711-000000</div>
                    </td>
                </tr>
            </table>
            <div class="header-accent"></div>

            <div class="horizontal-divider"></div>

            <table class="meta-table">
                <tr>
                    <td class="meta-item">
                        <span class="meta-label">Patient ID</span>
                        <span class="meta-value">{{ selectedPatient?.id || '—' }}</span>
                    </td>
                    <td class="meta-item">
                        <span class="meta-label">Name</span>
                        <span class="meta-value">{{ selectedPatient?.name || '—' }}</span>
                    </td>
                    <td class="meta-item">
                        <span class="meta-label">Age / Sex</span>
                        <span class="meta-value">
                          {{ selectedPatient ? (new Date().getFullYear() - selectedPatient.birth_year) : '—' }} / 
                          {{ selectedPatient?.gender === 'male' ? 'M' : selectedPatient?.gender === 'female' ? 'F' : '—' }}
                        </span>
                    </td>
                    <td class="meta-item">
                        <span class="meta-label">Date</span>
                        <span class="meta-value">
                          {{ form.posting_date ? new Date(form.posting_date + 'T00:00:00').toLocaleDateString('en-GB') : '' }}
                        </span>
                    </td>
                </tr>
            </table>

            <table class="main-grid">
                <thead>
                    <tr>
                        <th class="left-panel">Clinical Assessment</th>
                        <th class="right-panel">Medicines</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="left-panel">
                            
                            <div v-if="form.chief_complaint" class="clinical-stack-block">
                                <div class="stack-label">Chief Complaint</div>
                                <div class="stack-content-lines">{{ form.chief_complaint }}</div>
                            </div>

                            <div v-if="form.systemic_alert" class="clinical-stack-block">
                                <div class="stack-label">Systemic Alert</div>
                                <div class="stack-content-lines text-red-600 font-semibold">{{ form.systemic_alert }}</div>
                            </div>

                            <div v-if="form.investigation" class="clinical-stack-block">
                                <div class="stack-label">Investigation</div>
                                <div class="stack-content-lines">{{ form.investigation }}</div>
                            </div>

                            <div v-if="form.diagnosis" class="clinical-stack-block">
                                <div class="stack-label">Diagnosis</div>
                                <div class="stack-content-lines font-semibold">{{ form.diagnosis }}</div>
                            </div>

                        </td>
                        
                        <td class="right-panel">
                            
                            <div class="rx-image-container">
                                <img class="rx-image" src="https://upload.wikimedia.org/wikipedia/commons/5/5d/Pharmacy_Rx_symbol_used_on_prescriptions.svg" alt="Rx Symbol">
                            </div>
                            
                            <table class="prescription-meds-table">
                                <thead>
                                    <tr>
                                        <th style="width: 38%; padding: 4px; border-bottom: 2px solid #000; font-size: 18px; font-weight: bold; text-align: left;">Medication</th>
                                        <th style="width: 14%; padding: 4px; border-bottom: 2px solid #000; font-size: 18px; font-weight: bold; text-align: left;">Dosage</th>
                                        <th style="width: 18%; padding: 4px; border-bottom: 2px solid #000; font-size: 18px; font-weight: bold; text-align: left;">Frequency</th>
                                        <th style="width: 14%; padding: 4px; border-bottom: 2px solid #000; font-size: 18px; font-weight: bold; text-align: left;">Duration</th>
                                        <th style="width: 16%; padding: 4px; border-bottom: 2px solid #000; font-size: 18px; font-weight: bold; text-align: left;">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in medicines.filter(m => getMedicationName(m.medication))" :key="item.id">
                                        <td style="padding: 6px 4px; border-bottom: 1px solid #e0e0e0; font-size: 18px; vertical-align: top;">
                                            <div><strong>{{ idx + 1 }}. {{ getMedicationName(item.medication).split(' - ')[0].trim() }}</strong></div>
                                            <div style="font-size: 14px; color: #777; margin-top: 1px;">Oral Route</div>
                                        </td>
                                        <td style="padding: 6px 4px; border-bottom: 1px solid #e0e0e0; font-size: 18px; vertical-align: top; color: #333;">
                                            {{ item.dosage }}
                                        </td>
                                        <td style="padding: 6px 4px; border-bottom: 1px solid #e0e0e0; font-size: 18px; vertical-align: top; font-weight: 600; letter-spacing: 0.5px;">
                                            {{ item.frequency }}
                                        </td>
                                        <td style="padding: 6px 4px; border-bottom: 1px solid #e0e0e0; font-size: 18px; vertical-align: top; color: #333;">
                                            {{ item.duration }}
                                        </td>
                                        <td style="padding: 6px 4px; border-bottom: 1px solid #e0e0e0; font-size: 16px; vertical-align: top; color: #555; font-style: italic;">
                                            {{ item.reason || '—' }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div v-if="!medicines.filter(m => getMedicationName(m.medication)).length" class="no-meds" style="margin-top: 10px;">No medications prescribed</div>

                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="center-alert">
                Keep home/room ambient wherever applicable.
            </div>

            <div class="advice-section" v-if="form.suggestions">
                <span class="advice-label">General Advice:</span>
                {{ form.suggestions }}
            </div>

            <div class="signature-area">
                <div class="sig-line"></div>
                <span class="sig-label">Authorized Signature</span>
            </div>

            <div class="legal-block">
                <div>1. This prescription is issued based on professional clinical evaluation. The patient is advised to follow the prescribed dosage and duration as directed.</div>
                <div>2. Please verify all medication details with the dispensing pharmacist before consumption.</div>
                <div>3. This information is confidential and intended solely for the named patient and healthcare provider.</div>
            </div>

          </div>
          </div>
        </div>
      </div><!-- /col right -->

      </div><!-- /grid -->
    </template>
  </div>
</template>

<style scoped>
.sheet-wrapper {
    overflow: hidden;
    display: flex;
    justify-content: center;
}

.prescription-sheet {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm 15mm;
    flex-shrink: 0;
    box-sizing: border-box;
    position: relative;
    background-color: #ffffff;
    font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
    color: #000000;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 5px;
}

.logo-cell {
    vertical-align: top;
    width: 50%;
    text-align: left;
}

.clinic-name {
    font-size: 24px;
    font-weight: 800;
    color: #1a3a5c;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.clinic-sub {
    font-size: 15px;
    font-weight: 600;
    color: #3b82c4;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    display: block;
    margin-top: 1px;
}

.header-accent {
    height: 2px;
    background: linear-gradient(to right, #1a3a5c, #3b82c4, transparent);
    margin-bottom: 10px;
}

.doctor-cell {
    vertical-align: top;
    text-align: right;
    width: 50%;
    font-size: 18px;
    line-height: 1.35;
}

.doctor-name {
    font-size: 21px;
    font-weight: bold;
    margin-bottom: 1px;
}

.clinic-address {
    color: #555;
    font-size: 16px;
    margin-top: 2px;
}

.meta-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
}

.meta-table tr {
    display: flex;
    gap: 0;
}

.meta-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 0;
    vertical-align: top;
    border-right: 1px solid #e0e0e0;
    padding: 4px 10px;
}

.meta-item:first-child {
    padding-left: 0;
}

.meta-item:last-child {
    border-right: none;
    padding-right: 0;
}

.meta-label {
    font-size: 15px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.meta-value {
    font-size: 19px;
    font-weight: 600;
    color: #000;
}

.horizontal-divider {
    border-top: 1px solid #000000;
    margin: 6px 0 8px 0;
}

.main-grid {
    width: 100%;
    border-collapse: collapse;
    border-top: 1px solid #000000;
    border-bottom: 1px solid #000000;
}

.main-grid th {
    font-size: 19px;
    font-weight: bold;
    padding: 5px 8px;
    text-align: left;
    border-bottom: 1px solid #000000;
}

.main-grid td {
    vertical-align: top;
    padding: 8px 8px;
    font-size: 19px;
}

.left-panel {
    width: 35%;
    border-right: 1px solid #000000;
}

.right-panel {
    width: 65%;
}

.clinical-stack-block {
    margin-bottom: 10px;
}

.stack-label {
    font-weight: 700;
    font-size: 16px;
    color: #1a3a5c;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 3px;
    border-bottom: 1px solid #d0d0d0;
    padding-bottom: 2px;
}

.stack-content-lines {
    min-height: 18px;
    color: #000000;
    padding-left: 12px;
    line-height: 1.35;
}

.rx-image-container {
    margin-bottom: 8px;
    padding-left: 2px;
}

.rx-image {
    width: 30px;
    height: auto;
    display: block;
    border: none;
    outline: none;
}

.med-row {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
}

.med-row td {
    padding: 0;
    border: none;
}

.med-identity {
    width: 55%;
    vertical-align: top;
}

.med-meta {
    color: #777777;
    font-size: 18px;
    margin-top: 2px;
}

.med-directions {
    width: 45%;
    vertical-align: top;
    text-align: left;
    font-size: 18px;
    line-height: 1.35;
    padding-left: 10px !important;
}

.no-meds {
    color: #999;
    font-style: italic;
    padding-left: 2px;
    font-size: 19px;
}

.sig-pattern {
    font-size: 19px;
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 1px;
}

.center-alert {
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #666;
    margin: 10px 0;
    font-style: italic;
}

.advice-section {
    font-size: 19px;
    line-height: 1.4;
    margin-bottom: 20px;
}

.advice-label {
    font-weight: 600;
    color: #444;
    display: block;
    margin-bottom: 2px;
}

.signature-area {
    text-align: right;
    margin-bottom: 20px;
}

.sig-line {
    width: 200px;
    border-bottom: 1px solid #999;
    margin-bottom: 4px;
    margin-left: auto;
}

.sig-label {
    font-size: 18px;
    color: #666;
}

.legal-block {
    border-top: 1px solid #d0d0d0;
    padding-top: 8px;
    font-size: 15px;
    color: #777;
    line-height: 1.4;
}

.legal-block div {
    margin-bottom: 3px;
}

.legal-block div:last-child {
    margin-bottom: 0;
}

@media print {
    @page {
        size: A4;
        margin: 0;
    }
    body * {
        visibility: hidden;
    }
    .prescription-sheet-container,
    .sheet-wrapper,
    .prescription-sheet,
    .prescription-sheet * {
        visibility: visible;
    }
    .prescription-sheet-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 210mm;
        height: 297mm;
        overflow: visible;
        padding: 0;
        border: none;
        background: none;
        box-shadow: none;
    }
    .sheet-wrapper {
        overflow: visible;
        width: 210mm !important;
        height: 297mm !important;
        min-height: auto !important;
        display: block;
    }
    .prescription-sheet {
        transform: none !important;
        position: static;
        width: 210mm;
        height: 297mm;
        aspect-ratio: unset;
        border: none;
        padding: 20mm 15mm;
        box-shadow: none;
        margin: 0;
    }
}

/* ── Frequency 3-number inputs ── */
.freq-inputs {
    display: inline-flex;
    align-items: center;
    gap: 2px;
}

.freq-num-wrap {
    width: 48px !important;
}

.freq-num-wrap input {
    text-align: center !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    padding: 0 !important;
    -moz-appearance: textfield !important;
}

.freq-num-wrap input::-webkit-outer-spin-button,
.freq-num-wrap input::-webkit-inner-spin-button {
    -webkit-appearance: none !important;
    margin: 0 !important;
}
</style>
