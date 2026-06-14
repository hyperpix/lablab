<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, FormControl, Progress, toast } from 'frappe-ui'
import AssistantUiVoiceOrb from '../components/ui/AssistantUiVoiceOrb.vue'
import { runClinicalWorkflow } from '@/lib/clinicalAgents'
import {
  getPatients,
  getPatient,
  updatePatient,
  getTreatments,
  createTreatment,
  createTreatmentPlan,
  createPatientPrescription,
  logDentalChartChange
} from '@/db/index'

const route = useRoute()
const router = useRouter()

const showDiagnostics = ref(false)

function maskKey(key?: string) {
  if (!key) return 'undefined'
  const clean = key.replace(/^['"]|['"]$/g, "").trim()
  if (clean.length <= 10) return '***'
  return `${clean.substring(0, 8)}...${clean.substring(clean.length - 6)} (length: ${clean.length})`
}

const envVars = computed(() => {
  return {
    featherlessKey: import.meta.env.VITE_FEATHERLESS_API_KEY || '',
    bandApiKey: import.meta.env.VITE_BAND_API_KEY || '',
    bandScribeKey: import.meta.env.VITE_BAND_SCRIBE_KEY || import.meta.env.VITE_SCRIBE_KEY || import.meta.env.BAND_SCRIBE_KEY || '',
    bandPlannerKey: import.meta.env.VITE_BAND_PLANNER_KEY || import.meta.env.VITE_PLANNER_KEY || import.meta.env.BAND_PLANNER_KEY || '',
    bandPharmaKey: import.meta.env.VITE_BAND_PHARMACOLOGIST_KEY || import.meta.env.VITE_PHARMA_KEY || import.meta.env.BAND_PHARMA_KEY || '',
    scribeUuid: import.meta.env.VITE_SCRIBE_UUID || '',
    plannerUuid: import.meta.env.VITE_PLANNER_UUID || '',
    pharmaUuid: import.meta.env.VITE_PHARMACOLOGIST_UUID || ''
  }
})

const patientId = computed(() => (route.query.patient_id || route.query.patientId) as string)

const currentOrbState = ref<'idle' | 'connecting' | 'listening' | 'speaking' | 'muted' | 'thinking'>('listening')

const stateLabel = computed(() => {
  const labels: Record<string, string> = {
    idle: 'Idle',
    connecting: 'Connecting…',
    listening: 'Listening',
    speaking: 'Speaking',
    muted: 'Muted',
    thinking: 'Thinking…',
  }
  return labels[currentOrbState.value] ?? currentOrbState.value
})
const isMuted = ref(false)
const audioLevel = ref(0)

const selectedMic = ref('default')
const micOptions = ref<{ label: string; value: string }[]>([
  { label: 'Default Microphone', value: 'default' }
])

let audioContext: AudioContext | null = null
let analyserNode: AnalyserNode | null = null
let mediaStream: MediaStream | null = null
let audioAnimationId: number | null = null
const audioDataArray = new Uint8Array(128)

const isCompleting = ref(false)
const progressValue = ref(0)
const progressLabel = ref('')

// --- Speech Recognition ---
const isListening = ref(false)
const transcriptionText = ref('')
const interimText = ref('')
let recognition: any = null

function initSpeechRecognition() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported in this browser.')
    return
  }
  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'

  recognition.onresult = (event: any) => {
    let finalTranscript = ''
    let interimTranscript = ''
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript
      } else {
        interimTranscript += event.results[i][0].transcript
      }
    }
    if (finalTranscript) {
      transcriptionText.value += (transcriptionText.value ? ' ' : '') + finalTranscript
    }
    interimText.value = interimTranscript
  }

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error)
  }

  recognition.onend = () => {
    if (isListening.value && !isMuted.value && recognition) {
      try {
        recognition.start()
      } catch (e) {}
    }
  }
}

async function loadMicrophones() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {})
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioDevices = devices.filter(device => device.kind === 'audioinput')
    if (audioDevices.length > 0) {
      micOptions.value = audioDevices.map((device, index) => ({
        label: device.label || `Microphone ${index + 1}`,
        value: device.deviceId
      }))
      selectedMic.value = audioDevices[0].deviceId
    }
  } catch (err) {
    console.warn('Microphones could not be enumerated:', err)
  }
}

