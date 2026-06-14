<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Sidebar,
  Button,
  Dialog,
  Badge
} from 'frappe-ui'
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  FlaskConical,
  Receipt,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Send,
  Copy,
  CheckCircle,
  Database,
  Activity,
  FileCode,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  Trash2,
  Bell,
  Stethoscope
} from 'lucide-vue-next'

// Active tab state
const activeTab = ref('dashboard')

// Theme toggle handler
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', newTheme)
  triggerToast(`Switched theme to ${newTheme}!`)
}

// Sidebar configuration matching the frappe-ui component structure
const sidebarHeader = {
  title: 'Dawn',
  subtitle: 'Special Clinic',
  logo: 'https://raw.githubusercontent.com/frappe/crm/develop/.github/logo.svg',
  menuItems: [
    { label: 'Toggle Theme', icon: 'lucide-moon', onClick: toggleTheme },
  ],
}

// Computed sections to dynamically set the active state matching the root path '/'
const sidebarSections = computed(() => [
  {
    label: 'Main',
    items: [
      {
        label: 'Search',
        icon: 'lucide-search',
        onClick: () => { showSearchModal.value = true }
      },
      {
        label: 'Dashboard',
        icon: 'lucide-layout-dashboard',
        to: activeTab.value === 'dashboard' ? '/' : '/dashboard',
        onClick: () => { activeTab.value = 'dashboard' }
      },
      {
        label: 'Patients',
        icon: 'lucide-users',
        to: activeTab.value === 'patients' ? '/' : '/patients',
        onClick: () => { activeTab.value = 'patients' }
      },
      {
        label: 'Appointments',
        icon: 'lucide-calendar',
        to: activeTab.value === 'appointments' ? '/' : '/appointments',
        onClick: () => { activeTab.value = 'appointments' }
      },
    ],
  },
  {
    label: 'Billing & Finance',
    items: [
      {
        label: 'Treatment Plan',
        icon: 'lucide-clipboard-list',
        to: activeTab.value === 'treatments' ? '/' : '/treatments',
        onClick: () => { activeTab.value = 'treatments' }
      },
    ],
  },
])

// Toast alerts
const toastMessage = ref('')
const showToast = ref(false)
const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Dialog States
const showSearchModal = ref(false)
const searchQuery = ref('')
const showNewLabModal = ref(false)
const showNewExpenseModal = ref(false)
const showNewApptModal = ref(false)

// Dropdown/Filter mock states
const showDaysDropdown = ref(false)
const showDeptDropdown = ref(false)
const selectedDaysFilter = ref('Last 30 Days')
const selectedDeptFilter = ref('All Departments')

// App States
const appointments = ref([
  { id: 1, title: 'team', time: '2:03 AM' }
])
const labCases = ref<any[]>([])
const expenses = ref<any[]>([])

// Form inputs
const newApptTitle = ref('')
const newApptTime = ref('09:00 AM')
const newLabTitle = ref('')
const newLabNotes = ref('')
const newExpenseTitle = ref('')
const newExpenseAmount = ref<number | null>(null)

// Patients Data
const patients = ref([
  { id: 'PAT-8802', name: 'Sarah Jenkins', phone: '555-0192', email: 'sarah.j@example.com', gender: 'Female', allergies: 'Penicillin, NSAIDs', radiographs: '[{"type": "Bitewing", "date": "2026-03-15"}]' },
  { id: 'PAT-5512', name: 'John Doe', phone: '555-0143', email: 'john.doe@example.com', gender: 'Male', allergies: 'Penicillin', radiographs: '[{"type": "Bitewing", "date": "2026-06-01"}]' },
  { id: 'PAT-1204', name: 'Robert Smith', phone: '555-0177', email: 'robert.s@example.com', gender: 'Male', allergies: 'None', radiographs: '[{"type": "Bitewing", "date": "2026-05-10"}]' }
])

// Scribe Integration States
const patientId = ref('PAT-8802')
const providerId = ref('DR-RUNO-99')
const patientAllergies = ref('Penicillin, NSAIDs')
const existingRadiographsStr = ref('[{"type": "Bitewing", "date": "2026-03-15"}]')

// Sync database settings when patientId changes
const handlePatientChange = () => {
  const p = patients.value.find(x => x.id === patientId.value)
  if (p) {
    patientAllergies.value = p.allergies
    existingRadiographsStr.value = p.radiographs
    addLog('SYSTEM', `Switched active database context to patient: ${p.name} (${p.id}).`, 'info')
  }
}

// UI State for Scribe
const isListening = ref(false)
const selectedScenario = ref('none')
const customDialogueText = ref('')
const displayTranscript = ref('')
const activeTooth = ref<number | null>(null)
const selectedTeeth = ref<number[]>([])

// Logging State
interface LogEntry {
  timestamp: string
  persona: 'CLINICAL RECORDER' | 'TREATMENT STRATEGIST' | 'COMPLIANCE GUARD' | 'SYSTEM'
  message: string
  type: 'info' | 'warning' | 'success' | 'danger'
}
const logs = ref<LogEntry[]>([])

// Pipeline Output State
const chartingActions = ref<any[]>([])
const treatmentPlan = ref<{ diagnosis: string | null; phases: any[] }>({
  diagnosis: null,
  phases: []
})
const suggestedInvestigations = ref<any[]>([])
const prescriptionSuggestions = ref<{
  drug_name: string | null
  dosage: string | null
  instructions: string | null
  quantity: number | null
  safety_alert_triggered: boolean
  alert_message: string | null
}>({
  drug_name: null,
  dosage: null,
  instructions: null,
  quantity: null,
  safety_alert_triggered: false,
  alert_message: null
})

// Vocal Intercept / Modal State
const showVocalModal = ref(false)
const dialogSubtitle = ref('')
const dialogProposedPrescription = ref<any>(null)

// Simulation controls
const isPlaying = ref(false)
const simulationTimer = ref<any>(null)
const currentWordIndex = ref(0)
const fullDialogueWords = ref<string[]>([])

// Scenarios Definitions
const scenarios: any = {
  none: {
    dialogue: '',
    setup: () => {}
  },
  scenario1: {
    name: 'Scenario 1: Molar Crown Restoration (Clean)',
    description: 'Dr. Runo diagnoses tooth #3 with decay, plans build-up and crown. Patient has Penicillin allergy but no NSAID allergy. Prescribes Ibuprofen. Bitewing is current.',
    dialogue: '[Ambient Noise: "Dr. Runo: How was your weekend? Assistant: It was good, did some hiking."] Dr. Runo: Let\'s look at tooth number 3. I see deep recurrent decay on the distal-occlusal surface. Let\'s note caries on tooth number 3 distal-occlusal. The patient needs a core buildup and a porcelain crown. We will plan a D2950 core buildup and a D2740 ceramic crown. The tooth is stable, no pulpal involvement, so this is restorative phase. Let\'s prescribe Ibuprofen 400mg, 1 tablet every 6 hours as needed for pain, quantity 20. [Ambient Noise: "Assistant: I\'ll get that tray cleaned up."]',
    setup: () => {
      patientId.value = 'PAT-5512'
      providerId.value = 'DR-RUNO-99'
      patientAllergies.value = 'Penicillin'
      existingRadiographsStr.value = '[{"type": "Bitewing", "date": "2026-06-01"}]'
      resetSimulationData()
    }
  },
  scenario2: {
    name: 'Scenario 2: Emergency Root Canal (Allergy Alert)',
    description: 'Dr. Runo diagnoses tooth #19 with lingering pain, plans root canal & crown. Prescribes Amoxicillin + Ibuprofen, but patient is allergic to Penicillin & NSAIDs! Bitewing is 90 days old (expired PA required!). Scribe triggers safety alerts and vocal intercept.',
    dialogue: 'Dr. Runo: Patient Sarah is here with active pain in the lower left. Tooth number 19 has severe pulpitis and periapical radiolucency. Let\'s chart active caries and periapical pathology on tooth number 19. We must perform endodontic therapy, molar, D3330. That is urgent phase 1. Followed by a D2950 core buildup and a D2740 porcelain crown. For the infection, let\'s prescribe Amoxicillin 500mg, three times daily for 7 days, quantity 21. Also, let\'s give Ibuprofen 600mg, one tablet every 8 hours for pain, quantity 15.',
    setup: () => {
      patientId.value = 'PAT-8802'
      providerId.value = 'DR-RUNO-99'
      patientAllergies.value = 'Penicillin, NSAIDs'
      existingRadiographsStr.value = '[{"type": "Bitewing", "date": "2026-03-15"}]'
      resetSimulationData()
    }
  }
}

