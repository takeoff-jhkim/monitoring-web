import { useState } from 'react'
import './HitlInteraction.css'

function HitlInteraction({ request, onResponse }) {
  const [inputValue, setInputValue] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (responseValue) => {
    setLoading(true)

    try {
      await onResponse(responseValue)
      setInputValue('')
      setSelectedOption('')
    } catch (error) {
      console.error('Failed to send response:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    let responseValue
    switch (request.type) {
      case 'approval':
        responseValue = inputValue
        break
      case 'selection':
        responseValue = selectedOption
        break
      case 'input':
      default:
        responseValue = inputValue
    }

    if (responseValue) {
      await handleSubmit(responseValue)
    }
  }

  const renderInput = () => {
    // Determine input type based on request.type
    const inputType = request.type

    switch (inputType) {
      case 'approval':
      case 'yes_no':
        return (
          <div className="approval-buttons">
            <button
              type="button"
              className="approve-btn yes-btn"
              onClick={() => handleSubmit('예')}
              disabled={loading}
            >
              예
            </button>
            <button
              type="button"
              className="reject-btn no-btn"
              onClick={() => handleSubmit('아니오')}
              disabled={loading}
            >
              아니오
            </button>
          </div>
        )

      case 'selection':
      case 'options':
        return (
          <div className="selection-options">
            {request.options?.map((option, index) => (
              <button
                key={index}
                type="button"
                className={`option-btn ${selectedOption === option ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedOption(option)
                  handleSubmit(option)
                }}
                disabled={loading}
              >
                {option}
              </button>
            ))}
          </div>
        )

      case 'input':
      case 'text':
      default:
        return (
          <form onSubmit={handleFormSubmit} className="input-form">
            <input
              type="text"
              className="text-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="응답을 입력하세요..."
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="submit-btn"
              disabled={!inputValue.trim() || loading}
            >
              {loading ? '전송 중...' : '전송'}
            </button>
          </form>
        )
    }
  }

  return (
    <div className="hitl-interaction">
      <div className="hitl-prompt">{request.prompt || '입력이 필요합니다.'}</div>
      {renderInput()}
    </div>
  )
}

export default HitlInteraction
