# GitHub Private Registry — Import, Build, Deploy

GitHub Packages (`@epicmobile18` scope)에서 private npm 패키지를 설치하고, Docker build하고, Cloud Run에 배포하는 방법.

> publish 방법은 `docs/github-packages-publish.md` 참조.

---

## 핵심 구조

```
root .npmrc
  @epicmobile18:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

- root `.npmrc`에 이미 설정됨 → 모노레포 내 모든 app/package가 상속
- **GITHUB_TOKEN 하나**로 로컬 개발 + Docker build + CI 모두 처리
- CI (GitHub Actions): `GITHUB_TOKEN`이 자동 제공 → 추가 설정 불필요

---

## 로컬 개발 (pnpm install)

```bash
# 1. gh CLI 로그인 확인
gh auth status

# 2. .env에 GITHUB_TOKEN 추가 (AI에게 시켜도 됨)
echo "GITHUB_TOKEN=$(gh auth token)" >> .env   # 또는 직접 편집

# 3. 설치
pnpm install
```

AI에게 시키는 방법:
```
"gh CLI 로그인 되어 있으니 .env 파일에 GITHUB_TOKEN 추가해줘"
```
→ AI가 `gh auth token` 결과를 읽어 `.env`에 `GITHUB_TOKEN=ghp_xxx` 추가.

---

## Docker Build

Dockerfile은 **BuildKit secret 방식**을 사용 — GITHUB_TOKEN이 이미지 레이어에 포함되지 않음.

```bash
# strapi-ts: package.json 스크립트에 --secret 플래그 이미 포함
cd apps/strapi-ts
npm run docker-build:staging   # = docker build --secret id=build_env,src=.env ...
npm run docker-build:prod

# Mac (cross-platform build)
npm run docker-build-mac:staging
```

**전제조건**: `.env`에 `GITHUB_TOKEN=ghp_xxx` 있어야 함.

직접 실행 시 형식:
```bash
docker build --secret id=build_env,src=.env \
  --target production \
  --build-arg NODE_ENV=staging \
  -t my-image:staging .
```

Dockerfile 내 처리 방식 (참고용):
```dockerfile
RUN --mount=type=secret,id=build_env \
    if [ -f /run/secrets/build_env ]; then \
      export GITHUB_TOKEN="$(grep -E '^GITHUB_TOKEN=' /run/secrets/build_env | head -1 | cut -d= -f2-)"; \
    fi && \
    npm ci
```

---

## Cloud Run Deploy

GITHUB_TOKEN은 **build time에만 필요** → Cloud Run 런타임 환경변수에 추가 불필요.

```bash
# 상세 배포 절차: docs/google-cloud-deployment.md 참조
gcloud run deploy staging \
  --image asia-docker.pkg.dev/kidskid-19/asia.gcr.io/kvidai-strapi-ts:staging \
  --region asia-northeast3 \
  ...
```

---

## 신규 app/package에 private registry 패키지 추가 시

### 1. package.json에 npm alias로 추가

```json
{
  "dependencies": {
    "@kvidai/types": "npm:@epicmobile18/kvidai-types@^0.1.0",
    "@kvidai/agent": "npm:@epicmobile18/kvidai-agent@^0.0.1"
  }
}
```

import는 내부명 그대로:
```typescript
import type { User } from '@kvidai/types';
```

### 2. .npmrc 확인

root `.npmrc`에 이미 설정됨 → **앱별 `.npmrc` 추가 불필요**.

단, 앱이 별도 repo(서브모듈)로 독립 운영된다면 해당 repo에 아래 추가:
```ini
@epicmobile18:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### 3. Dockerfile에 BuildKit secret 적용

신규 앱의 Dockerfile deps 단계에 추가:
```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=secret,id=build_env \
    if [ -f /run/secrets/build_env ]; then \
      export GITHUB_TOKEN="$(grep -E '^GITHUB_TOKEN=' /run/secrets/build_env | head -1 | cut -d= -f2-)"; \
    fi && \
    npm ci
```

`docker build` 명령에 `--secret id=build_env,src=.env` 추가.

---

## Troubleshooting

| 에러 | 원인 | 해결 |
|------|------|------|
| `401 Unauthorized` during npm install | GITHUB_TOKEN 미설정 또는 만료 | `.env`에 `GITHUB_TOKEN=$(gh auth token)` 추가 |
| `npm ERR! 403` during docker build | `--secret id=build_env,src=.env` 누락 | docker build 명령에 secret 플래그 추가 |
| `read:packages scope 없음` | gh CLI 토큰 권한 부족 | `gh auth refresh -s read:packages` |
| CI에서 실패 | GITHUB_TOKEN 미제공 | Actions에서 자동 제공됨 — ci.yml `setup-node`에 `registry-url` 있는지 확인 |