// Watch scenario selection
watch(selectedScenario, (newVal) => {
  if (scenarios[newVal]) {
    scenarios[newVal].setup()
    customDialogueText.value = scenarios[newVal].dialogue
  }
})

// Helper to push logs
const addLog = (persona: LogEntry['persona'], message: string, type: LogEntry['type'] = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({ timestamp: time, persona, message, type })
}

// Reset Pipeline data
const resetSimulationData = () => {
  isPlaying.value = false
  if (simulationTimer.value) clearInterval(simulationTimer.value)
  currentWordIndex.value = 0
  displayTranscript.value = ''
  chartingActions.value = []
  treatmentPlan.value = { diagnosis: null, phases: [] }
  suggestedInvestigations.value = []
  prescriptionSuggestions.value = {
    drug_name: null,
    dosage: null,
    instructions: null,
    quantity: null,
    safety_alert_triggered: false,
    alert_message: null
  }
  selectedTeeth.value = []
  activeTooth.value = null
  showVocalModal.value = false
  logs.value = []
  addLog('SYSTEM', 'Scribe pipeline reset. Ready for audio stream.', 'info')
}

// Speech synthesis mock for the vocal intercept
const speakToDoctor = (message: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }
  addLog('SYSTEM', `Vocal Output: "${message}"`, 'warning')
}

// Existing Radiographs parsed computed property
const existingRadiographs = computed(() => {
  try {
    return JSON.parse(existingRadiographsStr.value)
  } catch (e) {
    return []
  }
})

