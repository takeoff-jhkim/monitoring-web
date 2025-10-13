import { ENV } from '../config/env'

const WS_URL = ENV.WS_URL || 'ws://localhost:8080'

class WebSocketManager {
  constructor() {
    this.ws = null
    this.reconnectInterval = 3000
    this.reconnectTimer = null
    this.listeners = new Map()
    this.connected = false
    this.shouldReconnect = true
  }

  connect(token) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    this.shouldReconnect = true
    const wsUrl = `${WS_URL}/ws/agent?token=${token}`
    console.log('Connecting to WebSocket:', wsUrl)
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully')
      this.connected = true
      this.clearReconnectTimer()

      // Send ping every 30 seconds
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.send({ type: 'ping' })
        }
      }, 30000)
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.notifyListeners(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      console.error('WebSocket readyState:', this.ws?.readyState)
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.connected = false
      if (this.pingInterval) {
        clearInterval(this.pingInterval)
      }
      // Only reconnect if it wasn't a manual disconnect
      if (this.shouldReconnect) {
        this.scheduleReconnect(token)
      }
    }
  }

  scheduleReconnect(token) {
    this.clearReconnectTimer()
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...')
      this.connect(token)
    }, this.reconnectInterval)
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected')
    }
  }

  subscribeToAgent(agentId) {
    this.send({
      type: 'subscribe_agent',
      agent_id: agentId,
    })
  }

  sendHitlResponse(requestId, responseType, responseData) {
    this.send({
      type: 'hitl_response',
      request_id: requestId,
      response_type: responseType,
      response_data: responseData,
    })
  }

  sendAgentMessage(agentId, message) {
    this.send({
      type: 'agent_message',
      agent_id: agentId,
      message,
    })
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType).push(callback)
  }

  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  notifyListeners(message) {
    const { type } = message
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => callback(message))
    }
    // Also notify 'all' listeners
    if (this.listeners.has('all')) {
      this.listeners.get('all').forEach(callback => callback(message))
    }
  }

  disconnect() {
    this.shouldReconnect = false
    this.clearReconnectTimer()
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connected = false
    this.listeners.clear()
  }

  isConnected() {
    return this.connected
  }
}

export const wsManager = new WebSocketManager()
