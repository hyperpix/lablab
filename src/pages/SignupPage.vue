<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { TextInput, Button } from 'frappe-ui'
import { useAuthStore } from '@/stores/auth'
import LucideMail  from '~icons/lucide/mail'
import LucideLock  from '~icons/lucide/lock'
import LucideUser  from '~icons/lucide/user'

const auth   = useAuthStore()
const router = useRouter()

const name     = ref('')
const email    = ref('')
const password = ref('')
const showPw   = ref(false)

function handleSignup() {
  auth.login({ name: name.value || 'User', username: email.value || 'user', pin: password.value })
  router.push('/onboarding')
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-surface-gray-1 px-4">

    <!-- Logo + title -->
    <div class="flex flex-col items-start gap-3 mb-6 w-full max-w-[420px]">
      <img
        src="https://i.ibb.co.com/x8BvBZ6v/ur.png"
        alt="Dently"
        class="size-16 rounded-xl"
      />
      <h1 class="text-xl font-semibold text-ink-gray-9 tracking-tight">Create your account</h1>
    </div>

    <!-- Card -->
    <div class="w-full max-w-[420px] bg-surface-white rounded-xl border border-outline-gray-2 shadow-sm p-7 flex flex-col gap-4">

      <!-- Name -->
      <TextInput v-model="name" type="text" placeholder="Full name" @keyup.enter="handleSignup">
        <template #prefix><LucideUser class="size-4 text-ink-gray-5" /></template>
      </TextInput>

      <!-- Email -->
      <TextInput v-model="email" type="email" placeholder="jane@example.com" @keyup.enter="handleSignup">
        <template #prefix><LucideMail class="size-4 text-ink-gray-5" /></template>
      </TextInput>

      <!-- Password -->
      <TextInput v-model="password" :type="showPw ? 'text' : 'password'" placeholder="••••••" @keyup.enter="handleSignup">
        <template #prefix><LucideLock class="size-4 text-ink-gray-5" /></template>
        <template #suffix>
          <button
            type="button"
            class="text-xs text-ink-gray-5 hover:text-ink-gray-8 transition-colors pr-0.5"
            @click="showPw = !showPw"
          >{{ showPw ? 'Hide' : 'Show' }}</button>
        </template>
      </TextInput>

      <!-- Error -->
      <p v-if="error" class="text-xs text-ink-red-3">{{ error }}</p>

      <!-- Submit -->
      <Button
        label="Create Account"
        variant="solid"
        theme="gray"
        class="w-full"
        :loading="loading"
        @click="handleSignup"
      />

      <!-- Divider -->
      <div class="flex items-center gap-3">
        <div class="flex-1 h-px bg-outline-gray-2" />
        <span class="text-xs text-ink-gray-4">or</span>
        <div class="flex-1 h-px bg-outline-gray-2" />
      </div>

      <!-- Login link -->
      <p class="text-center text-xs text-ink-gray-5">
        Already have an account?
        <button class="text-ink-gray-8 font-medium hover:underline" @click="router.push('/login')">
          Log in
        </button>
      </p>
    </div>
  </div>
</template>