// Handle the scenario simulation steps
const handleSimulationStep = (words: string[]) => {
  if (currentWordIndex.value >= words.length) {
    isPlaying.value = false
    isListening.value = false
    if (simulationTimer.value) clearInterval(simulationTimer.value)
    addLog('SYSTEM', 'Audio stream completed. Dispatch webhook ready.', 'success')
    return
  }

  // Get next word
  const nextWord = words[currentWordIndex.value]
  displayTranscript.value += (displayTranscript.value ? ' ' : '') + nextWord
  currentWordIndex.value++

  const text = displayTranscript.value.toLowerCase()

  // --- persona 1: CLINICAL RECORDER ---
  if (text.includes('tooth number 3') && !selectedTeeth.value.includes(3)) {
    activeTooth.value = 3
    selectedTeeth.value.push(3)
    addLog('CLINICAL RECORDER', 'Identified anatomy: Tooth #3 (Maxillary Right First Molar).', 'info')
    
    chartingActions.value.push({
      tooth_number: 3,
      surfaces: [],
      condition: 'Pending details',
      status: 'pending_ai'
    })
  }

  if (text.includes('distal-occlusal') && text.includes('tooth number 3') && chartingActions.value.some(a => a.tooth_number === 3 && a.surfaces.length === 0)) {
    const action = chartingActions.value.find(a => a.tooth_number === 3)
    if (action) {
      action.surfaces = ['D', 'O']
      action.condition = 'recurrent decay'
      action.status = 'active_pathology'
      addLog('CLINICAL RECORDER', 'Recorded pathology: Recurrent decay on Tooth #3 (DO surfaces).', 'danger')
    }
  }

  if (text.includes('tooth number 19') && !selectedTeeth.value.includes(19)) {
    activeTooth.value = 19
    selectedTeeth.value.push(19)
    addLog('CLINICAL RECORDER', 'Identified anatomy: Tooth #19 (Mandibular Left First Molar).', 'info')
    
    chartingActions.value.push({
      tooth_number: 19,
      surfaces: [],
      condition: 'pulpitis',
      status: 'pending_ai'
    })
  }

  if ((text.includes('periapical pathology') || text.includes('periapical radiolucency')) && chartingActions.value.some(a => a.tooth_number === 19 && !a.surfaces.includes('PA'))) {
    const action = chartingActions.value.find(a => a.tooth_number === 19)
    if (action) {
      action.surfaces = ['O'] 
      action.condition = 'severe pulpitis & periapical radiolucency'
      action.status = 'active_pathology'
      addLog('CLINICAL RECORDER', 'Recorded pathology: Pulpitis & Periapical Radiolucency on Tooth #19.', 'danger')
    }
  }

  // --- PERSONA 2: THE TREATMENT STRATEGIST ---
  if (text.includes('core buildup') || text.includes('d2950')) {
    const currentTooth = selectedTeeth.value[selectedTeeth.value.length - 1]
    if (!hasProcedureCode(2, 'D2950')) {
      addProcedureToPhase(2, 'Restorative/Prosthodontic', {
        cdt_code: 'D2950',
        description: `Core buildup, including any pins when required on tooth #${currentTooth}`
      })
      addLog('TREATMENT STRATEGIST', `Mapped composite buildup D2950 for Tooth #${currentTooth} to Phase 2 (Restorative).`, 'success')
    }
  }

  if (text.includes('porcelain crown') || text.includes('ceramic crown') || text.includes('d2740')) {
    const currentTooth = selectedTeeth.value[selectedTeeth.value.length - 1]
    if (!hasProcedureCode(2, 'D2740')) {
      addProcedureToPhase(2, 'Restorative/Prosthodontic', {
        cdt_code: 'D2740',
        description: `Crown - porcelain/ceramic substrate on tooth #${currentTooth}`
      })
      addLog('TREATMENT STRATEGIST', `Mapped ceramic crown D2740 for Tooth #${currentTooth} to Phase 2 (Restorative).`, 'success')
    }
  }

  if (text.includes('endodontic therapy') || text.includes('root canal') || text.includes('d3330')) {
    const currentTooth = selectedTeeth.value[selectedTeeth.value.length - 1]
    if (!hasProcedureCode(1, 'D3330')) {
      addProcedureToPhase(1, 'Urgent/Surgical', {
        cdt_code: 'D3330',
        description: `Endodontic therapy, molar (excluding final restoration) on tooth #${currentTooth}`
      })
      treatmentPlan.value.diagnosis = 'Severe irreversible pulpitis with periapical pathology'
      addLog('TREATMENT STRATEGIST', `Mapped root canal therapy D3330 for Tooth #${currentTooth} to Phase 1 (Urgent/Surgical).`, 'success')
    }
  }

  // --- PERSONA 3: COMPLIANCE GUARD ---
  if (text.includes('endodontic therapy') || text.includes('root canal') || text.includes('d3330')) {
    const hasCurrentPA = existingRadiographs.value.some((x: any) => {
      const isPA = x.type.toLowerCase().includes('pa') || x.type.toLowerCase().includes('periapical') || x.type.toLowerCase().includes('bitewing')
      const radDate = new Date(x.date)
      const currentDate = new Date('2026-06-13')
      const diffTime = Math.abs(currentDate.getTime() - radDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return isPA && diffDays <= 30
    })

    if (!hasCurrentPA) {
      if (!suggestedInvestigations.value.some(i => i.type === 'Periapical X-Ray')) {
        suggestedInvestigations.value.push({
          type: 'Periapical X-Ray',
          reason: 'No current diagnostic Periapical image (PA) exists within 30 days for planned root canal therapy D3330.'
        })
        addLog('COMPLIANCE GUARD', 'Missing diagnostic x-ray detected: Root canal requires a periapical radiograph within the last 30 days.', 'warning')
      }
    }
  }

  // Prescription: Ibuprofen
  if (text.includes('ibuprofen')) {
    const drugName = 'Ibuprofen'
    const dosage = text.includes('600mg') ? '600mg' : '400mg'
    const instructions = text.includes('600mg') ? '1 tablet every 8 hours as needed' : '1 tablet every 6 hours as needed'
    const quantity = text.includes('15') ? 15 : 20

    const allergiesList = patientAllergies.value.split(',').map(a => a.trim().toLowerCase())
    if (allergiesList.includes('nsaids') || allergiesList.includes('ibuprofen') || allergiesList.includes('aspirin')) {
      isPlaying.value = false
      if (simulationTimer.value) clearInterval(simulationTimer.value)
      
      prescriptionSuggestions.value = {
        drug_name: drugName,
        dosage: dosage,
        instructions: instructions,
        quantity: quantity,
        safety_alert_triggered: true,
        alert_message: `Patient has a confirmed NSAIDs/Ibuprofen allergy. Discarded NSAID drug recommendation.`
      }

      addLog('COMPLIANCE GUARD', `ALLERGY CRITICAL COLLISION: Doctor suggested Ibuprofen, but patient allergy list contains NSAIDs.`, 'danger')
      
      dialogProposedPrescription.value = {
        drug_name: 'Ibuprofen',
        dosage,
        instructions,
        quantity,
        allergy: 'NSAIDs',
        alternatives: [
          { drug_name: 'Acetaminophen (Tylenol)', dosage: '500mg', instructions: '1-2 tablets every 6 hours as needed for pain', quantity: 20 }
        ]
      }
      dialogSubtitle.value = `The patient has a confirmed NSAIDs allergy on file. Would you like me to substitute the prescription suggestion with Acetaminophen 500mg instead?`
      
      showVocalModal.value = true
      speakToDoctor(`Dr. Runo, the patient has a confirmed NSAID allergy on file. Would you like me to substitute the prescription suggestion with Acetaminophen 500mg instead?`)
      return
    } else {
      prescriptionSuggestions.value = {
        drug_name: drugName,
        dosage: dosage,
        instructions: instructions,
        quantity: quantity,
        safety_alert_triggered: false,
        alert_message: null
      }
      addLog('COMPLIANCE GUARD', 'Prescription check: Ibuprofen is safe. No allergy collision.', 'success')
    }
  }

  // Prescription: Amoxicillin
  if (text.includes('amoxicillin')) {
    const drugName = 'Amoxicillin'
    const dosage = '500mg'
    const instructions = '1 tablet three times daily for 7 days'
    const quantity = 21

    const allergiesList = patientAllergies.value.split(',').map(a => a.trim().toLowerCase())
    if (allergiesList.includes('penicillin') || allergiesList.includes('amoxicillin')) {
      isPlaying.value = false
      if (simulationTimer.value) clearInterval(simulationTimer.value)

      prescriptionSuggestions.value = {
        drug_name: drugName,
        dosage: dosage,
        instructions: instructions,
        quantity: quantity,
        safety_alert_triggered: true,
        alert_message: `Patient has a confirmed Penicillin allergy. Suggested drug: ${drugName}.`
      }

      addLog('COMPLIANCE GUARD', `ALLERGY CRITICAL COLLISION: Doctor suggested Amoxicillin, but patient allergy list contains Penicillin.`, 'danger')
      
      dialogProposedPrescription.value = {
        drug_name: 'Amoxicillin',
        dosage,
        instructions,
        quantity,
        allergy: 'Penicillin',
        alternatives: [
          { drug_name: 'Clindamycin', dosage: '300mg', instructions: '1 capsule every 8 hours for 7 days', quantity: 21 }
        ]
      }
      dialogSubtitle.value = `The patient has a confirmed Penicillin allergy on file. Would you like me to substitute the prescription suggestion with Clindamycin 300mg instead?`
      
      showVocalModal.value = true
      speakToDoctor(`Dr. Runo, the patient has a confirmed Penicillin allergy on file. Would you like me to substitute the prescription suggestion with Clindamycin 300mg instead?`)
      return
    } else {
      prescriptionSuggestions.value = {
        drug_name: drugName,
        dosage: dosage,
        instructions: instructions,
        quantity: quantity,
        safety_alert_triggered: false,
        alert_message: null
      }
      addLog('COMPLIANCE GUARD', 'Prescription check: Amoxicillin is safe. No allergy collision.', 'success')
    }
  }

  if (nextWord.startsWith('[Ambient')) {
    addLog('SYSTEM', 'Ambient Context Noise Filter active: Discarded non-clinical audio segment.', 'info')
  }
}

// Check helper
const hasProcedureCode = (phaseNum: number, code: string) => {
  const phase = treatmentPlan.value.phases.find(p => p.phase_number === phaseNum)
  if (!phase) return false
  return phase.procedures.some((p: any) => p.cdt_code === code)
}

// Add code to phase helper
const addProcedureToPhase = (phaseNum: number, phaseName: string, proc: { cdt_code: string; description: string }) => {
  let phase = treatmentPlan.value.phases.find(p => p.phase_number === phaseNum)
  if (!phase) {
    phase = {
      phase_number: phaseNum,
      phase_name: phaseName,
      procedures: []
    }
    treatmentPlan.value.phases.push(phase)
    treatmentPlan.value.phases.sort((a, b) => a.phase_number - b.phase_number)
  }
  phase.procedures.push(proc)
}

// Start simulation sequence
const startSimulation = () => {
  if (isPlaying.value) {
    isPlaying.value = false
    isListening.value = false
    if (simulationTimer.value) clearInterval(simulationTimer.value)
    addLog('SYSTEM', 'Audio stream simulation paused.', 'info')
  } else {
    isPlaying.value = true
    isListening.value = true
    addLog('SYSTEM', 'Listening to live audio stream...', 'info')

    const textToSimulate = customDialogueText.value || 'No dialogue loaded. Please select a scenario or type dialogue.'
    
    if (currentWordIndex.value === 0) {
      fullDialogueWords.value = textToSimulate.split(/\s+/)
      displayTranscript.value = ''
    }

    simulationTimer.value = setInterval(() => {
      handleSimulationStep(fullDialogueWords.value)
    }, 450)
  }
}

// Resolve the vocal check modal substitution
const resolveVocalIntercept = (substitute: boolean) => {
  showVocalModal.value = false
  const prop = dialogProposedPrescription.value
  
  if (substitute && prop && prop.alternatives && prop.alternatives.length > 0) {
    const alt = prop.alternatives[0]
    prescriptionSuggestions.value = {
      drug_name: alt.drug_name,
      dosage: alt.dosage,
      instructions: alt.instructions,
      quantity: alt.quantity,
      safety_alert_triggered: false,
      alert_message: `Substituted suggested ${prop.drug_name} with ${alt.drug_name} due to patient's ${prop.allergy} allergy.`
    }
    addLog('COMPLIANCE GUARD', `Substitute accepted. Replaced ${prop.drug_name} with ${alt.drug_name} ${alt.dosage}. Allergy safety cleared.`, 'success')
  } else {
    prescriptionSuggestions.value = {
      drug_name: prop.drug_name,
      dosage: prop.dosage,
      instructions: prop.instructions,
      quantity: prop.quantity,
      safety_alert_triggered: true,
      alert_message: `WARNING: Overridden by clinician. Suggested ${prop.drug_name} despite ${prop.allergy} allergy.`
    }
    addLog('COMPLIANCE GUARD', `CLINICIAN OVERRIDE: Prescribing ${prop.drug_name} despite confirmed ${prop.allergy} allergy!`, 'danger')
  }

  startSimulation()
}

// Webhook Payload structure
const webhookPayload = computed(() => {
  return {
    event: 'encounter_extraction_pipeline',
    patient_id: patientId.value,
    provider_id: providerId.value,
    charting_actions: chartingActions.value.length > 0 ? chartingActions.value : [
      {
        tooth_number: null,
        surfaces: [],
        condition: null,
        status: 'pending_ai'
      }
    ],
    treatment_plan: {
      diagnosis: treatmentPlan.value.diagnosis,
      phases: treatmentPlan.value.phases.length > 0 ? treatmentPlan.value.phases : [
        {
          phase_number: null,
          phase_name: null,
          procedures: [
            { cdt_code: null, description: null }
          ]
        }
      ]
    },
    suggested_investigations: suggestedInvestigations.value.length > 0 ? suggestedInvestigations.value : [
      { type: null, reason: null }
    ],
    prescription_suggestions: {
      drug_name: prescriptionSuggestions.value.drug_name,
      dosage: prescriptionSuggestions.value.dosage,
      instructions: prescriptionSuggestions.value.instructions,
      quantity: prescriptionSuggestions.value.quantity,
      safety_alert_triggered: prescriptionSuggestions.value.safety_alert_triggered,
      alert_message: prescriptionSuggestions.value.alert_message
    }
  }
})

// Copy JSON utility
const copyToClipboard = () => {
  const text = JSON.stringify(webhookPayload.value, null, 2)
  navigator.clipboard.writeText(text).then(() => {
    triggerToast('JSON payload copied to clipboard!')
  }).catch(() => {
    triggerToast('Failed to copy payload.')
  })
}

// Mock Webhook Send
const mockWebhookSend = () => {
  addLog('SYSTEM', 'Dispatching webhook event: encounter_extraction_pipeline...', 'info')
  setTimeout(() => {
    addLog('SYSTEM', 'Webhook payload successfully dispatched to clinical database (200 OK).', 'success')
    triggerToast('Webhook dispatched successfully!')
  }, 1000)
}

// Universal Tooth System layout mapping
const maxillaryTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
const mandibularTeeth = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17]

