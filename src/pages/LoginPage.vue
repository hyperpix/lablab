<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { TextInput, Button } from 'frappe-ui'
import { useAuthStore } from '@/stores/auth'
import { getStaff } from '@/db/index'
import LucideMail     from '~icons/lucide/mail'
import LucideLock     from '~icons/lucide/lock'

const auth     = useAuthStore()
const router   = useRouter()

const email    = ref('')
const password = ref('')
const showPw   = ref(false)
const error    = ref('')
const loading  = ref(false)

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    const staff  = await getStaff()
    const member = staff.find(
      (s) => (s.name === email.value || s.email === email.value) && s.pin === password.value
    )
    if (!member) {
      if (staff.length === 0 && email.value === 'admin' && password.value === 'admin') {
        auth.login({ name: 'Admin', username: 'admin', pin: 'admin' })
        router.push('/')
        return
      }
      error.value = 'Invalid email or password'
      return
    }
    auth.login({ name: member.name, username: member.email, pin: member.pin ?? '' })
    router.push('/')
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-surface-gray-1 px-4">

    <!-- Logo + title above card -->
    <div class="flex flex-col items-start gap-3 mb-6 w-full max-w-[420px]">
      <img
        src="https://i.ibb.co.com/x8BvBZ6v/ur.png"
        alt="Dently"
        class="size-16 rounded-xl"
      />
      <h1 class="text-xl font-semibold text-ink-gray-9 tracking-tight">Login to Dently</h1>
    </div>

    <!-- Card -->
    <div class="w-full max-w-[420px] bg-surface-white rounded-xl border border-outline-gray-2 shadow-sm p-7 flex flex-col gap-4">

      <!-- Email -->
      <TextInput
        v-model="email"
        type="email"
        placeholder="jane@example.com"
        @keyup.enter="handleLogin"
      >
        <template #prefix>
          <LucideMail class="size-4 text-ink-gray-5" />
        </template>
      </TextInput>

      <!-- Password -->
      <div class="flex flex-col gap-1.5">
        <TextInput
          v-model="password"
          :type="showPw ? 'text' : 'password'"
          placeholder="••••••"
          @keyup.enter="handleLogin"
        >
          <template #prefix>
            <LucideLock class="size-4 text-ink-gray-5" />
          </template>
          <template #suffix>
            <button
              type="button"
              class="text-xs text-ink-gray-5 hover:text-ink-gray-8 transition-colors pr-0.5"
              @click="showPw = !showPw"
            >
              {{ showPw ? 'Hide' : 'Show' }}
            </button>
          </template>
        </TextInput>
        <div class="flex justify-end">
          <button class="text-xs text-ink-gray-5 hover:text-ink-gray-8 transition-colors">
            Forgot Password?
          </button>
        </div>
      </div>

      <!-- Error -->
      <p v-if="error" class="text-xs text-ink-red-3">{{ error }}</p>

      <!-- Login button -->
      <Button
        label="Login"
        variant="solid"
        theme="gray"
        class="w-full"
        :loading="loading"
        @click="handleLogin"
      />

      <!-- Divider -->
      <div class="flex items-center gap-3">
        <div class="flex-1 h-px bg-outline-gray-2" />
        <span class="text-xs text-ink-gray-4">or</span>
        <div class="flex-1 h-px bg-outline-gray-2" />
      </div>

      <!-- Email link login -->
      <Button label="Login via Email" variant="subtle" class="w-full" />

    </div>

    <!-- Sign up link -->
    <p class="text-center text-xs text-ink-gray-5 mt-4">
      Don't have an account?
      <button class="text-ink-gray-8 font-medium hover:underline" @click="router.push('/signup')">
        Sign up
      </button>
    </p>
  </div>
</template>
