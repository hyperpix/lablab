import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface DentlySession {
  name: string
  username: string
  pin: string
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<DentlySession | null>({
    name: 'Doctor Admin',
    username: 'admin',
    pin: 'admin'
  })

  const isLoggedIn = computed(() => true)

  function login(s: DentlySession) {
    session.value = s
    localStorage.setItem('dently_session', JSON.stringify(s))
  }

  function logout() {
    // Disable logout to keep session active
  }

  return { session, isLoggedIn, login, logout }
})