const getToothClass = (num: number) => {
  if (activeTooth.value === num) {
    return 'border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-400 font-bold'
  }
  if (selectedTeeth.value.includes(num)) {
    const action = chartingActions.value.find(a => a.tooth_number === num)
    if (action && action.status === 'active_pathology') {
      return 'border-red-500 bg-red-50 text-red-600 font-bold animate-pulse'
    }
    return 'border-blue-500 bg-blue-50 text-blue-600 font-bold'
  }
  return 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
}

// Tab handlers
const setTab = (tab: string) => {
  activeTab.value = tab
}

// Search utility
const filteredPatients = computed(() => {
  if (!searchQuery.value) return patients.value
  const q = searchQuery.value.toLowerCase().trim()
  return patients.value.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.id.toLowerCase().includes(q) ||
    p.allergies.toLowerCase().includes(q)
  )
})

// Dialog creation actions
const addNewAppointment = () => {
  if (newApptTitle.value.trim()) {
    appointments.value.push({
      id: Date.now(),
      title: newApptTitle.value,
      time: newApptTime.value
    })
    triggerToast(`Appointment added for ${newApptTitle.value}!`)
    newApptTitle.value = ''
    showNewApptModal.value = false
  }
}

const deleteAppointment = (id: number) => {
  appointments.value = appointments.value.filter(a => a.id !== id)
  triggerToast('Appointment cancelled.')
}

const addNewLabWork = () => {
  if (newLabTitle.value.trim()) {
    labCases.value.push({
      id: Date.now(),
      title: newLabTitle.value,
      notes: newLabNotes.value || 'Routine lab case',
      status: 'In Progress'
    })
    triggerToast(`Lab Work for ${newLabTitle.value} created!`)
    newLabTitle.value = ''
    newLabNotes.value = ''
    showNewLabModal.value = false
  }
}

const addNewExpense = () => {
  if (newExpenseTitle.value.trim() && newExpenseAmount.value !== null) {
    expenses.value.push({
      id: Date.now(),
      title: newExpenseTitle.value,
      amount: newExpenseAmount.value
    })
    triggerToast(`Expense of ৳${newExpenseAmount.value} logged!`)
    newExpenseTitle.value = ''
    newExpenseAmount.value = null
    showNewExpenseModal.value = false
  }
}

// Load patient to treatment plan tab
const loadPatientToScribe = (p: any) => {
  patientId.value = p.id
  handlePatientChange()
  setTab('treatments')
  selectedScenario.value = 'none'
  customDialogueText.value = `Dr. Runo: Let's do a routine checkup for ${p.name}.`
  resetSimulationData()
  triggerToast(`Loaded ${p.name} context to Treatment Scribe!`)
}

