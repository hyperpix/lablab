<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, FormControl, Select } from 'frappe-ui'
import { setSetting } from '@/db/index'
import AppLogo from '@/components/AppLogo.vue'
import LucideChevron from '~icons/lucide/chevron-down'

const router = useRouter()

const STORAGE_KEY = 'dently_onboarding_done'
const doneSteps = ref<number[]>(
  JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
)

function markDone(id: number) {
  if (!doneSteps.value.includes(id)) doneSteps.value.push(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doneSteps.value))
}

function stepStatus(id: number) {
  if (doneSteps.value.includes(id)) return 'complete'
  const firstIncomplete = [0, 1, 2].find(i => !doneSteps.value.includes(i))
  return firstIncomplete === id ? 'current' : 'upcoming'
}

const openStep = ref<number>(
  [0, 1, 2].find(i => !doneSteps.value.includes(i)) ?? -1
)

function toggle(id: number) {
  openStep.value = openStep.value === id ? -1 : id
}

// Step 0
const step0 = ref({ clinicName: '', phone: '' })
// Step 1
const step1 = ref({ yourName: '', country: '' })
// Step 2
const teamSize = ref('')

const TEAM_SIZES = [
  { label: 'Just me',  value: 'just-me' },
  { label: '2–5',      value: '2-5'     },
  { label: '6–20',     value: '6-20'    },
  { label: '21–50',    value: '21-50'   },
  { label: '50+',      value: '50+'     },
]

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Bangladesh',
  'Belgium','Brazil','Canada','Chile','China','Colombia','Croatia','Czech Republic',
  'Denmark','Egypt','Ethiopia','Finland','France','Germany','Ghana','Greece',
  'Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan',
  'Jordan','Kenya','Malaysia','Mexico','Morocco','Netherlands','New Zealand',
  'Nigeria','Norway','Pakistan','Peru','Philippines','Poland','Portugal',
  'Romania','Russia','Saudi Arabia','South Africa','South Korea','Spain',
  'Sweden','Switzerland','Tanzania','Thailand','Turkey','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Vietnam',
].map(c => ({ label: c, value: c }))

const saving = ref(false)

async function saveStep0() {
  saving.value = true
  try {
    if (step0.value.clinicName) await setSetting('clinicName', step0.value.clinicName)
    if (step0.value.phone)      await setSetting('clinicPhone', step0.value.phone)
  } catch {}
  finally { saving.value = false }
  markDone(0)
  openStep.value = 1
}

async function saveStep1() {
  saving.value = true
  try {
    if (step1.value.yourName) await setSetting('ownerName', step1.value.yourName)
    if (step1.value.country)  await setSetting('country',   step1.value.country)
  } catch {}
  finally { saving.value = false }
  markDone(1)
  openStep.value = 2
}

async function saveStep2() {
  saving.value = true
  try {
    if (teamSize.value) await setSetting('teamSize', teamSize.value)
  } catch {}
  finally { saving.value = false }
  markDone(2)
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-surface-gray-1 px-8 py-12">

    <div class="w-full max-w-lg">

    <!-- Logo -->
    <div class="flex items-center gap-2 mb-8">
      <AppLogo class="w-8 h-8" />
      <span class="text-base font-semibold text-ink-gray-9">Dently</span>
    </div>
      <h3 class="text-base font-semibold text-ink-gray-9">Getting started</h3>
      <p class="mt-1 text-sm text-ink-gray-5">Follow the steps to set up your workspace</p>

      <div class="mt-5 flex flex-col gap-2">

        <!-- Step 0: Clinic name + Phone -->
        <div class="rounded-lg border border-outline-gray-2 bg-surface-white overflow-hidden shadow-sm">
          <button
            class="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-surface-gray-1 transition-colors"
            @click="toggle(0)"
          >
            <div class="flex items-center gap-2.5">
              <span class="flex size-5 items-center justify-center flex-shrink-0">
                <svg v-if="stepStatus(0) === 'complete'" class="size-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/></svg>
                <span v-else class="size-4 rounded-full border border-outline-gray-3" />
              </span>
              <span class="text-sm font-medium" :class="stepStatus(0) === 'upcoming' ? 'text-ink-gray-4' : 'text-ink-gray-9'">
                Your clinic
              </span>
            </div>
            <LucideChevron class="size-4 text-ink-gray-4 transition-transform flex-shrink-0" :class="openStep === 0 ? 'rotate-180' : ''" />
          </button>

          <div v-show="openStep === 0" class="px-4 pb-4 flex flex-col gap-3">
            <FormControl label="Clinic name" v-model="step0.clinicName" placeholder="e.g. Bright Smile Dental" />
            <FormControl label="Phone" v-model="step0.phone" placeholder="+1 555-0100" />
            <Button label="Continue" variant="solid" theme="blue" :loading="saving" @click="saveStep0" />
          </div>
        </div>

        <!-- Step 1: Your name + Country -->
        <div class="rounded-lg border border-outline-gray-2 bg-surface-white overflow-hidden shadow-sm">
          <button
            class="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-surface-gray-1 transition-colors"
            :disabled="stepStatus(1) === 'upcoming'"
            @click="toggle(1)"
          >
            <div class="flex items-center gap-2.5">
              <span class="flex size-5 items-center justify-center flex-shrink-0">
                <svg v-if="stepStatus(1) === 'complete'" class="size-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/></svg>
                <span v-else class="size-4 rounded-full border border-outline-gray-3" />
              </span>
              <span class="text-sm font-medium" :class="stepStatus(1) === 'upcoming' ? 'text-ink-gray-4' : 'text-ink-gray-9'">
                About you
              </span>
            </div>
            <LucideChevron class="size-4 text-ink-gray-4 transition-transform flex-shrink-0" :class="openStep === 1 ? 'rotate-180' : ''" />
          </button>

          <div v-show="openStep === 1" class="px-4 pb-4 flex flex-col gap-3">
            <FormControl label="Your name" v-model="step1.yourName" placeholder="e.g. Dr. Jane Smith" />
            <FormControl
              type="select"
              label="Country"
              v-model="step1.country"
              :options="[{ label: 'Select a country…', value: '' }, ...COUNTRIES]"
            />
            <Button label="Continue" variant="solid" theme="blue" :loading="saving" @click="saveStep1" />
          </div>
        </div>

        <!-- Step 2: Team size -->
        <div class="rounded-lg border border-outline-gray-2 bg-surface-white overflow-hidden shadow-sm">
          <button
            class="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-surface-gray-1 transition-colors"
            :disabled="stepStatus(2) === 'upcoming'"
            @click="toggle(2)"
          >
            <div class="flex items-center gap-2.5">
              <span class="flex size-5 items-center justify-center flex-shrink-0">
                <svg v-if="stepStatus(2) === 'complete'" class="size-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/></svg>
                <span v-else class="size-4 rounded-full border border-outline-gray-3" />
              </span>
              <span class="text-sm font-medium" :class="stepStatus(2) === 'upcoming' ? 'text-ink-gray-4' : 'text-ink-gray-9'">
                How big is your team?
              </span>
            </div>
            <LucideChevron class="size-4 text-ink-gray-4 transition-transform flex-shrink-0" :class="openStep === 2 ? 'rotate-180' : ''" />
          </button>

          <div v-show="openStep === 2" class="px-4 pb-4 flex flex-col gap-3">
            <Select v-model="teamSize" :options="TEAM_SIZES" variant="outline" class="w-full" />
            <Button label="Finish" variant="solid" theme="blue" :loading="saving" :disabled="!teamSize" @click="saveStep2" />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
