<!-- Source: epicmobile18/rules/contextual/README.md -->
<!-- Version: 1.0.0 -->
<!-- Last Updated: 2026-03-01 -->

# {PROJECT_NAME}

{프로젝트 한 줄 설명}

---

<!-- ============================================================ -->
<!-- 아래 두 섹션 중 프로젝트 유형에 맞는 것만 사용. 나머지는 삭제. -->
<!-- ============================================================ -->

## 주요 기능
<!-- 독립 앱 / 서브모듈일 때 사용. 모노레포 루트면 삭제. -->

- **{기능1}**: {설명}
- **{기능2}**: {설명}
- **{기능3}**: {설명}

## 구조
<!-- 모노레포일 때 사용. 독립 앱이면 삭제. -->

```
{project}/
├── apps/                    # Applications (git submodules)
│   ├── web-service/
│   ├── strapi-ts/
│   └── ...
├── services/                # Server-side infrastructure
│   └── ...
├── packages/                # Shared packages
│   ├── types/
│   └── ...
├── infrastructure/          # Infra code (Pulumi, Kamal, Docker, etc.)
└── docs/
```

## 프로젝트 구조
<!-- 독립 앱 / 서브모듈일 때 사용. 모노레포 루트면 삭제. -->

```
{project}/
├── src/
│   ├── app/                 # 라우팅 (Next.js App Router 등)
│   ├── components/          # UI 컴포넌트
│   └── lib/                 # 유틸리티, 서비스, 타입
├── public/
└── docs/
```

---

## 시작하기

### 사전 요구사항

- Node.js >= {version}
- pnpm >= {version} (모노레포) / npm (서브모듈)

### 설치

```bash
# 서브모듈 포함 클론 (모노레포)
git clone --recursive {repo-url}
git submodule update --init --recursive

# 의존성 설치
pnpm install   # 모노레포
npm install    # 독립 앱
```

### 환경 변수 설정

```bash
cp .env.example .env.local
# .env.local 파일에서 필요한 값 설정
```

주요 환경 변수:

| 변수 | 설명 | 예시 |
|------|------|------|
| `{ENV_VAR_1}` | {설명} | `{예시값}` |
| `{ENV_VAR_2}` | {설명} | `{예시값}` |

### 개발 서버 실행

```bash
# 모노레포 - 전체
pnpm dev

# 모노레포 - 특정 앱
pnpm --filter {app-name} dev

# 독립 앱
npm run dev
# → http://localhost:3000
```

### 빌드 & 테스트

```bash
# 빌드
pnpm build        # 모노레포
npm run build     # 독립 앱

# 테스트
pnpm test                    # 전체
pnpm test:integration        # 통합 테스트
npm run lint && npm run typecheck
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Language | TypeScript |
| Framework | {Next.js / Strapi / ...} |
| Package Manager | pnpm (모노레포) / npm |
| Styling | {Tailwind CSS / shadcn/ui / ...} |
| State | {Zustand / ...} |
| Deploy | {Netlify / Vercel / Kamal / ...} |

---

## Submodules
<!-- 모노레포일 때 사용. 독립 앱이면 삭제. -->

| Path | Description |
|------|-------------|
| `apps/web-service` | Next.js 웹 앱 |
| `apps/strapi-ts` | Strapi CMS 백엔드 |
| `apps/{name}` | {설명} |

---

## 배포

```bash
# Production 빌드
npm run build:prod

# 배포
{배포 명령어 또는 CI/CD 안내}
```

---

## 기여하기

1. Feature Branch 생성 (`git checkout -b feature/{name}`)
2. 변경 사항 커밋 (`git commit -m 'feat: {description}'`)
3. Branch Push (`git push origin feature/{name}`)
4. Pull Request 생성

커밋 메시지 규칙: `.claude/rules/git-commit-rules.md` 참조

---

## License

© {YEAR} {ORGANIZATION}. All rights reserved.
See [LICENSE](LICENSE) for details.

---

## 참고 문서

- AI Agent 가이드: `CLAUDE.md`
- 개발 문서: `docs/`
- {추가 참고 링크}
