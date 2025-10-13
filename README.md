# Agent Management Frontend

React 기반 에이전트 관리 웹 프론트엔드입니다. Docker를 사용하여 Node.js 설치 없이 개발 환경을 구성할 수 있습니다.

## 주요 기능

- **회원가입/로그인**: JWT 기반 인증
- **에이전트 목록**: 실행 중인 에이전트 세션 목록 조회
- **에이전트 생성**: 새로운 에이전트 인스턴스 생성
- **실시간 모니터링**: WebSocket을 통한 에이전트 상태 실시간 업데이트
- **HITL 인터랙션**: 에이전트의 사용자 입력 요청에 대한 실시간 응답
  - Approval (승인/거부)
  - Input (텍스트 입력)
  - Selection (옵션 선택)

## 기술 스택

- **React 18**: UI 라이브러리
- **Vite**: 빌드 도구
- **React Router**: 클라이언트 사이드 라우팅
- **Axios**: HTTP 클라이언트
- **Zustand**: 상태 관리
- **WebSocket**: 실시간 통신
- **Docker**: 개발 환경

## 시작하기

### 1. Docker Compose로 시작

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# Docker Compose로 컨테이너 실행
docker-compose up

# 백그라운드 실행
docker-compose up -d
```

웹 브라우저에서 `http://localhost:5173` 접속

### 2. 환경 변수 설정 (선택사항)

기본적으로 백엔드가 `localhost:8080`에서 실행 중이라고 가정합니다. 다른 주소를 사용하려면 `docker-compose.yml` 파일에서 환경 변수를 수정하세요:

```yaml
environment:
  - VITE_API_URL=http://your-backend-url:port
  - VITE_WS_URL=ws://your-backend-url:port
```

### 3. 개발 명령어

```bash
# 컨테이너 중지
docker-compose down

# 컨테이너 재시작
docker-compose restart

# 로그 확인
docker-compose logs -f

# 컨테이너에 접속하여 명령어 실행
docker-compose exec frontend sh
```

## 프로젝트 구조

```
frontend/
├── src/
│   ├── api/              # API 클라이언트
│   │   ├── client.js     # Axios 설정
│   │   ├── auth.js       # 인증 API
│   │   └── agent.js      # 에이전트 API
│   ├── components/       # 재사용 가능한 컴포넌트
│   │   └── HitlInteraction.jsx
│   ├── pages/            # 페이지 컴포넌트
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── AgentList.jsx
│   │   └── AgentDetail.jsx
│   ├── store/            # 상태 관리
│   │   └── authStore.js
│   ├── utils/            # 유틸리티
│   │   └── websocket.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── Dockerfile.dev        # 개발용 Dockerfile
├── docker-compose.yml    # Docker Compose 설정
├── package.json
└── vite.config.js
```

## API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인

### 에이전트
- `POST /api/user/agent/connection/link` - 에이전트 시스템 연결
- `POST /api/user/agent/execute` - 에이전트 실행
- `GET /api/user/agent/sessions` - 세션 목록 조회
- `GET /api/user/agent/sessions/:agentId` - 세션 상세 조회

### HITL
- `POST /api/hitl/response` - HITL 응답 전송

### WebSocket
- `WS /ws/agent?token=<JWT>` - 실시간 에이전트 통신

## WebSocket 메시지 프로토콜

### 클라이언트 → 서버

```javascript
// Agent 구독
{
  "type": "subscribe_agent",
  "agent_id": "agent-uuid"
}

// HITL 응답
{
  "type": "hitl_response",
  "request_id": "request-uuid",
  "response_type": "approval|input|selection",
  "response_data": { ... }
}

// Ping
{
  "type": "ping"
}
```

### 서버 → 클라이언트

```javascript
// Agent 상태 업데이트
{
  "type": "agent_status_update",
  "agent_id": "agent-uuid",
  "status": "ACTIVE|WAITING_USER_INPUT|COMPLETED|FAILED"
}

// Agent 메시지
{
  "type": "agent_message",
  "agent_id": "agent-uuid",
  "message": "..."
}

// HITL 요청
{
  "type": "hitl_request",
  "agent_id": "agent-uuid",
  "data": {
    "request_id": "request-uuid",
    "type": "approval|input|selection",
    "prompt": "...",
    "options": [...]  // selection type에만 해당
  }
}

// Pong
{
  "type": "pong"
}
```

## 개발 팁

### Hot Reload
파일을 수정하면 자동으로 브라우저가 새로고침됩니다. Docker volume을 사용하여 호스트의 파일 변경사항이 컨테이너에 즉시 반영됩니다.

### 디버깅
브라우저의 개발자 도구(F12)를 사용하여 콘솔 로그와 네트워크 요청을 확인할 수 있습니다.

### WebSocket 연결 확인
```javascript
// 브라우저 콘솔에서
wsManager.isConnected()  // true/false 반환
```

## 트러블슈팅

### Docker 컨테이너가 시작되지 않는 경우
```bash
# 기존 컨테이너와 볼륨 제거
docker-compose down -v

# 이미지 재빌드
docker-compose build --no-cache

# 다시 시작
docker-compose up
```

### WebSocket 연결 실패
- 백엔드 서버가 실행 중인지 확인
- `docker-compose.yml`의 `VITE_WS_URL`이 올바른지 확인
- JWT 토큰이 유효한지 확인 (로그아웃 후 재로그인)

### CORS 에러
- 백엔드 Spring Boot의 CORS 설정 확인
- `WebSocketConfig.java`의 `setAllowedOrigins` 확인

## 라이센스

이 프로젝트는 내부 POC 용도로 제작되었습니다.
