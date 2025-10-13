import { apiClient } from './client'

export const authApi = {
  signup: async (email, password) => {
    const response = await apiClient.post('/api/auth/signup/email', {
      email,
      password,
    })
    return response.data
  },

  login: async (email, password) => {
    const response = await apiClient.post('/api/auth/login/email', {
      email,
      password,
    })
    return response.data
  },
}
