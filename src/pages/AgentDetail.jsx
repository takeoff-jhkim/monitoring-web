import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { agentApi } from '../api/agent'
import { wsManager } from '../utils/websocket'
import { useAuthStore } from '../store/authStore'
import HitlInteraction from '../components/HitlInteraction'
import './AgentDetail.css'

function AgentDetail() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const [session, setSession] = useState(null)
  const [detail, setDetail] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [hitlRequest, setHitlRequest] = useState(null)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Connect WebSocket when entering agent detail page
    if (token) {
      wsManager.connect(token)
    }

    loadSession()
    subscribeToAgent()

    // Listen for WebSocket events
    const handleAgentUpdate = (message) => {
      if (message.agent_id === agentId) {
        if (message.type === 'agent_status_update') {
          setSession((prev) => ({ ...prev, status: message.status }))
          addMessage({
            type: 'system',
            content: `상태 변경: ${getStatusText(message.status)}`,
            timestamp: new Date().toISOString(),
          })
        }
      }
    }

    const handleAgentMessage = (message) => {
      if (message.agent_id === agentId) {
        addMessage({
          type: 'agent',
          content: message.message,
          timestamp: new Date().toISOString(),
        })
      }
    }

    const handleHitlRequest = (message) => {
      if (message.agent_id === agentId) {
        setHitlRequest(message.data)
      }
    }

    const handleAgentResponse = (message) => {
      if (message.agent_id === agentId && message.message) {
        addMessage({
          type: message.message.role === 'HumanMessage' ? 'user' : 'agent',
          content: message.message.content,
          timestamp: message.timestamp || new Date().toISOString(),
        })
      }
    }

    wsManager.on('agent_status_update', handleAgentUpdate)
    wsManager.on('agent_message', handleAgentMessage)
    wsManager.on('hitl_request', handleHitlRequest)
    wsManager.on('agent_response', handleAgentResponse)

    return () => {
      // Cleanup: remove event listeners
      wsManager.off('agent_status_update', handleAgentUpdate)
      wsManager.off('agent_message', handleAgentMessage)
      wsManager.off('hitl_request', handleHitlRequest)
      wsManager.off('agent_response', handleAgentResponse)

      // Disconnect WebSocket when leaving agent detail page
      wsManager.disconnect()
    }
  }, [agentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadSession = async () => {
    try {
      const data = await agentApi.getAgentSession(agentId)
      setSession(data.session)
      setDetail(data.detail)

      // Extract messages from detail
      if (data.detail?.messages) {
        const formattedMessages = data.detail.messages.map((msg) => ({
          type: msg.role === 'HumanMessage' ? 'user' : 'agent',
          content: msg.content,
          timestamp: new Date().toISOString(),
        }))
        setMessages(formattedMessages)
      }

      // Check if input is required (HITL)
      if (data.detail?.input_required && data.detail.status === 'WAITING_USER_INPUT') {
        setHitlRequest({
          request_id: agentId,
          type: data.detail.input_required.type,
          prompt: data.detail.input_required.prompt,
          options: data.detail.input_required.options,
          timeout: data.detail.input_required.timeout,
        })
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      alert('세션을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToAgent = () => {
    wsManager.subscribeToAgent(agentId)
  }

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message])
  }

  const handleHitlResponse = async (responseData) => {
    try {
      await agentApi.sendMessage(agentId, responseData)
      setHitlRequest(null)
      addMessage({
        type: 'user',
        content: responseData,
        timestamp: new Date().toISOString(),
      })
      // Reload session to get updated status
      setTimeout(() => loadSession(), 1000)
    } catch (error) {
      alert('응답 전송에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() || sending) return

    const userMessage = messageInput.trim()
    setMessageInput('')
    setSending(true)

    addMessage({
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    })

    try {
      await agentApi.sendMessage(agentId, userMessage)
      // Reload session to get updated status and response
      setTimeout(() => loadSession(), 1000)
    } catch (error) {
      alert('메시지 전송에 실패했습니다: ' + (error.response?.data?.message || error.message))
    } finally {
      setSending(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return '#4caf50'
      case 'WAITING_USER_INPUT':
        return '#ff9800'
      case 'COMPLETED':
        return '#2196f3'
      case 'FAILED':
        return '#f44336'
      default:
        return '#9e9e9e'
    }
  }

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return '실행 중'
      case 'WAITING_USER_INPUT':
        return '입력 대기'
      case 'COMPLETED':
        return '완료'
      case 'FAILED':
        return '실패'
      default:
        return status || '알 수 없음'
    }
  }

  if (loading) {
    return (
      <div className="agent-detail-container">
        <div className="loading">로딩 중...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="agent-detail-container">
        <div className="error">세션을 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="agent-detail-container">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 목록으로
        </button>
        <div className="header-info">
          <h1>{session.agentName || agentId}</h1>
          {session.agentName && (
            <span style={{ fontSize: '0.9rem', color: '#666', marginLeft: '0.5rem' }}>
              ({agentId})
            </span>
          )}
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(session.status) }}
          >
            {getStatusText(session.status)}
          </span>
        </div>
      </header>

      <div className="detail-content">
        <div className="session-info-panel">
          <div className="info-item">
            <label>시스템</label>
            <span>{session.system_name || 'Plugin Agent'}</span>
          </div>
          <div className="info-item">
            <label>생성 시간</label>
            <span>{session.createdAt ? new Date(session.createdAt).toLocaleString('ko-KR') : '-'}</span>
          </div>
          {session.updatedAt && (
            <div className="info-item">
              <label>최종 업데이트</label>
              <span>{new Date(session.updatedAt).toLocaleString('ko-KR')}</span>
            </div>
          )}
          {detail?.created_at && (
            <div className="info-item">
              <label>Plugin-Agent 생성 시간</label>
              <span>{new Date(detail.created_at).toLocaleString('ko-KR')}</span>
            </div>
          )}
        </div>

        <div className="messages-panel">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-messages">메시지가 없습니다.</div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message message-${msg.type}`}>
                  <div className="message-header">
                    <span className="message-type">
                      {msg.type === 'agent'
                        ? 'Agent'
                        : msg.type === 'user'
                        ? 'You'
                        : 'System'}
                    </span>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString('ko-KR')}
                    </span>
                  </div>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Show HITL interaction or regular message input based on status */}
          {hitlRequest ? (
            <div className="hitl-panel">
              <HitlInteraction request={hitlRequest} onResponse={handleHitlResponse} />
            </div>
          ) : (
            <form className="message-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="message-input"
                placeholder="메시지를 입력하세요..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="send-button" disabled={sending || !messageInput.trim()}>
                {sending ? '전송 중...' : '전송'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgentDetail
