import { defineStore } from 'pinia'
import { showSuccess, showError } from '../utils/toast'

interface UserState {
  token: string
  userInfo: {
    id: string
    username: string
    avatar?: string
  } | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token') || '',
    userInfo: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username || ''
  },

  actions: {
    // 登出
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
    },

    // 更新用户信息
    updateUserInfo(userInfo: UserState['userInfo']) {
      this.userInfo = userInfo
    }
  }
}) 