# Pluglink Web

React 기반 AI 에이전트 관리 웹 프론트엔드입니다. Docker를 사용하여 호스트 환경 오염 없이 개발할 수 있습니다.

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

## Monitoring Demo (Mock)

- `/systems` 페이지가 Redis heartbeat/status/agent_status/llm_usage/system_event 채널을 모사하는 **mock publisher**를 구동합니다.
- Mock 데이터는 Zustand 스토어에 적재되고 Recharts 기반 CPU/메모리/스토리지 실시간 차트, 상태/LLM Usage 패널, 이벤트 로그로 시각화됩니다.
- 실행 전 `npm install`로 새로 추가된 `recharts` 의존성을 설치한 뒤 `npm run dev`로 데모를 확인하세요.

## 빠른 시작

### 로컬 개발

```bash
# 개발 서버 시작
docker-compose up

# 백그라운드 실행
docker-compose up -d
```

웹 브라우저에서 `http://localhost:5173` 접속

### 환경 변수

`.env.local` 파일을 생성하여 환경 변수를 설정하세요:

```bash
VITE_API_URL=http://192.168.1.49:8080
VITE_WS_URL=ws://192.168.1.49:8080
```

## 📚 문서

- **[개발 가이드](docs/DEVELOPMENT.md)** - Docker 기반 개발 환경, 워크플로우, CI/CD

## 프로젝트 구조

```
pluglink-web/
├── src/                  # 소스 코드
│   ├── api/             # API 클라이언트
│   ├── components/      # React 컴포넌트
│   ├── pages/           # 페이지 컴포넌트
│   ├── store/           # 상태 관리 (Zustand)
│   └── utils/           # 유틸리티 함수
├── docs/                # 문서
│   └── DEVELOPMENT.md   # 개발 가이드
├── public/              # 정적 파일
├── Dockerfile           # 프로덕션 빌드용
├── Dockerfile.dev       # 로컬 개발용
├── docker-compose.yml   # 로컬 개발 환경
├── nginx.conf          # Nginx 설정 (프로덕션)
├── .gitlab-ci.yml      # CI/CD 파이프라인
└── package.json
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

## 배포 환경

- **Development**: https://pluglink-dev.take-off.kr
- **Staging**: https://pluglink-stage.take-off.kr
- **Production**: https://pluglink.take-off.kr

자세한 배포 정보는 [개발 가이드](docs/DEVELOPMENT.md)를 참조하세요.

## 트러블슈팅

상세한 트러블슈팅 가이드는 [개발 가이드](docs/DEVELOPMENT.md#트러블슈팅)를 참조하세요.

## 관련 프로젝트

- **GitOps Repository**: `gitlab.take-off.kr/infra/pluglink-web-gitops`
- **Backend API**: `gitlab.take-off.kr/infra/plugin-agent`

## 라이센스

이 프로젝트는 내부 사용 목적으로 제작되었습니다.
