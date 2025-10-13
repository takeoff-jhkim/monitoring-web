import { apiClient } from './client'

export const agentApi = {
  // Link agent system
  linkAgentSystem: async (apiKey, apiSecret, systemName) => {
    const response = await apiClient.post('/api/user/agent/connection/link', {
      apiKey,
      apiSecret,
      systemName,
    })
    return response.data
  },

  // Execute agent (create new agent instance)
  executeAgent: async (command, context = {}) => {
    const response = await apiClient.post('/api/user/agent/execute', {
      command,
      context,
    })
    return response.data
  },

  // List agent sessions
  listAgentSessions: async () => {
    const response = await apiClient.get('/api/user/agent/sessions')
    return response.data
  },

  // Get agent session detail
  getAgentSession: async (agentId) => {
    const response = await apiClient.get(`/api/user/agent/sessions/${agentId}`)
    return response.data
  },

  // Send message to agent
  sendMessage: async (agentId, message) => {
    const response = await apiClient.post('/api/user/agent/message', {
      agentId,
      message,
    })
    return response.data
  },
}