onMounted(() => {
  selectedScenario.value = 'scenario1'
  if (scenarios['scenario1']) {
    scenarios['scenario1'].setup()
    customDialogueText.value = scenarios['scenario1'].dialogue
  }
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 font-sans select-none antialiased">
    
    <!-- Toast Alert Notifications -->
    <transition name="slide-fade">
      <div v-if="showToast" class="fixed top-5 right-5 z-[9999] flex items-center bg-white border border-emerald-100 text-emerald-800 px-4 py-3.5 rounded-xl shadow-xl space-x-2.5">
        <div class="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle class="h-4 w-4 text-emerald-600" />
        </div>
        <span class="text-xs font-semibold">{{ toastMessage }}</span>
      </div>
    </transition>

    <!-- SIDEBAR PANEL (Frappe UI Sidebar Component Integration) -->
    <Sidebar 
      :header="sidebarHeader" 
      :sections="sidebarSections" 
      class="h-full border-r border-slate-200/80 bg-[#fafbfc] shrink-0" 
    />

    <!-- MAIN APP WRAPPER -->
    <div class="flex-grow flex flex-col min-w-0 overflow-hidden bg-white">
      
      <!-- Top header bar -->
      <header class="h-14 border-b border-slate-200/60 px-6.5 flex items-center justify-between shrink-0 bg-white">
        <div class="flex items-center space-x-2">
          <!-- Navigation Breadcrumb -->
          <span class="text-xs font-medium text-slate-400 font-mono">DAWN CLINIC</span>
          <span class="text-xs text-slate-300 font-mono">/</span>
          <span class="text-xs font-bold text-slate-700 capitalize font-mono">{{ activeTab === 'treatments' ? 'Treatment Plan' : activeTab }}</span>
        </div>
        
        <!-- Attending Staff Header Status -->
        <div class="flex items-center space-x-3.5 text-xs text-slate-500">
          <div class="flex items-center space-x-1.5 bg-slate-100 rounded-full px-3 py-1 font-mono text-[11px]">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span class="text-slate-600 font-bold">OPERATORY 3A</span>
          </div>
          <span class="text-slate-300 font-mono">|</span>
          <span class="font-mono text-indigo-600 font-bold uppercase">Dr. Runo</span>
        </div>
      </header>

      <!-- VIEWPORTS CONTAINER -->
      <div class="flex-1 overflow-y-auto bg-slate-50/50">
        
        <!-- 1. DASHBOARD TAB VIEWPORT (Replicated 1:1) -->
        <div v-if="activeTab === 'dashboard'" class="p-7 space-y-6 max-w-7xl mx-auto">
          <!-- Dashboard header row -->
          <div class="flex items-center justify-between pb-1">
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          </div>

          <!-- Dropdowns row under title -->
          <div class="flex items-center gap-2.5 relative">
            <!-- Last 30 Days Dropdown Button -->
            <div class="relative">
              <button 
                @click="showDaysDropdown = !showDaysDropdown; showDeptDropdown = false"
                class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-1.5 px-3 rounded-lg text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>{{ selectedDaysFilter }}</span>
                <ChevronDown class="h-3.5 w-3.5 text-slate-400" />
              </button>
              
              <!-- Dropdown Menu -->
              <div v-if="showDaysDropdown" class="absolute left-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 text-xs">
                <button @click="selectedDaysFilter = 'Today'; showDaysDropdown = false" class="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer">Today</button>
                <button @click="selectedDaysFilter = 'Last 7 Days'; showDaysDropdown = false" class="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer">Last 7 Days</button>
                <button @click="selectedDaysFilter = 'Last 30 Days'; showDaysDropdown = false" class="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer">Last 30 Days</button>
              </div>
            </div>

            <!-- All Departments Dropdown Button -->
            <div class="relative">
              <button 
                @click="showDeptDropdown = !showDeptDropdown; showDaysDropdown = false"
                class="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-1.5 px-3 rounded-lg text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>{{ selectedDeptFilter }}</span>
                <ChevronDown class="h-3.5 w-3.5 text-slate-400" />
              </button>

              <!-- Dropdown Menu -->
              <div v-if="showDeptDropdown" class="absolute left-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 text-xs">
                <button @click="selectedDeptFilter = 'All Departments'; showDeptDropdown = false" class="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer">All Departments</button>
                <button @click="selectedDeptFilter = 'Clinical Scribe'; showDeptDropdown = false" class="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer">Clinical Scribe</button>
                <button @click="selectedDeptFilter = 'Radiology'; showDeptDropdown = false" class="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer">Radiology</button>
              </div>
            </div>
          </div>

          <!-- Cards Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
            <!-- Card 1: Patients -->
            <div class="bg-white border border-slate-200/80 rounded-xl p-5.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between h-[100px] relative overflow-hidden">
              <span class="text-xs font-semibold text-slate-400 font-mono tracking-wider">Patients</span>
              <span class="text-2xl font-black text-slate-800 leading-none pb-0.5">1</span>
            </div>

            <!-- Card 2: Appointments Today -->
            <div class="bg-white border border-slate-200/80 rounded-xl p-5.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between h-[100px] relative overflow-hidden">
              <span class="text-xs font-semibold text-slate-400 font-mono tracking-wider">Appointments Today</span>
              <span class="text-2xl font-black text-slate-800 leading-none pb-0.5">{{ appointments.length }}</span>
            </div>

            <!-- Card 3: Revenue (৳0) -->
            <div class="bg-white border border-slate-200/80 rounded-xl p-5.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between h-[100px] relative overflow-hidden">
              <span class="text-xs font-semibold text-slate-400 font-mono tracking-wider">Revenue</span>
              <span class="text-2xl font-black text-slate-800 leading-none pb-0.5">৳0</span>
            </div>

            <!-- Card 4: Pending -->
            <div class="bg-white border border-slate-200/80 rounded-xl p-5.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between h-[100px] relative overflow-hidden">
              <span class="text-xs font-semibold text-slate-400 font-mono tracking-wider">Pending</span>
              <span class="text-2xl font-black text-slate-800 leading-none pb-0.5">1</span>
            </div>
          </div>

          <!-- Detail grids row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            <!-- Grid Column 1: Appointments Today -->
            <div class="bg-white border border-slate-200/80 rounded-xl p-5.5 shadow-sm min-h-[260px] flex flex-col">
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <span class="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Appointments today</span>
                <button 
                  @click="showNewApptModal = true"
                  class="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Plus class="h-3 w-3" />
                  <span>Add</span>
                </button>
              </div>

              <!-- List container -->
              <div class="flex-1 space-y-2.5 overflow-y-auto">
                <div v-if="appointments.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Calendar class="h-8 w-8 text-slate-300 mb-2" />
                  <p class="text-xs italic">No appointments booked today</p>
                </div>
                
                <div 
                  v-for="appt in appointments" 
                  :key="appt.id"
                  class="bg-slate-50 border border-slate-200/60 rounded-lg p-3 flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  <div class="flex items-center space-x-3">
                    <div class="h-7 w-7 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <Calendar class="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-slate-800 font-mono leading-none">{{ appt.title }}</h4>
                      <p class="text-[10px] text-slate-500 mt-1 font-mono leading-none">{{ appt.time }}</p>
                    </div>
                  </div>
                  <button 
                    @click="deleteAppointment(appt.id)"
                    class="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Grid Column 2: Lab Work -->
            <div class="bg-white border border-slate-200/80 rounded-xl p-5.5 shadow-sm min-h-[260px] flex flex-col">
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <span class="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Lab work</span>
              </div>

              <div class="flex-1 flex flex-col items-center justify-center p-3 text-center">
                <div v-if="labCases.length === 0" class="flex flex-col items-center justify-center">
                  <div class="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center mb-2.5">
                    <FlaskConical class="h-5 w-5 text-slate-400" />
                  </div>
                  <h4 class="text-xs font-bold text-slate-700 leading-relaxed">No active lab work</h4>
                  <p class="text-[10px] text-slate-400 leading-normal max-w-[180px] mt-0.5">Create a lab work case to track progress</p>
                </div>
                
                <div v-else class="w-full space-y-2 overflow-y-auto max-h-[140px] mb-3 text-left">
                  <div v-for="lab in labCases" :key="lab.id" class="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs">
                    <div class="flex justify-between items-center font-bold text-slate-800 mb-0.5">
                      <span>{{ lab.title }}</span>
                      <Badge variant="subtle" theme="info" size="sm">{{ lab.status }}</Badge>
                    </div>
                    <p class="text-[10px] text-slate-500 truncate mt-0.5">{{ lab.notes }}</p>
                  </div>
                </div>

                <button 
                  @click="showNewLabModal = true"
                  class="mt-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus class="h-3 w-3 text-slate-500" />
                  <span>New Lab Work</span>
                </button>
              </div>
            </div>

            <!-- Grid Column 3: Expenses -->
            <div class="bg-white border border-slate-200/80 rounded-xl p-5.5 shadow-sm min-h-[260px] flex flex-col">
              <div class="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <span class="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Expenses</span>
              </div>

              <div class="flex-1 flex flex-col items-center justify-center p-3 text-center">
                <div v-if="expenses.length === 0" class="flex flex-col items-center justify-center">
                  <div class="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center mb-2.5">
                    <Receipt class="h-5 w-5 text-slate-400" />
                  </div>
                  <h4 class="text-xs font-bold text-slate-700 leading-relaxed">No expenses recorded</h4>
                  <p class="text-[10px] text-slate-400 leading-normal max-w-[180px] mt-0.5">Add an expense to start tracking costs</p>
                </div>

                <div v-else class="w-full space-y-2 overflow-y-auto max-h-[140px] mb-3 text-left">
                  <div v-for="exp in expenses" :key="exp.id" class="p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs flex justify-between items-center">
                    <span class="font-bold text-slate-800">{{ exp.title }}</span>
                    <span class="font-mono text-red-600 font-bold">-৳{{ exp.amount }}</span>
                  </div>
                </div>

                <button 
                  @click="showNewExpenseModal = true"
                  class="mt-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus class="h-3 w-3 text-slate-500" />
                  <span>New Expense</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- 2. PATIENTS TAB VIEWPORT -->
        <div v-if="activeTab === 'patients'" class="p-7 space-y-6 max-w-7xl mx-auto">
          <div class="flex items-center justify-between pb-1">
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Patients Context Registry</h1>
            <Badge theme="info" size="sm" variant="solid" class="font-mono">CLINICAL DATABASE</Badge>
          </div>

          <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div class="relative w-64">
                <Search class="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Filter patients..."
                  class="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <span class="text-[10px] text-slate-400 font-mono">Click a patient to load to Scribe pipeline</span>
            </div>

            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-mono bg-slate-50/20">
                  <th class="py-3 px-4 font-bold">Patient ID</th>
                  <th class="py-3 px-4 font-bold">Name</th>
                  <th class="py-3 px-4 font-bold">Contact</th>
                  <th class="py-3 px-4 font-bold">Allergies</th>
                  <th class="py-3 px-4 font-bold">Status</th>
                  <th class="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="p in filteredPatients" 
                  :key="p.id"
                  class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  <td class="py-3.5 px-4 font-mono font-bold text-slate-500">{{ p.id }}</td>
                  <td class="py-3.5 px-4 font-bold text-slate-800">{{ p.name }}</td>
                  <td class="py-3.5 px-4 font-mono text-slate-500">
                    <div>{{ p.phone }}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">{{ p.email }}</div>
                  </td>
                  <td class="py-3.5 px-4">
                    <span 
                      v-if="p.allergies !== 'None'"
                      class="bg-red-50 text-red-700 px-2 py-0.5 border border-red-100 rounded text-[10px] font-bold"
                    >
                      {{ p.allergies }}
                    </span>
                    <span v-else class="text-slate-400">None</span>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="h-2 w-2 rounded-full bg-emerald-500 inline-block mr-1"></span>
                    <span class="font-mono text-[10px]">Active</span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <button 
                      @click="loadPatientToScribe(p)"
                      class="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Diagnose (Scribe)
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. APPOINTMENTS TAB VIEWPORT -->
        <div v-if="activeTab === 'appointments'" class="p-7 space-y-6 max-w-7xl mx-auto">
          <div class="flex items-center justify-between pb-1">
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Clinic Schedule</h1>
            <button 
              @click="showNewApptModal = true"
              class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus class="h-4 w-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-3">
              <div 
                v-for="appt in appointments" 
                :key="appt.id"
                class="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm hover:shadow transition-shadow flex justify-between items-center"
              >
                <div class="flex items-center space-x-4">
                  <div class="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <Calendar class="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 class="font-bold text-slate-800 text-sm font-mono">{{ appt.title }}</h3>
                    <p class="text-xs text-slate-500 mt-1 font-mono">Time: {{ appt.time }}</p>
                  </div>
                </div>
                
                <div class="flex items-center space-x-2">
                  <span class="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 border border-indigo-100 rounded-lg text-[10px] font-mono font-bold">CONFIRMED</span>
                  <button 
                    @click="deleteAppointment(appt.id)"
                    class="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div class="bg-white border border-slate-200 rounded-xl p-5.5 shadow-sm h-fit">
              <h3 class="font-bold text-slate-800 text-sm mb-3">Schedule Statistics</h3>
              <div class="space-y-3 font-mono text-xs">
                <div class="flex justify-between border-b border-slate-100 pb-2">
                  <span class="text-slate-500">Total Bookings</span>
                  <span class="font-bold text-slate-800">{{ appointments.length }}</span>
                </div>
                <div class="flex justify-between border-b border-slate-100 pb-2">
                  <span class="text-slate-500">Urgent Cases</span>
                  <span class="font-bold text-slate-800">1</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Staff Assigned</span>
                  <span class="font-bold text-slate-800">DR-RUNO-99</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. TREATMENT PLAN TAB VIEWPORT -->
        <div v-if="activeTab === 'treatments'" class="p-7 space-y-6 max-w-7xl mx-auto">
          <!-- Scribe Tab Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <div class="flex items-center space-x-2">
                <span class="bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded text-[10px] font-bold font-mono">APEXO SCRIBE AI</span>
                <span class="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                <span class="text-xs text-slate-500 font-mono">SYNAPSE PIPELINE v2.4</span>
              </div>
              <h1 class="text-2xl font-black text-slate-900 tracking-tight mt-1.5">Treatment Plan Scribe Engine</h1>
            </div>

            <!-- Listening Status badge -->
            <div class="flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm space-x-2.5">
              <span class="relative flex h-2.5 w-2.5 shrink-0">
                <span :class="isListening ? 'animate-ping' : ''" class="absolute inline-flex h-full w-full rounded-full opacity-75" :style="{ backgroundColor: isListening ? '#10b981' : '#94a3b8' }"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5" :style="{ backgroundColor: isListening ? '#10b981' : '#94a3b8' }"></span>
              </span>
              <span class="text-xs font-mono font-bold text-slate-700">
                {{ isListening ? 'MICROPHONE ACTIVE' : 'MICROPHONE MUTED' }}
              </span>
            </div>
          </div>

          <!-- Interactive Database Context Bar -->
          <section class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div class="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-indigo-500/5 blur-[80px]"></div>
            
            <div class="flex items-center justify-between mb-4.5 border-b border-slate-100 pb-3">
              <div class="flex items-center space-x-2">
                <Database class="h-4 w-4 text-indigo-600" />
                <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Encounter Database Settings (Environment Context)
                </h2>
              </div>
              <span class="text-[10px] text-slate-400 font-mono">Select values to override clinical state</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase">Attending Patient</label>
                <select
                  v-model="patientId"
                  @change="handlePatientChange"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option v-for="p in patients" :key="p.id" :value="p.id">{{ p.name }} ({{ p.id }})</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase">Attending Provider</label>
                <input
                  v-model="providerId"
                  type="text"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase">Allergies List</label>
                <input
                  v-model="patientAllergies"
                  type="text"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-850 focus:outline-none focus:border-indigo-500 font-mono font-bold text-red-600 bg-red-50/10"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase">Radiographs Log</label>
                <input
                  v-model="existingRadiographsStr"
                  type="text"
                  class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </section>

          <!-- Scribe Pipeline workspace grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            <!-- Left Workspace -->
            <div class="lg:col-span-4 flex flex-col gap-5">
              
              <!-- Simulation Scenario Panel -->
              <div class="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex flex-col gap-3">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span class="text-xs font-bold tracking-wider text-slate-700 font-mono">SIMULATION CONTROLLER</span>
                  <Badge size="sm" variant="subtle" theme="info" class="font-mono text-[9px] uppercase">Interactive Sandbox</Badge>
                </div>
                
                <div>
                  <label class="block text-[11px] text-slate-500 mb-1.5 font-bold">Select Dictation Stream:</label>
                  <select
                    v-model="selectedScenario"
                    class="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="none">--- Custom Dictation / Idle ---</option>
                    <option value="scenario1">Scenario 1: Molar Crown Restoration (Clean)</option>
                    <option value="scenario2">Scenario 2: Emergency Root Canal (Allergy Alert)</option>
                  </select>
                </div>

                <div v-if="selectedScenario !== 'none'" class="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-[11px] text-indigo-900">
                  <p class="font-bold text-indigo-900 mb-1">
                    {{ scenarios[selectedScenario].name }}
                  </p>
                  <p class="leading-relaxed opacity-85 text-[10px]">
                    {{ scenarios[selectedScenario].description }}
                  </p>
                </div>

                <div class="mt-1 flex flex-col gap-3">
                  <div class="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Audio Stream Simulation:</span>
                    <span v-if="isPlaying" class="text-[10px] text-emerald-600 animate-pulse font-mono font-bold">STREAMING...</span>
                  </div>

                  <div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-center h-14 relative overflow-hidden">
                    <div v-if="!isListening" class="text-slate-400 text-xs font-mono flex items-center space-x-1.5">
                      <!-- Custom SVG for MicOff -->
                      <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                      </svg>
                      <span>Audio Input Muted / Idle</span>
                    </div>
                    <div v-else class="flex items-center space-x-1.5 w-full justify-center h-full">
                      <div v-for="i in 18" :key="i" 
                           class="w-1 bg-gradient-to-t from-sky-400 to-indigo-500 rounded-full transition-all duration-75 animate-bounce"
                           :style="{ 
                             height: `${Math.floor(Math.random() * 80) + 20}%`, 
                             animationDelay: `${i * 0.05}s`,
                             animationDuration: `${Math.floor(Math.random() * 400) + 300}ms`
                           }">
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <Button
                      class="flex-1 text-xs"
                      variant="solid"
                      :theme="isPlaying ? 'warning' : 'primary'"
                      @click="startSimulation"
                    >
                      <div class="flex items-center justify-center gap-1.5">
                        <component :is="isPlaying ? Pause : Play" class="h-3.5 w-3.5" />
                        <span>{{ isPlaying ? 'Pause Stream' : (currentWordIndex > 0 ? 'Resume Stream' : 'Listen Live') }}</span>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      theme="gray"
                      class="text-xs"
                      @click="resetSimulationData"
                    >
                      <div class="flex items-center justify-center gap-1.5">
                        <RotateCcw class="h-3.5 w-3.5" />
                        <span>Reset</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>

              <!-- Dictation live transcript -->
              <div class="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex-1 flex flex-col min-h-[260px]">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div class="flex items-center space-x-2">
                    <!-- Custom SVG for Mic status -->
                    <svg v-if="isPlaying" class="h-4 w-4 text-emerald-600 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    <svg v-else class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    <span class="text-xs font-bold tracking-wider text-slate-700 font-mono">LIVE CLINICAL TRANSCRIPT</span>
                  </div>
                  <Badge v-if="isPlaying" variant="solid" theme="emerald" size="sm" class="text-[9px]">LIVE</Badge>
                  <Badge v-else variant="subtle" theme="gray" size="sm" class="text-[9px]">MUTED</Badge>
                </div>

                <div class="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex-1 flex flex-col justify-between overflow-hidden">
                  <div class="text-xs leading-relaxed text-slate-700 select-text overflow-y-auto max-h-[180px] font-mono whitespace-pre-wrap">
                    <span v-if="displayTranscript">{{ displayTranscript }}</span>
                    <span v-else class="text-slate-400 italic">Clinical audio stream transcript will render here in real-time...</span>
                  </div>
                  
                  <div class="border-t border-slate-200 pt-3 mt-3 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span>AMBIENT FILTER: ACTIVE</span>
                    <span>WORDS: {{ currentWordIndex }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Middle Workspace -->
            <div class="lg:col-span-5 flex flex-col gap-5">
              
              <!-- Tooth Anatomy Chart Universal System -->
              <div class="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div class="flex items-center space-x-2">
                    <Stethoscope class="h-4 w-4 text-indigo-600" />
                    <span class="text-xs font-bold tracking-wider text-slate-700 font-mono">UNIVERSAL ANATOMICAL CHART</span>
                  </div>
                  <span class="text-[9px] text-indigo-500 font-mono font-bold">1-32 ADULT SYSTEM</span>
                </div>

                <div class="space-y-4 py-2">
                  <!-- Maxillary Arch (1-16) -->
                  <div>
                    <div class="text-[9px] font-bold text-slate-400 uppercase font-mono mb-1.5 text-center">Maxillary Arch (Upper)</div>
                    <div class="grid grid-cols-8 sm:grid-cols-16 gap-1 justify-items-center">
                      <button 
                        v-for="num in maxillaryTeeth" 
                        :key="num"
                        @click="activeTooth = num"
                        :class="getToothClass(num)"
                        class="h-7 w-7 rounded-lg border text-[10px] flex items-center justify-center transition-all cursor-pointer font-mono"
                        :title="`Tooth #${num}`"
                      >
                        {{ num }}
                      </button>
                    </div>
                  </div>

                  <!-- Mandibular Arch (17-32) -->
                  <div>
                    <div class="text-[9px] font-bold text-slate-400 uppercase font-mono mb-1.5 text-center">Mandibular Arch (Lower)</div>
                    <div class="grid grid-cols-8 sm:grid-cols-16 gap-1 justify-items-center">
                      <button 
                        v-for="num in mandibularTeeth" 
                        :key="num"
                        @click="activeTooth = num"
                        :class="getToothClass(num)"
                        class="h-7 w-7 rounded-lg border text-[10px] flex items-center justify-center transition-all cursor-pointer font-mono"
                        :title="`Tooth #${num}`"
                      >
                        {{ num }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Universal Chart Legends -->
                <div class="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-[9px] font-mono">
                  <div class="flex items-center space-x-1.5">
                    <span class="h-2 w-2 rounded-full border border-slate-200 bg-white"></span>
                    <span class="text-slate-500">Normal</span>
                  </div>
                  <div class="flex items-center space-x-1.5">
                    <span class="h-2 w-2 rounded-full border border-orange-400 bg-orange-100"></span>
                    <span class="text-slate-500">Active Focus</span>
                  </div>
                  <div class="flex items-center space-x-1.5">
                    <span class="h-2 w-2 rounded-full border border-blue-400 bg-blue-100"></span>
                    <span class="text-slate-500">Active Restorative</span>
                  </div>
                  <div class="flex items-center space-x-1.5">
                    <span class="h-2 w-2 rounded-full border border-red-400 bg-red-100"></span>
                    <span class="text-slate-500">Pathology</span>
                  </div>
                </div>
              </div>

              <!-- Persona Pipeline Output Panel -->
              <div class="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex-1 flex flex-col gap-4">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span class="text-xs font-bold tracking-wider text-slate-700 font-mono">THREE-PERSONA EXECUTION PIPELINE</span>
                  <Badge variant="subtle" theme="emerald" size="sm" class="text-[9px] font-mono">REALTIME SYNAPSE</Badge>
                </div>

                <div class="space-y-3.5 flex-1 overflow-y-auto max-h-[350px]">
                  <!-- 1. Clinical Recorder -->
                  <div class="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center space-x-1.5">
                        <span class="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                        <h4 class="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">1. Clinical Recorder</h4>
                      </div>
                      <Badge theme="blue" size="sm" variant="subtle" class="font-mono text-[8px]">Anatomy & Pathology</Badge>
                    </div>

                    <div v-if="chartingActions.length === 0" class="text-[10px] text-slate-400 italic font-mono">
                      Awaiting anatomy charting audio...
                    </div>
                    <div v-else class="space-y-1.5">
                      <div v-for="(act, idx) in chartingActions" :key="idx" class="flex items-center justify-between text-[10px] font-mono border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                        <span>Tooth #{{ act.tooth_number }} (Surfaces: {{ act.surfaces.join(', ') || 'None' }})</span>
                        <Badge :theme="act.status === 'active_pathology' ? 'red' : 'gray'" size="sm">{{ act.condition }}</Badge>
                      </div>
                    </div>
                  </div>

                  <!-- 2. Treatment Strategist -->
                  <div class="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center space-x-1.5">
                        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <h4 class="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">2. Treatment Strategist</h4>
                      </div>
                      <Badge theme="emerald" size="sm" variant="subtle" class="font-mono text-[8px]">CDT Code & Phasing</Badge>
                    </div>

                    <div v-if="treatmentPlan.phases.length === 0" class="text-[10px] text-slate-400 italic font-mono">
                      Awaiting CDT treatment planning dialogue...
                    </div>
                    <div v-else class="space-y-2.5">
                      <div v-if="treatmentPlan.diagnosis" class="text-[10px] font-bold text-slate-600 bg-indigo-50/30 p-1.5 rounded border border-indigo-100/30">
                        DIAGNOSIS: {{ treatmentPlan.diagnosis }}
                      </div>
                      
                      <div v-for="phase in treatmentPlan.phases" :key="phase.phase_number" class="text-[10px] font-mono">
                        <div class="font-bold text-slate-700 border-b border-slate-200 pb-0.5 mb-1.5">Phase {{ phase.phase_number }}: {{ phase.phase_name }}</div>
                        <div v-for="(proc, pIdx) in phase.procedures" :key="pIdx" class="pl-2 border-l border-emerald-300 text-slate-600 mb-1">
                          <span class="font-bold text-emerald-800">{{ proc.cdt_code }}</span> - {{ proc.description }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 3. Compliance Guard -->
                  <div class="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center space-x-1.5">
                        <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                        <h4 class="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-mono">3. Compliance Guard</h4>
                      </div>
                      <Badge theme="red" size="sm" variant="subtle" class="font-mono text-[8px]">Allergies & Diagnostics</Badge>
                    </div>

                    <div v-if="suggestedInvestigations.length === 0 && !prescriptionSuggestions.safety_alert_triggered" class="text-[10px] text-slate-400 italic font-mono">
                      All compliance checks cleared. No active intercept.
                    </div>
                    <div v-else class="space-y-2">
                      <div v-for="(inv, iIdx) in suggestedInvestigations" :key="iIdx" class="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono flex items-start space-x-1.5">
                        <AlertTriangle class="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span class="font-bold">MISSING DIAGNOSTIC:</span> {{ inv.type }} - {{ inv.reason }}
                        </div>
                      </div>

                      <div v-if="prescriptionSuggestions.drug_name" class="p-2.5 rounded border text-[10px] font-mono" :class="prescriptionSuggestions.safety_alert_triggered ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'">
                        <div class="font-bold uppercase mb-0.5">SUGGESTED PRESCRIPTION:</div>
                        <div>DRUG: <span class="font-bold">{{ prescriptionSuggestions.drug_name }} {{ prescriptionSuggestions.dosage }}</span></div>
                        <div>INST: {{ prescriptionSuggestions.instructions }} (QTY: {{ prescriptionSuggestions.quantity }})</div>
                        
                        <div v-if="prescriptionSuggestions.alert_message" class="mt-2 pt-2 border-t border-slate-200/50 text-[9px] opacity-90 font-sans">
                          <span class="font-bold uppercase font-mono">Compliance Alert:</span> {{ prescriptionSuggestions.alert_message }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Workspace -->
            <div class="lg:col-span-3 flex flex-col gap-5">
              
              <!-- Webhook dispatcher JSON viewer -->
              <div class="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm flex-1 flex flex-col min-h-[350px]">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <div class="flex items-center space-x-2">
                    <FileCode class="h-4 w-4 text-indigo-600" />
                    <span class="text-xs font-bold tracking-wider text-slate-700 font-mono">WEBHOOK DISPATCH PAYLOAD</span>
                  </div>
                  
                  <button
                    class="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Copy Payload"
                    @click="copyToClipboard"
                  >
                    <Copy class="h-3.5 w-3.5" />
                  </button>
                </div>

                <div class="bg-slate-900 border border-slate-950 rounded-lg p-3 flex-1 flex flex-col justify-between overflow-hidden">
                  <pre class="text-[9px] font-mono text-emerald-400 overflow-y-auto leading-relaxed flex-1 select-text max-h-[340px]"><code>{{ JSON.stringify(webhookPayload, null, 2) }}</code></pre>

                  <div class="border-t border-slate-800 pt-3 mt-3 flex flex-col gap-2 shrink-0">
                    <div class="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                      <span>EVENT: ENCOUNTER_PIPELINE</span>
                      <span>READY</span>
                    </div>
                    <Button
                      variant="solid"
                      theme="primary"
                      class="w-full text-xs font-mono font-bold tracking-wider"
                      @click="mockWebhookSend"
                    >
                      <div class="flex items-center justify-center gap-1.5">
                        <Send class="h-3.5 w-3.5" />
                        <span>DISPATCH TO SERVER</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>

              <!-- Scribe audit logs -->
              <div class="bg-white border border-slate-200 rounded-xl p-4.5 shadow-sm max-h-[260px] flex flex-col">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <span class="text-xs font-bold tracking-wider text-slate-700 font-mono">SCRIBE PIPELINE LOG AUDIT</span>
                  <Badge variant="subtle" theme="gray" size="sm" class="text-[8px] font-mono">REALTIME</Badge>
                </div>

                <div class="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex-1 overflow-y-auto max-h-[160px] space-y-2">
                  <div v-if="logs.length === 0" class="text-slate-400 text-[10px] font-mono italic text-center py-4">
                    Audit trail is empty. Dictate or select a scenario to record logs...
                  </div>
                  
                  <div
                    v-for="(log, idx) in logs"
                    :key="idx"
                    class="text-[9px] font-mono leading-relaxed border-b border-slate-100 pb-1.5 last:border-0 last:pb-0"
                  >
                    <div class="flex justify-between items-center text-slate-400 mb-0.5">
                      <span>{{ log.timestamp }}</span>
                      <span :class="{
                        'text-blue-600': log.persona === 'CLINICAL RECORDER',
                        'text-emerald-600': log.persona === 'TREATMENT STRATEGIST',
                        'text-red-600': log.persona === 'COMPLIANCE GUARD',
                        'text-slate-500': log.persona === 'SYSTEM'
                      }" class="font-bold">[{{ log.persona }}]</span>
                    </div>
                    <p :class="{
                      'text-red-700 font-bold': log.type === 'danger',
                      'text-amber-700': log.type === 'warning',
                      'text-emerald-700': log.type === 'success',
                      'text-slate-600': log.type === 'info'
                    }">
                      {{ log.message }}
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- VOCAL INTERCEPT COMPLIANCE MODAL -->
    <Dialog
      v-model="showVocalModal"
      :options="{
        title: '⚠️ COMPLIANCE SAFETY INTERCEPT TRIGGERED',
        size: 'md',
        onClose: () => { showVocalModal = false }
      }"
    >
      <template #body>
        <div class="text-sm text-slate-700 leading-relaxed font-sans mt-3 space-y-4">
          <div class="bg-red-50 border border-red-200 p-3.5 rounded-lg flex items-start space-x-3 text-red-800">
            <AlertTriangle class="h-5.5 w-5.5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <div class="font-bold text-xs uppercase tracking-wider font-mono">ALLERGY COLLISION DETECTED</div>
              <p class="mt-1 text-xs opacity-95 leading-relaxed">
                Dentist suggested <span class="font-bold text-slate-900">{{ dialogProposedPrescription?.drug_name }}</span> but patient allergy list contains:
                <span class="font-bold text-red-700 font-mono bg-red-100 px-1.5 py-0.5 border border-red-200 rounded ml-1">{{ patientAllergies }}</span>.
              </p>
            </div>
          </div>

          <div class="border-t border-b border-slate-100 py-3 font-medium text-slate-800">
            <div class="flex items-center space-x-2 text-indigo-600 text-xs font-mono uppercase tracking-wider mb-1.5">
              <Volume2 class="h-4 w-4" />
              <span>Vocal prompt read back to Dr. Runo:</span>
            </div>
            <p class="italic bg-slate-50 border border-slate-200 p-3 rounded font-serif text-slate-800 leading-relaxed text-xs">
              "Dr. Runo, the patient has a confirmed {{ dialogProposedPrescription?.allergy }} allergy on file. Would you like me to substitute the prescription suggestion with {{ dialogProposedPrescription?.alternatives[0]?.drug_name }} instead?"
            </p>
          </div>

          <div class="text-xs text-slate-600">
            <span class="font-bold text-slate-700 uppercase font-mono block mb-1.5">Substitute alternative:</span>
            <div v-for="(alt, i) in dialogProposedPrescription?.alternatives" :key="i" class="bg-slate-50 border border-slate-200 p-2.5 rounded font-mono">
              <div>DRUG: <span class="text-slate-900 font-bold">{{ alt.drug_name }} {{ alt.dosage }}</span></div>
              <div>INST: <span class="text-slate-800">{{ alt.instructions }}</span></div>
              <div>QTY: <span class="text-slate-950 font-bold">{{ alt.quantity }}</span></div>
            </div>
          </div>
        </div>
      </template>
      
      <template #actions>
        <div class="flex justify-end gap-2 w-full pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            theme="red"
            class="text-xs"
            @click="resolveVocalIntercept(false)"
          >
            Ignore & Override Allergy
          </Button>
          <Button
            variant="solid"
            theme="primary"
            class="text-xs"
            @click="resolveVocalIntercept(true)"
          >
            Yes, Substitute Prescription
          </Button>
        </div>
      </template>
    </Dialog>

    <!-- SEARCH MODAL -->
    <Dialog
      v-model="showSearchModal"
      :options="{
        title: 'Search Patient Registry',
        size: 'sm',
        onClose: () => { showSearchModal = false }
      }"
    >
      <template #body>
        <div class="space-y-4 mt-3">
          <div class="relative">
            <Search class="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Search by name, ID, or allergy..."
              class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div class="max-h-[220px] overflow-y-auto space-y-2">
            <div 
              v-for="p in filteredPatients" 
              :key="p.id"
              @click="loadPatientToScribe(p); showSearchModal = false"
              class="p-2.5 border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/20 rounded-lg cursor-pointer transition-all flex justify-between items-center"
            >
              <div>
                <h4 class="text-xs font-bold text-slate-800 leading-none">{{ p.name }}</h4>
                <span class="text-[9px] text-slate-400 font-mono mt-1 block">{{ p.id }}</span>
              </div>
              <Badge variant="subtle" theme="info" size="sm" class="font-mono text-[9px]">{{ p.id }}</Badge>
            </div>
            
            <div v-if="filteredPatients.length === 0" class="text-center py-6 text-xs text-slate-400 font-mono italic">
              No matching records found
            </div>
          </div>
        </div>
      </template>
      
      <template #actions>
        <div class="flex justify-end pt-3 border-t border-slate-100 w-full">
          <Button variant="outline" theme="gray" class="text-xs" @click="showSearchModal = false">
            Close
          </Button>
        </div>
      </template>
    </Dialog>

    <!-- NEW APPOINTMENT MODAL -->
    <Dialog
      v-model="showNewApptModal"
      :options="{
        title: 'Book New Appointment',
        size: 'sm',
        onClose: () => { showNewApptModal = false }
      }"
    >
      <template #body>
        <div class="space-y-4 mt-3">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Patient Name</label>
            <input 
              v-model="newApptTitle" 
              type="text" 
              placeholder="e.g. Sarah Jenkins"
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Time</label>
            <input 
              v-model="newApptTime" 
              type="text" 
              placeholder="e.g. 2:03 AM"
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>
      </template>
      
      <template #actions>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 w-full">
          <Button variant="outline" theme="gray" class="text-xs" @click="showNewApptModal = false">
            Cancel
          </Button>
          <Button variant="solid" theme="primary" class="text-xs" @click="addNewAppointment">
            Confirm Booking
          </Button>
        </div>
      </template>
    </Dialog>

    <!-- NEW LAB CASE MODAL -->
    <Dialog
      v-model="showNewLabModal"
      :options="{
        title: 'New Lab Case File',
        size: 'sm',
        onClose: () => { showNewLabModal = false }
      }"
    >
      <template #body>
        <div class="space-y-4 mt-3">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Case Name / Item</label>
            <input 
              v-model="newLabTitle" 
              type="text" 
              placeholder="e.g. Ceramic Crown Tooth #3"
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Notes</label>
            <textarea 
              v-model="newLabNotes" 
              rows="3"
              placeholder="Case details..."
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850 placeholder-slate-450 focus:outline-none focus:border-indigo-500 font-mono"
            ></textarea>
          </div>
        </div>
      </template>
      
      <template #actions>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 w-full">
          <Button variant="outline" theme="gray" class="text-xs" @click="showNewLabModal = false">
            Cancel
          </Button>
          <Button variant="solid" theme="primary" class="text-xs" @click="addNewLabWork">
            Create Case
          </Button>
        </div>
      </template>
    </Dialog>

    <!-- NEW EXPENSE MODAL -->
    <Dialog
      v-model="showNewExpenseModal"
      :options="{
        title: 'Log Clinic Expense',
        size: 'sm',
        onClose: () => { showNewExpenseModal = false }
      }"
    >
      <template #body>
        <div class="space-y-4 mt-3">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Expense Title</label>
            <input 
              v-model="newExpenseTitle" 
              type="text" 
              placeholder="e.g. Surgical Trays Restock"
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase font-mono mb-1">Amount (৳)</label>
            <input 
              v-model="newExpenseAmount" 
              type="number" 
              placeholder="Amount in Bangladeshi Taka"
              class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>
      </template>
      
      <template #actions>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 w-full">
          <Button variant="outline" theme="gray" class="text-xs" @click="showNewExpenseModal = false">
            Cancel
          </Button>
          <Button variant="solid" theme="primary" class="text-xs" @click="addNewExpense">
            Log Expense
          </Button>
        </div>
      </template>
    </Dialog>

  </div>
</template>

<style scoped>
/* Waveform animation */
@keyframes bounce {
  0%, 100% {
    transform: scaleY(0.25);
  }
  50% {
    transform: scaleY(1);
  }
}

.animate-bounce {
  transform-origin: bottom;
  animation: bounce infinite ease-in-out;
}

/* Slide-fade transition for toast alerts */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