async function startMicCapture(deviceId: string) {
  stopMicCapture()
  if (isMuted.value) return
  isListening.value = true
  if (recognition) {
    try {
      recognition.start()
    } catch (e) {}
  }
  try {
    const constraints: MediaStreamConstraints = {
      audio: deviceId === 'default' ? true : { deviceId: { exact: deviceId } }
    }
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
    audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(mediaStream)
    analyserNode = audioContext.createAnalyser()
    analyserNode.fftSize = 256
    source.connect(analyserNode)
    startAudioLoop()
  } catch (err) {
    console.warn('Could not start mic capture:', err)
  }
}

function stopMicCapture() {
  isListening.value = false
  if (recognition) {
    try {
      recognition.stop()
    } catch (e) {}
  }
  try {
    stopAudioLoop()
  } catch (e) {}
  if (mediaStream) {
    try {
      mediaStream.getTracks().forEach(t => t.stop())
    } catch (e) {}
    mediaStream = null
  }
  if (audioContext) {
    try {
      audioContext.close()
    } catch (e) {}
    audioContext = null
  }
  analyserNode = null
}

function startAudioLoop() {
  const loop = () => {
    if (!analyserNode) {
      audioAnimationId = requestAnimationFrame(loop)
      return
    }
    analyserNode.getByteFrequencyData(audioDataArray)
    let sum = 0
    for (let i = 0; i < audioDataArray.length; i++) {
      sum += audioDataArray[i]
    }
    const avg = sum / audioDataArray.length
    audioLevel.value = Math.min(1, avg / 128)
    audioAnimationId = requestAnimationFrame(loop)
  }
  loop()
}

function stopAudioLoop() {
  if (audioAnimationId !== null) {
    cancelAnimationFrame(audioAnimationId)
    audioAnimationId = null
  }
}

function toggleMute() {
  isMuted.value = !isMuted.value
  if (isMuted.value) {
    currentOrbState.value = 'muted'
    audioLevel.value = 0
    stopMicCapture()
  } else {
    currentOrbState.value = 'listening'
    startMicCapture(selectedMic.value)
  }
}

async function completeScribing() {
  stopMicCapture()
  isCompleting.value = true
  currentOrbState.value = 'thinking'

  function updateProgress(value: number, label: string) {
    progressValue.value = value
    progressLabel.value = label
  }

  updateProgress(5, 'Transcribing voice input...')

  let transcript = transcriptionText.value.trim()
  if (interimText.value.trim()) {
    transcript += (transcript ? ' ' : '') + interimText.value.trim()
  }
  if (!transcript) {
    // Use a high-quality clinical fallback if no voice was recorded
    transcript = "Dr. Runo: Let's look at tooth number 3. I see deep recurrent decay on the distal-occlusal surface. The patient needs a core buildup and a porcelain crown. We will plan a D2950 core buildup and a D2740 ceramic crown. Let's prescribe Ibuprofen 400mg, 1 tablet every 6 hours as needed for pain, quantity 20."
    updateProgress(5, 'Using clinical template (no voice detected)...')
    await new Promise(r => setTimeout(r, 1000))
  }

  try {
    updateProgress(15, 'Orchestrating clinical agents via Featherless...')

    const targetPatientId = patientId.value || (await getPatients())[0]?.id
    if (!targetPatientId) {
      throw new Error('No patient found in the database.')
    }

    const result = await runClinicalWorkflow(
      transcript,
      {
        featherless: import.meta.env.VITE_FEATHERLESS_API_KEY || '',
        band: import.meta.env.VITE_BAND_API_KEY || '',
        bandScribe: import.meta.env.VITE_BAND_SCRIBE_KEY || import.meta.env.VITE_SCRIBE_KEY || import.meta.env.BAND_SCRIBE_KEY || '',
        bandPlanner: import.meta.env.VITE_BAND_PLANNER_KEY || import.meta.env.VITE_PLANNER_KEY || import.meta.env.BAND_PLANNER_KEY || '',
        bandPharma: import.meta.env.VITE_BAND_PHARMACOLOGIST_KEY || import.meta.env.VITE_PHARMA_KEY || import.meta.env.BAND_PHARMA_KEY || ''
      },
      {
        scribe: import.meta.env.VITE_SCRIBE_UUID || '',
        planner: import.meta.env.VITE_PLANNER_UUID || '',
        pharmacologist: import.meta.env.VITE_PHARMACOLOGIST_UUID || ''
      },
      {
        scribe: 'meetnorthern/scribeagent',
        planner: 'meetnorthern/planneragent',
        pharmacologist: 'meetnorthern/pharmacologistagent'
      },
      targetPatientId,
      (label, value) => {
        updateProgress(value, label)
      }
    )

    updateProgress(70, 'Parsing diagnosis & treatment plans...')

    const p = await getPatient(targetPatientId)
    if (p) {
      updateProgress(80, 'Saving tooth chart condition markings...')

      // Save diagnostics in the custom __DIAGNOSTICS__JSON format in patient notes
      const notesJson = '__DIAGNOSTICS__JSON:' + JSON.stringify(result.diagnostics)

      const suggestionData = {
        chief_complaint: result.diagnostics.chief_complaint || '',
        systemic_alert: result.diagnostics.drug_history || '',
        investigation: result.diagnostics.investigation_notes || '',
        diagnosis: result.diagnostics.diagnosis_notes || '',
        suggestions: result.diagnostics.other_conditions || '',
        prescriptions: result.prescriptions || []
      }
      const combinedNotes = notesJson + '\n__AI_SUGGESTION__JSON:' + JSON.stringify(suggestionData)

      // Update teeth chart condition markings
      const updatedTeeth = [...(p.teeth || []).map(t => ({ ...t, ISO: Number(t.ISO) }))]
      if (result.teeth_marks && result.teeth_marks.length > 0) {
        for (const mark of result.teeth_marks) {
          const toothNo = Number(mark.tooth_iso)
          if (isNaN(toothNo)) continue
          const idx = updatedTeeth.findIndex(t => Number(t.ISO) === toothNo)
          const conditionStr = mark.condition
          const notesArr = mark.notes ? [mark.notes] : []
          if (idx !== -1) {
            const oldCondition = updatedTeeth[idx].condition
            updatedTeeth[idx].condition = conditionStr
            if (mark.notes && !updatedTeeth[idx].notes.includes(mark.notes)) {
              updatedTeeth[idx].notes.push(mark.notes)
            }
            await logDentalChartChange(targetPatientId, toothNo, oldCondition, conditionStr)
          } else {
            updatedTeeth.push({
              ISO: toothNo,
              condition: conditionStr as any,
              notes: notesArr
            })
            await logDentalChartChange(targetPatientId, toothNo, 'sound', conditionStr)
          }
        }
      }

      await updatePatient(p.id, {
        notes: combinedNotes,
        teeth: updatedTeeth
      })
    }

    updateProgress(90, 'Persisting draft treatment plans and prescriptions...')

    // Create Treatment Plan
    {
      const dbTreatments = await getTreatments()
      const planItems = []
      let totalPrice = 0

      // Fallback to a Comprehensive Oral Evaluation if no treatments are suggested
      const suggestedTreatments = (result.treatments && result.treatments.length > 0)
        ? result.treatments
        : [{ description: 'Comprehensive Oral Evaluation', tooth: '', phase: 'Phase 1 - Diagnostic' }]

      for (const rxTr of suggestedTreatments) {
        let found = dbTreatments.find(t => 
          t.type.toLowerCase().includes(rxTr.description.toLowerCase()) || 
          rxTr.description.toLowerCase().includes(t.type.toLowerCase())
        )
        if (!found) {
          found = await createTreatment({
            type: rxTr.description,
            expenses: 120,
            duration: 45
          })
        }
        const price = found.expenses * 2
        totalPrice += price
        planItems.push({
          id: Math.random().toString(36).substring(7),
          treatment_id: found.id,
          price: price,
          is_done: false
        })
      }

      await createTreatmentPlan({
        patient_id: targetPatientId,
        title: `AI Recommended Plan - ${new Date().toLocaleDateString()}`,
        items: planItems,
        status: 'draft',
        total_price: totalPrice
      })
    }

    // Suggested prescriptions are saved in patient.notes and loaded during manual prescription creation.

    progressValue.value = 100
    progressLabel.value = 'Clinical ingestion complete!'
    toast.success('Clinical ingestion complete! Diagnostics, treatment plan draft, and teeth chart marks saved successfully.')
    await new Promise(r => setTimeout(r, 1000))
    router.back()
  } catch (err: any) {
    console.error('Error running clinical workflow:', err)
    toast.error(`Workflow error occurred: ${err.message || 'An error occurred during agent execution.'}`)
    await new Promise(r => setTimeout(r, 1200))
    router.back()
  }
}

