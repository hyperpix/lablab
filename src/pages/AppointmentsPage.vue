<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Calendar, Button, Dialog, FormControl, Avatar } from 'frappe-ui'
import { getPatients, getAppointments, createAppointment, type Patient, type Appointment } from '@/db/index'
import { useTopbar } from '@/composables/useTopbar'
import LucideX from '~icons/lucide/x'
import LucideCalendar from '~icons/lucide/calendar'
import LucideUser from '~icons/lucide/user'
import LucideClock from '~icons/lucide/clock'

const router = useRouter()
const route = useRoute()
const patients = ref<Patient[]>([])
const { setActions } = useTopbar()
setActions([{ label: 'New Appointment', onClick: () => { showAdd.value = true } }])

// ── Calendar config ───────────────────────────────────────────────────────────
const config = {
  defaultMode: 'Month',
  isEditMode:  false,
  eventIcons: {},
  allowCustomClickEvents: true,
  enableShortcuts: false,
}

const events = ref<{
  id: string; title: string; participant: string; fromDate: string; toDate: string; fromTime: string; toTime: string; color: string;
}[]>([])

function appointmentToEvent(a: Appointment) {
  const d = new Date(a.date)
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const fromMinutes = Math.floor(a.time / 60000)
  const fromTimeH = String(Math.floor(fromMinutes / 60)).padStart(2, '0')
  const fromTimeM = String(fromMinutes % 60).padStart(2, '0')
  const colors = ['blue', 'green', 'violet', 'amber', 'red', 'teal', 'orange', 'cyan']
  const color = colors[Math.floor(Math.random() * colors.length)]
  return {
    id: a.id,
    title: a.complaint ? `${a.patient_id} — ${a.complaint}` : a.patient_id,
    participant: a.patient_id,
    fromDate: dateStr,
    toDate: dateStr,
    fromTime: `${fromTimeH}:${fromTimeM}`,
    toTime: `${fromTimeH}:${String(fromMinutes % 60 + 30).padStart(2, '0')}`,
    color,
  }
}

async function loadEvents() {
  try {
    const apps = await getAppointments()
    events.value = apps.map(appointmentToEvent)
  } catch {
    events.value = []
  }
}

// ── New Appointment dialog ────────────────────────────────────────────────────
const showAdd  = ref(false)
const saving   = ref(false)
const form     = ref({
  patient_id: '',
  date:       new Date().toISOString().split('T')[0],
  fromTime:   '09:00',
  toTime:     '10:00',
  complaint:  '',
  notes:      '',
})

const patientOptions = computed(() => patients.value.map(p => ({ label: p.name, value: p.id })))
const selectedPatient = computed(() => patients.value.find(p => p.id === form.value.patient_id))

async function saveAppointment() {
  if (!form.value.patient_id || !form.value.date) return
  saving.value = true
  try {
    const dateEpoch = new Date(`${form.value.date}T${form.value.fromTime}`).getTime()
    const [fh, fm] = form.value.fromTime.split(':').map(Number)
    const [th, tm] = form.value.toTime.split(':').map(Number)
    const duration = ((th * 60 + tm) - (fh * 60 + fm)) * 60 * 1000

    await createAppointment({
      patient_id:   form.value.patient_id,
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
      complaint:    form.value.complaint,
      diagnosis:    '',
      notes:        form.value.notes,
      prescriptions: [],
      reminder_24h_sent: false,
      reminder_1h_sent:  false,
    })

    const name = selectedPatient.value?.name ?? 'Patient'
    events.value.push({
      id:          `new-${Date.now()}`,
      title:       `${name}${form.value.complaint ? ' — ' + form.value.complaint : ''}`,
      participant: name,
      fromDate:    form.value.date,
      toDate:      form.value.date,
      fromTime:    form.value.fromTime,
      toTime:      form.value.toTime,
      color:       'blue',
    })

    showAdd.value = false
    form.value = { patient_id: '', date: new Date().toISOString().split('T')[0], fromTime: '09:00', toTime: '10:00', complaint: '', notes: '' }
  } catch { alert('Failed to save appointment') }
  finally { saving.value = false }
}

