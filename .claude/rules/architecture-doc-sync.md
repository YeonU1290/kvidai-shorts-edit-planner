<!-- Source: https://github.com/epicmobile18/dev-standards/tree/main/dev-standards/.claude/rules/architecture-doc-sync.md -->
<!-- Version: 1.0.0 -->
<!-- Last Updated: 2026-08-19 -->

# Architecture Doc Sync Rules

**시스템 아키텍처에 영향을 주는 개발을 하면, 같은 작업에서 `docs/system-architecture.md` 도 갱신한다.**

canonical 전체 시스템 지도(`docs/system-architecture.md`)가 코드와 어긋나면, AI/개발자가 매번 잘못된 그림으로 헷갈린다. 아키텍처를 바꾸는 변경은 **코드 + 문서를 한 커밋/PR 에서** 같이 반영한다.

---

## ⛔ 언제 갱신하나 (트리거) — 해당하면 필수

| 개발 변경                                                                    | 갱신할 §섹션                    |
| ---------------------------------------------------------------------------- | ------------------------------- |
| **컴포넌트 추가/제거/이동** (`services/*`, `apps/*`, `packages/*` 신규·삭제) | §1 다이어그램, §3 컴포넌트 목록 |
| **도메인/엔드포인트 추가·변경** (새 도메인, APIM 경로 매핑, 새 API route)    | §2 도메인맵, §4 플로우          |
| **요청 흐름 변경** (경로·프록시·큐·워커 파이프라인)                          | §1 다이어그램, §4 생성요청      |
| **인증 방식 변경** (새 인증 계층·키·토큰 흐름)                               | §5 인증                         |
| **크레딧 모델 변경** (reserve/charge/refund 로직·시점)                       | §6 크레딧                       |
| **배포 토폴로지 변경** (호스트·포트·배포방식·신규 환경·LXD↔클라우드 이동)    | §8 배포                         |
| **외부 서비스 도입/제거** (fal.ai·APIM·결제·CDN·큐·검색 등)                  | §3 외부서비스, §9 저장소        |
| **데이터 저장소 변경** (DB·CDN·큐·캐시 추가/이동)                            | §9 저장소                       |
| **보류→활성 상태 전환** (§11 의 on-hold 항목이 실제 배포됨)                  | §3 상태, §11                    |

## ✅ 갱신 안 해도 되는 것 (트리거 아님)

- 인터페이스 동일한 내부 리팩터, UI/스타일, 버그픽스, 카피 수정
- 요청 body/응답이 그대로면(계약 불변) 폼·핸들러 내부 변경
- 잡 라이프사이클 **세부**(상태/취소/크레딧 semantics)는 `apps/web-service/docs/job-system-architecture.md` 소관 — 전체 그림이 안 바뀌면 system-architecture.md 는 그대로

> 서브모듈(web-service/strapi-ts 등) 안에서 작업해도 이 규칙 적용 — 문서는 **monorepo root `docs/system-architecture.md`** 하나다.

---

## 어떻게 갱신하나

1. **추측 금지 — 실제 값으로.** 새 도메인/포트/호스트/서비스는 코드·설정에서 확인한 값으로 쓴다. 확인 못 하면 **§11 "확인 필요/보류"** 에 명시(단정하지 말 것). 이게 이 문서의 신뢰성 원칙.
2. **해당 §섹션만 surgical 하게** 고친다. 무관한 곳 건드리지 않는다.
3. 상단 **`Last Updated`** 갱신.
4. 코드 변경과 **같은 커밋/PR** 에 포함. (별도로 미루면 drift 발생 → 규칙 무의미.)

## ✅ Correct

```
# services/ 에 새 서비스 추가 + system-architecture.md §3 표에 한 줄 + §1 다이어그램 반영
git add services/new-svc/ docs/system-architecture.md
git commit -m "feat: add new-svc; update system architecture doc"
```

## ❌ Prohibited

```
# 새 외부 서비스(예: 새 결제 게이트웨이) 도입했는데 문서는 그대로 → 다음 세션이 옛 그림으로 헷갈림
git commit -m "feat: integrate new payment provider"   # docs/system-architecture.md 누락
```

---

## 검증 (선택 — 커밋 전)

아키텍처 관련 경로를 건드렸는데 문서를 안 고쳤는지 셀프체크:

```bash
# 아키텍처 영향 가능 경로가 diff 에 있으면 system-architecture.md 도 있어야
git diff --name-only | grep -E '^(services/|infrastructure/(ansible|azure-apim|cloudflare)/|apps/[^/]+/src/api/)' \
  && git diff --name-only | grep -q 'docs/system-architecture.md' \
  || echo '⚠️ 아키텍처 경로 변경됨 — system-architecture.md 갱신 검토'
```

> 이 셀프체크를 **자동 리마인더**로 강제하려면 `.claude/settings.json` 에 Stop/PostToolUse hook 으로 걸 수 있다(선택).