onMounted(async () => {
  initSpeechRecognition()
  await loadMicrophones()
  startMicCapture(selectedMic.value)
})

onBeforeUnmount(() => {
  stopMicCapture()
})
</script>

<template>
  <!-- Progress view (replaces everything when completing) -->
  <div v-if="isCompleting" class="flex flex-col items-center justify-center min-h-[80vh] p-8">
    <div class="w-full max-w-sm flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <div class="text-left">
          <span class="text-gray-900 text-sm font-semibold">{{ progressLabel }}</span>
        </div>
        <Progress
          :value="progressValue"
          :intervals="true"
          :interval-count="4"
          size="md"
        />
      </div>

      <!-- Inline Toast under the progress bar -->
      <div class="bg-white text-gray-900 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 w-full border border-gray-200">
        <!-- Spinner / Success icon -->
        <svg v-if="progressValue < 100" class="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span class="text-sm font-medium text-gray-900">
          {{ progressValue < 100 ? 'Clinical workflow executing...' : 'Ingestion complete' }}
        </span>
      </div>
    </div>
  </div>

  <!-- Normal view -->
  <div v-else class="flex flex-col items-center justify-center gap-6 min-h-[80vh] p-8">
    <!-- Orb -->
    <div class="w-[280px] h-[280px] flex items-center justify-center">
      <AssistantUiVoiceOrb :state="currentOrbState" variant="blue" :audio-level="audioLevel" />
    </div>

    <span class="text-lg font-semibold text-gray-600">{{ stateLabel }}</span>

    <!-- Controls -->
    <div class="flex items-center gap-3">
      <div class="w-48">
        <FormControl type="select" v-model="selectedMic" :options="micOptions" class="mic-select" />
      </div>
      <Button
        :variant="isMuted ? 'solid' : 'outline'"
        :theme="isMuted ? 'red' : 'gray'"
        :label="isMuted ? 'Unmute' : 'Mute'"
        :icon-left="isMuted ? 'lucide-mic-off' : 'lucide-mic'"
        @click="toggleMute"
      />
      <Button
        variant="solid"
        theme="blue"
        label="Complete"
        @click="completeScribing"
        :loading="isCompleting"
      />
    </div>

    <!-- Diagnostics -->
    <div class="mt-8 border border-gray-200 rounded-lg p-4 max-w-lg w-full bg-gray-50 text-left">
      <button @click="showDiagnostics = !showDiagnostics" class="flex justify-between w-full text-sm font-semibold text-gray-700 focus:outline-none">
        <span>🔧 Band.ai Diagnostics</span>
        <span>{{ showDiagnostics ? '▲' : '▼' }}</span>
      </button>
      <div v-if="showDiagnostics" class="mt-4 flex flex-col gap-2 text-xs font-mono text-gray-600">
        <div><strong>VITE_FEATHERLESS_API_KEY:</strong> {{ maskKey(envVars.featherlessKey) }}</div>
        <div><strong>VITE_BAND_API_KEY (deprecated):</strong> {{ maskKey(envVars.bandApiKey) }}</div>
        <div><strong>VITE_BAND_SCRIBE_KEY:</strong> {{ maskKey(envVars.bandScribeKey) }}</div>
        <div><strong>VITE_BAND_PLANNER_KEY:</strong> {{ maskKey(envVars.bandPlannerKey) }}</div>
        <div><strong>VITE_BAND_PHARMACOLOGIST_KEY:</strong> {{ maskKey(envVars.bandPharmaKey) }}</div>
        <div><strong>VITE_SCRIBE_UUID:</strong> {{ envVars.scribeUuid || 'undefined (using fallback)' }}</div>
        <div><strong>VITE_PLANNER_UUID:</strong> {{ envVars.plannerUuid || 'undefined (using fallback)' }}</div>
        <div><strong>VITE_PHARMACOLOGIST_UUID:</strong> {{ envVars.pharmaUuid || 'undefined (using fallback)' }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mic-select :deep([data-slot="trigger-value"]) {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
.mic-select :deep(.select-trigger-sizer) {
  display: none !important;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shimmer-text {
  background: linear-gradient(90deg, #1e40af 0%, #3b82f6 25%, #60a5fa 50%, #3b82f6 75%, #1e40af 100%);
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: shimmer 3s linear infinite;
  display: inline-block;
}
</style>
