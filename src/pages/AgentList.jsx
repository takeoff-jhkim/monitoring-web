import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { agentApi } from '../api/agent'
import './AgentList.css'

function AgentList() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [command, setCommand] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await agentApi.listAgentSessions()
      setSessions(data.sessions || [])
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async () => {
    if (!command.trim()) return

    setCreating(true)
    try {
      const data = await agentApi.executeAgent(command)
      setShowCreateModal(false)
      setCommand('')
      loadSessions()
      // Navigate to new agent detail
      if (data.agent_id) {
        navigate(`/agent/${data.agent_id}`)
      }
    } catch (error) {
      alert('에이전트 생성에 실패했습니다: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreating(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
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
      case 'SYNC_ERROR':
        return '#e91e63'
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
      case 'SYNC_ERROR':
        return '동기화 오류'
      default:
        return status || '알 수 없음'
    }
  }

  const getSyncStatusBadge = (syncStatus) => {
    switch (syncStatus) {
      case 'SYNCED':
        return { text: '동기화됨', color: '#4caf50', icon: '✓' }
      case 'COMPLETED':
        return { text: '완료됨', color: '#2196f3', icon: '✓' }
      case 'OUT_OF_SYNC':
        return { text: '동기화 실패', color: '#f44336', icon: '⚠' }
      case 'UNKNOWN':
        return { text: '상태 확인 불가', color: '#ff9800', icon: '?' }
      default:
        return null
    }
  }

  return (
    <div className="agent-list-container">
      <header className="header">
        <h1>Agent Management</h1>
        <div className="header-actions">
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            + 새 에이전트
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <div className="container">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <p>생성된 에이전트가 없습니다.</p>
            <button onClick={() => setShowCreateModal(true)}>첫 에이전트 생성하기</button>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessions.map((session) => {
              const syncBadge = getSyncStatusBadge(session.syncStatus)
              return (
                <div
                  key={session.agentId}
                  className={`session-card ${session.syncStatus === 'OUT_OF_SYNC' ? 'sync-error' : ''}`}
                  onClick={() => navigate(`/agent/${session.agentId}`)}
                >
                  <div className="session-header">
                    <h3>{session.agentName || session.agentId}</h3>
                    <div className="badges">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(session.status) }}
                      >
                        {getStatusText(session.status)}
                      </span>
                      {syncBadge && (
                        <span
                          className="sync-badge"
                          style={{
                            backgroundColor: syncBadge.color,
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            color: 'white',
                            marginLeft: '0.5rem'
                          }}
                          title={syncBadge.text}
                        >
                          {syncBadge.icon}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="session-info">
                    {session.agentName && (
                      <p className="agent-id" style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.3rem' }}>
                        ID: {session.agentId}
                      </p>
                    )}
                    <p className="system-name">{session.agentSystemName || 'Plugin Agent'}</p>
                    <p className="timestamp">
                      생성: {new Date(session.createdAt).toLocaleString('ko-KR')}
                    </p>
                    {session.updatedAt && (
                      <p className="timestamp">
                        업데이트: {new Date(session.updatedAt).toLocaleString('ko-KR')}
                      </p>
                    )}
                    {session.syncStatus === 'OUT_OF_SYNC' && (
                      <p className="sync-warning" style={{ color: '#f44336', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        ⚠ 이 에이전트는 동기화 오류가 있습니다
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>새 에이전트 생성</h2>
            <div className="form-group">
              <label>명령어</label>
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="에이전트에게 실행할 작업을 입력하세요..."
                rows={4}
                disabled={creating}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} disabled={creating}>
                취소
              </button>
              <button
                onClick={handleCreateAgent}
                className="primary"
                disabled={!command.trim() || creating}
              >
                {creating ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentList
