# Pluglink Web - 개발 가이드

## 개발 환경 철학

이 프로젝트는 **호스트 환경 오염 방지**를 위해 Docker만 사용하여 개발, 빌드, 테스트를 진행합니다.
Node.js나 npm을 호스트에 직접 설치하지 않습니다.

## 로컬 개발 환경 설정

### 필수 요구사항

- Docker
- Docker Compose

### 로컬 개발 서버 실행

```bash
# 개발 서버 시작 (Hot Module Replacement 지원)
docker-compose up

# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

개발 서버는 http://localhost:5173 에서 실행됩니다.

### 환경 변수 설정

로컬 개발용 환경 변수는 `.env.local` 파일에 설정:

```bash
# .env.local
VITE_API_URL=http://192.168.1.49:8080
VITE_WS_URL=ws://192.168.1.49:8080
```

## Docker를 사용한 개발 작업

### npm 명령어 실행

```bash
# 의존성 설치
docker-compose run --rm frontend npm install

# 패키지 추가
docker-compose run --rm frontend npm install <package-name>

# 개발 의존성 추가
docker-compose run --rm frontend npm install --save-dev <package-name>

# 패키지 제거
docker-compose run --rm frontend npm uninstall <package-name>

# 빌드
docker-compose run --rm frontend npm run build

# 린팅
docker-compose run --rm frontend npm run lint
```

### 프로덕션 빌드 테스트

```bash
# 프로덕션 Docker 이미지 빌드
docker build -t pluglink-web:test .

# 로컬에서 프로덕션 이미지 실행
docker run -p 8080:80 pluglink-web:test

# 브라우저에서 http://localhost:8080 접속
```

## 파일 및 디렉토리 구조

```
pluglink-web/
├── src/                    # 소스 코드
│   ├── api/               # API 호출
│   ├── components/        # React 컴포넌트
│   ├── pages/            # 페이지 컴포넌트
│   └── main.jsx          # 엔트리 포인트
├── public/                # 정적 파일
├── .env.example          # 환경 변수 예제
├── .env.local            # 로컬 환경 변수 (git ignore)
├── package.json          # 프로젝트 의존성
├── Dockerfile            # 프로덕션 빌드용 (CI/CD)
├── Dockerfile.dev        # 로컬 개발용
├── docker-compose.yml    # 로컬 개발 환경
├── nginx.conf           # Nginx 설정 (프로덕션)
├── vite.config.js       # Vite 설정
└── .gitlab-ci.yml       # CI/CD 파이프라인

# 이 파일들은 로컬 개발용이며, CI/CD에서는 사용되지 않음:
- .env.local
- .env.example
- docker-compose.yml
- Dockerfile.dev
```

## CI/CD 파이프라인

### 브랜치 전략

- `dev` → Dev 환경 자동 배포
- `stage` → Stage 환경 자동 배포
- `main` (with tag) → Prod 환경 자동 배포

### 파이프라인 단계

1. **Validate** (MR only): 빌드 검증, 린팅
2. **Detect Changes**: 변경사항 감지
3. **Build**: Docker 이미지 빌드 및 Nexus 푸시
4. **Deploy GitOps**: GitOps 저장소 업데이트 → ArgoCD 자동 배포

### 이미지 태그 규칙

- Dev: `dev-YYYYMMDD-{commit-sha}`
- Stage: `stage-YYYYMMDD-{commit-sha}`
- Prod: `v{version}-YYYYMMDD-{commit-sha}`

## 배포 환경

### Development (dev)
- **URL**: https://pluglink-dev.take-off.kr
- **API**: https://api-dev.take-off.kr
- **자동 배포**: `dev` 브랜치 푸시 시

### Staging (stage)
- **URL**: https://pluglink-stage.take-off.kr
- **API**: https://api-stage.take-off.kr
- **자동 배포**: `stage` 브랜치 푸시 시

### Production (prod)
- **URL**: https://pluglink.take-off.kr
- **API**: https://api.take-off.kr
- **자동 배포**: `main` 브랜치 태그 푸시 시

## 환경 변수

### 빌드 시 주입되는 환경 변수

배포 환경별로 K8s ConfigMap을 통해 주입:

```yaml
# Development
VITE_API_URL: "https://api-dev.take-off.kr"
VITE_WS_URL: "wss://api-dev.take-off.kr"

# Staging
VITE_API_URL: "https://api-stage.take-off.kr"
VITE_WS_URL: "wss://api-stage.take-off.kr"

# Production
VITE_API_URL: "https://api.take-off.kr"
VITE_WS_URL: "wss://api.take-off.kr"
```

## 트러블슈팅

### Docker 관련 문제

```bash
# Docker 컨테이너 재시작
docker-compose restart

# 이미지 재빌드 (캐시 무시)
docker-compose build --no-cache

# 모든 컨테이너와 볼륨 삭제
docker-compose down -v

# 사용하지 않는 이미지 정리
docker system prune -a
```

### 포트 충돌

5173 포트가 이미 사용 중인 경우:

```yaml
# docker-compose.yml 수정
ports:
  - "3000:5173"  # 또는 다른 포트
```

### node_modules 권한 문제

Docker 볼륨을 사용하므로 호스트의 node_modules는 무시됩니다.
Docker 컨테이너 내부에서만 node_modules가 관리됩니다.

## 개발 워크플로우

### 새 기능 개발

1. 로컬에서 개발 서버 실행
   ```bash
   docker-compose up
   ```

2. 코드 수정 (HMR 자동 반영)

3. 빌드 테스트
   ```bash
   docker-compose run --rm frontend npm run build
   ```

4. 커밋 및 푸시
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

5. Merge Request 생성
   - 자동으로 빌드 검증 실행

6. MR 승인 및 머지
   - 자동으로 dev 환경에 배포

### 프로덕션 배포

1. Stage 환경에서 테스트
   ```bash
   git checkout stage
   git merge dev
   git push origin stage
   ```

2. 확인 후 프로덕션 배포
   ```bash
   git checkout main
   git merge stage
   git tag v1.0.0
   git push origin main --tags
   ```

## 참고 자료

- **GitOps Repository**: `gitlab.take-off.kr/infra/pluglink-web-gitops`
- **Backend API**: `gitlab.take-off.kr/infra/plugin-agent`
- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/
