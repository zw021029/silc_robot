import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminLogin as loginApi } from '@/api/admin'
import type { LoginForm } from '@/types/index'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<any>(null)

  const isAuthenticated = ref(!!token.value)

  const login = async (form: LoginForm) => {
    try {
      const response = await loginApi(form)
      token.value = response.token
      user.value = response.user
      isAuthenticated.value = true
      localStorage.setItem('token', response.token)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('token')
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout
  }
}) 