onMounted(async () => {
  await Promise.all([
    loadEvents(),
    (async () => {
      try {
        patients.value = await getPatients()
        const pid = route.query.patient_id as string
        if (pid) {
          form.value.patient_id = pid
          showAdd.value = true
        }
      } catch {}
    })(),
  ])
})
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <!-- Calendar -->
    <div class="flex-1 min-h-0">
      <Calendar
        :config="config"
        :events="events"
        @create="() => {}"
        @update="() => {}"
        @delete="(id) => { events.value = events.value.filter(e => e.id !== id) }"
      >
        <template #event-popover-content="{ calendarEvent, close }">
          <div class="w-80 p-4 text-ink-gray-8">
            <div class="flex flex-row-reverse mb-2">
              <button class="cursor-pointer text-ink-gray-4 hover:text-ink-gray-9" @click.stop="close">
                <LucideX class="h-4 w-4" />
              </button>
            </div>
            <div class="flex flex-col gap-5">
              <div class="text-xl font-semibold text-ink-gray-9 leading-tight">
                {{ calendarEvent.title || 'New Event' }}
              </div>
              <div class="flex flex-col gap-4">
                <div class="flex items-center gap-2">
                  <LucideCalendar class="h-4 w-4 text-ink-gray-4" />
                  <span class="text-sm font-normal text-ink-gray-7">{{ calendarEvent.fromDate }}</span>
                </div>
                <div v-if="calendarEvent.participant" class="flex items-center gap-2">
                  <LucideUser class="h-4 w-4 text-ink-gray-4" />
                  <span class="text-sm font-normal text-ink-gray-7">{{ calendarEvent.participant }}</span>
                </div>
                <div v-if="calendarEvent.fromTime && calendarEvent.toTime" class="flex items-center gap-2">
                  <LucideClock class="h-4 w-4 text-ink-gray-4" />
                  <span class="text-sm font-normal text-ink-gray-7">{{ calendarEvent.fromTime }} - {{ calendarEvent.toTime }}</span>
                </div>
              </div>
              <Button
                label="Show Details"
                variant="solid"
                theme="blue"
                class="w-full"
                @click="router.push(`/appointments/${calendarEvent.id}`)"
              />
            </div>
          </div>
        </template>
      </Calendar>
    </div>

    <!-- New Appointment Dialog -->
    <Dialog v-model="showAdd" :options="{ title: 'New Appointment', size: 'md' }">
      <template #body-content>
        <div class="flex flex-col gap-3">
          <FormControl
            type="select"
            label="Patient *"
            v-model="form.patient_id"
            :options="patientOptions.length ? patientOptions : [{ label: 'No patients — add one first', value: '' }]"
          />

          <div v-if="selectedPatient" class="flex items-center gap-2 rounded-md bg-surface-gray-1 border border-outline-gray-2 px-3 py-2">
            <Avatar :label="selectedPatient.name" size="sm" />
            <div>
              <span class="text-sm font-medium text-ink-gray-9">{{ selectedPatient.name }}</span>
              <span v-if="selectedPatient.phone" class="text-xs text-ink-gray-5 ml-2">{{ selectedPatient.phone }}</span>
            </div>
          </div>

          <FormControl type="date" label="Date *" v-model="form.date" />

          <div class="grid grid-cols-2 gap-3">
            <FormControl label="Start Time" v-model="form.fromTime" type="time" />
            <FormControl label="End Time"   v-model="form.toTime"   type="time" />
          </div>

          <FormControl label="Complaint / Reason" v-model="form.complaint" placeholder="e.g. Tooth pain upper right…" />
          <FormControl label="Notes" v-model="form.notes" placeholder="Additional notes…" />

          <div class="flex gap-2 justify-end pt-2">
            <Button label="Cancel" variant="outline" @click="showAdd = false" />
            <Button label="Book Appointment" variant="solid" theme="blue" :loading="saving" @click="saveAppointment" />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>
