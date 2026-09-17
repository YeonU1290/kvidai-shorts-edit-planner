---
title: plan-sample
description: plan파일 sample내용
created: 2026-08-27
last_updated: 2026-08-27
version: v1.0.0
status: todo
test_artifacts: tests/
---

# 쿠폰/프로모션 시스템 — 타당성 검토 + 최소 설계

## Changelog

| Date       | Version | Changes                                                                 | Directory                        | Author |
| ---------- | ------- | ----------------------------------------------------------------------- | -------------------------------- | ------ |
| 2026-08-27 | v1.0.0  | 최초 작성 — build vs buy 검토 + 최소 설계 + Phase 0 falsy-zero 버그 발견 | /home/ubuntu/code_workspace/kvidai | kincjf |
| 2026-08-27 | v1.1.0  | Strapi 연동 제약 해제 후 self-hosted OSS 재조사 (진행 중)               | /home/ubuntu/code_workspace/kvidai | kincjf |

---

## Context (왜 이 검토를 하는가)

제기된 문제 3가지:

1. **credit SKU 만으로는 표현력이 부족** — `product-list` 행 추가는 "credit 을 얼마에 판다" 외의 action 을 만들 수 없다. 할인율이 유일한 변수.
2. **신규 가입자 무료 credit 지급이 어차피 필요** — 쿠폰은 이미 예정된 요구사항.
3. **결제(Dodo)와 이벤트 로직이 강결합 → QA 에 실제 돈이 든다** — hypeagent 1개월/1년 예약 SKU 를 `product-list` 행으로 만들면 real 디버그 테스트마다 실결제 필요.

**목적**: build vs buy 판단 + 채택 시 최소 설계 확정. 구현은 별도 승인.

**⛔ 결론 먼저**: 문제 3은 **쿠폰 시스템 없이 오늘 해결 가능**하다 (Phase 0 참조). 쿠폰은 문제 1·2 때문에 별도로 필요한 것이고, 두 문제를 묶어서 판단하면 안 된다.

---

## 결론 1 — Dodo 100% 할인코드로 실결제 QA 문제는 코드 0줄로 해결

Dodo Payments 에 **discount code CRUD API 가 이미 존재**한다 ([docs](https://docs.dodopayments.com/features/discount-codes)) — `Create/Get/Update/Delete Discount`, `Get Discount by Code`, `List/Add/Remove Discount Customers`.

| 기능                        | 지원                                                                |
| --------------------------- | ------------------------------------------------------------------- |
| type                        | `percentage` (basis points, `1500`=15%) / `flat`                    |
| **100% 할인 / $0 결제**     | **지원** (changelog v1.30.0, v1.52.4)                               |
| 사용 한도                   | 전체 한도 + **고객당 한도**                                         |
| 고객 자격                   | `any` / **`first_time`** / `existing` / `specific`(allowlist)       |
| 기타                        | 상품 제한, 유효기간, 구독 사이클 수 제한, `metadata`, 최대 20개 스택 |

→ **admin 이 100% 할인코드를 만들어 두면, 실제 checkout → webhook → `order-list` 생성 전체 경로를 $0 로 반복 테스트**할 수 있다. hypeagent 예약 SKU 도 마찬가지.

**단, Dodo 의 명시적 한계** (문서 원문): *"Discount codes function exclusively as purchase price reductions. They cannot grant arbitrary entitlements, credits, or non-monetary benefits."* → 구매 밖에서 credit 을 주거나 기능을 켜는 건 불가. 요구사항 (a)(b)(c) 는 여전히 자체 구현 필요.

### ⛔ Phase 0 을 막는 기존 버그 — falsy-zero (코드 확인 완료)

`apps/strapi-ts/src/api/hook/services/hook.ts:259`:

```ts
if (!payment_id || !total_amount || !currency) {
    throw new Error('Missing required data fields: payment_id, total_amount, currency');
}
```

**100% 할인이면 `total_amount === 0` 이고 JS 에서 `!0 === true`** → 이 가드가 발동해 **throw → 웹훅 500 → Dodo 무한 재시도 → credit 영원히 미부여**. 즉 지금 상태로는 $0 결제가 절대 성공하지 않는다.

수정은 한 줄: `total_amount == null` (또는 `typeof total_amount !== 'number'`) 로 바꿔 **"없음"과 "0"을 구분**해야 한다. `payment_id`/`currency` 는 문자열이라 현행 유지 가능.

> `.claude/rules/testing-conventions-critical.md` 의 "Bug Fix Requires Test Update" 적용 대상 — 수정 시 `total_amount: 0` 웹훅이 정상 처리되는 회귀 테스트를 같은 커밋에 포함할 것.

**⚠️ 추가 검증 필요 (단정 금지)**: 위를 고쳐도 100% 할인 시 웹훅이 **`product_cart` 를 포함해서** 오는지는 미확인. 같은 함수(line ~270)가 `product_cart` 가 비면 credit 부여 없이 **조용히 skip**(`success: true` 반환) 한다. cart 가 비어 오면 Phase 0 은 성립하지 않으므로 **실제 $0 결제 1건으로 반드시 확인**할 것.

---

## 결론 2 — 외부 솔루션 도입은 명확히 손해. 자체 구현이 정답.

### Strapi 플러그인 생태계: 사실상 없음

- **공식 Marketplace: `coupon`/`discount`/`promotion`/`voucher` 검색 결과 전부 0건.**
- npm 유일 후보 `mumz-strapi-plugin-coupon` (v3.2.2, 2026-05-12, MIT, Strapi v5 호환) — 그러나:
  - **월 42 다운로드**, GitHub repo 404 (private/삭제) → 감사 불가
  - 사용자 식별자가 **전화번호** (Strapi user 관계 아님)
  - 모델이 `orderAmount → discountAmount` 뿐 — **credit/엔타이틀먼트 개념 자체가 없음**
  - README 상 **모든 라우트 기본 `auth: false`** (`POST /`, `DELETE /:id`, `bulk-create` 포함) → 과금 인접 상태에 두기엔 위험
- `strapi-commerce`(13★, 2021년 v3), `webbycommerce`(스토어프론트 전체, 쿠폰 키워드 없음) — 해당 없음.

### 독립 오픈소스 쿠폰 엔진: 이 카테고리가 OSS 에 존재하지 않음

GitHub `coupon engine stars:>200` → **0건**, `promotion engine stars:>200` → **0건**.

| 제품             | 라이선스  | self-host | 쿠폰 부분만 독립 사용   | 비고                                             |
| ---------------- | --------- | --------- | ----------------------- | ------------------------------------------------ |
| Voucherify       | 폐쇄      | ❌ SaaS   | —                       | **€600/mo** 부터(25k calls/mo), 영구 무료 없음   |
| Talon.One        | 폐쇄      | ❌ SaaS   | —                       | SDK 만 OSS                                       |
| Medusa promotion | MIT       | ✅        | ⚠️ `@medusajs/framework` 런타임 필요 | cart/line-item 모델, credit 개념 없음 |
| Lago             | AGPL-3.0  | ✅        | ⚠️ 쿠폰=인보이스 할인만 | wallet/prepaid-credit 은 **별도 서브시스템**     |
| Saleor / Vendure / Sylius | OSS | ✅      | ❌ Order 에 결합        | 플랫폼 통째 도입해야                             |
| Kill Bill        | Apache-2  | ✅        | ❌                      | 쿠폰 개념 자체가 없음                            |

**핵심**: 요구사항 4개 중 3개가 **엔타이틀먼트/크레딧 원장 문제**지 할인 계산 문제가 아니다. 위 OSS 는 전부 "장바구니 할인 계산"을 푼다 — **그건 이미 Dodo 가 해준다**. 정작 필요한 부분은 아무도 안 풀어준다.

**Voucherify 도입 시 실제 비용**: €7,200/년 + 신원 동기화 + 웹훅 리시버 + **여전히 자체 credit 원장/엔타이티먼트 리졸버를 직접 작성** + 가입·기능게이팅이 서드파티 HTTP 에 의존(캐싱/타임아웃/degraded path 추가 필요). → 자체 구현보다 **코드가 더 늘고 돈도 든다.**

### 2026-08-27 재조사 — "Strapi 연동 아니어도 됨(별도 self-hosted 서비스 + HTTP 호출)" 제약 완화 후

결론은 바뀌지 않았고, 오히려 **근거가 더 강해졌다** — 이전엔 "대안이 없어서" build 였다면, 이번엔 **이미 갖고 있는 게 대안들보다 낫다**는 걸 확인했다.

**결정적 사실(자체 코드 재확인)**: `order_lists` 스키마가 이미 `credit`/`total_credit`/`purpose`/`expiration_date` 를 **행 단위**로 갖고 있고, 소비 경로 8곳+ (`speech-to-text`, `voice-generation`, `video-generation`, `fal-ai-worker`, `customApi`, `user-task-service`, `credit-management`, `credit`) 이 전부 `expiration_date >= now` 필터 + `expiration_date ASC` FIFO 로 이미 이 모델을 존중한다. 즉 **"발급건별 만료 credit"은 이미 프로덕션에서 동작 중인 기능**이고, 쿠폰은 이 파이프라인에 행 하나 추가하는 것뿐이다.

| 카테고리                          | 대표                                                                 | 판정                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Open Loyalty**                  | openloyalty.io                                                         | **OSS 판 자체가 없음** — 공식 pricing 페이지에 "SaaS only" 명시. 유일 오픈소스 저장소는 404(삭제), 잔존 fork 는 2020년 이후 방치 |
| **Feature-flag 플랫폼**           | Unleash(13,762★), Flagsmith(6,530★), GrowthBook(8,160★), Flipt(4,883★) | **구조적으로 (c) 에 안 맞음** — 이들은 "세그먼트 S 에 전역 기간 동안 켜짐"을 표현한다. (b)+(c) 조합인 "유저별 자기 redeem 시점 기준 N일"은 유저 1명=세그먼트 1개가 되어 Unleash OSS 기본 세그먼트 한도(300)에 부딪힘. `user_entitlements(user_id, feature, starts_at, ends_at)` 테이블 하나가 인덱스 쿼리 1번으로 더 정확히 표현 |
| **커머스 플랫폼 headless 프로모션 전용 사용** | Medusa v2, Saleor, Vendure, Sylius, Spree, Solidus, Bagisto, EverShop, Shopware (9개 전수 조사) | **전부 기각** — 프로모션 엔진이 장바구니/주문 컨텍스트에 결합. (a)(b) 하려면 가짜 카트를 만들고 할인 결과를 다시 credit 으로 번역해야 함 — Postgres+Redis+worker+admin 풀스택을 띄우고도 결국 원장 코드는 직접 짜야 함 |
| **빌링/크레딧 엔진**               | Lago(AGPL-3.0), Kill Bill(Apache-2), OpenMeter(2,231★), Orb/Metronome | **Lago 는 결정적으로 미달** — `lago-api` 소스 직접 확인: `coupon.rb` 의 `COUPON_TYPES = [:fixed_amount, :percentage]` 는 인보이스 할인 전용, credit 부여 불가. wallet API(`POST /wallet_transactions`) 는 `paid_credits`/`granted_credits` 만 있고 **거래 단위 만료 파라미터가 없음** — `expiration_at` 은 지갑 전체에만 존재. 즉 "구매 200credit 은 안 만료, 프로모 50credit 은 30일 후 만료"를 표현 불가. 게다가 self-host 시 **8개 서비스**(db/redis/migrate/api/front/api-worker/api-clock/pdf) 필요. Kill Bill 의 credit 도 인보이스 조정(`CBA_ADJ`)일 뿐 동일 문제. OpenMeter 는 Kafka+ClickHouse+Svix 포함 8개 서비스. **Orb/Metronome 은 OSS 서버 자체가 없음**(SDK만 공개) |
| **GitHub 토픽 전수 스윕**          | `promotions`/`loyalty`/`coupons`/`vouchers`/`discounts`/`rewards`/`gamification` 16개 토픽 | 500★ 넘는 것 전부 쿠폰 스크레이퍼, 개인 지갑 앱, WiFi 바우처 툴, Laravel 헬퍼 — 실제 프로모션 엔진 아님. 유일하게 조건에 맞는 [`offerkit/offerkit`](https://github.com/offerkit/offerkit)(MIT, TS, 만료 지원 credit/gift-card/loyalty) 은 **43★, 2026-05-08 생성, v0.2.0, 메인테이너 1명, Postgres 전용**(우리는 MySQL) — 채택 불가 수준 |

**결론 불변 이유(강화)**: Dodo 가 이미 결제 시점 %/정액 할인을 API 로 제공하므로(코드/기간/한도/고객제한 전부 지원) "결제할인" 문제는 애초에 자체 구현 대상이 아니었다. 남는 건 credit/엔타이틀먼트 문제뿐인데, **자체 시스템(`order_lists`)이 조사한 모든 외부 옵션보다 이미 이 축에서 더 정확하다.** 외부 도입은 기능 축소이지 개선이 아니다.

> 상세 조사 원문(agent 산출): 이 섹션에 요약 반영 완료, 원본은 세션 종료 후 삭제 예정(별도 plan 파일로 남기지 않음 — `.claude/rules/plan-conventions.md` "1 plan = 1 feature" 원칙상 이 문서에 흡수).

### 정밀 비교표 (2026-08-27) — 오픈소스는 language+★, SaaS/설치형은 가격

`~/code_workspace/lago-api`, `~/code_workspace/offerkit` 를 직접 clone 하여 스키마/모델 코드로 검증(★·라이선스는 `gh api`로 재확인, 웹 검색 수치 아님). 나머지는 `gh api`로 재확인만.

| 솔루션                     | 형태          | Language          | ★ (검증시각 기준)                                          | 라이선스                              | 가격 (SaaS/설치형인 경우)                              | credit 만료 단위 |
| --------------------------- | ------------- | ------------------ | ------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------- | ------------------ |
| **자체 구현 (`order_lists`)** | 이미 보유    | TypeScript(Strapi) | — (사내 코드)                                                | —                                       | —                                                          | **행 단위** (이미 프로덕션 동작) |
| mumz-strapi-plugin-coupon   | 오픈소스(npm) | JavaScript          | GitHub repo 비공개/404 — ★ 확인 불가                          | MIT                                    | 무료                                                       | 없음 (할인 계산만) |
| Open Loyalty                | SaaS 전용     | —                   | 해당 없음 (OSS 저장소 없음)                                   | —                                       | **비공개** — pricing 페이지에 "Contact us"만, 수치 미공개  | 불명 (미확인)      |
| Voucherify                  | SaaS 전용     | —                   | 해당 없음                                                     | 폐쇄                                    | **Business €600/mo**(25k API calls) / **Organization €1,200/mo**(50k) — 영구 무료 없음, 60일 트라이얼만 | ✅ (코드 레벨)     |
| Talon.One                   | SaaS 전용     | —                   | 해당 없음                                                     | 폐쇄                                    | **비공개** — 공개 가격표 없음, 영업 문의(Enterprise) 필수  | ✅ (코드 레벨)     |
| Unleash                     | 오픈소스      | TypeScript          | **13,762★**                                                   | AGPL-3.0(oss) / open-core(paid tier 별도) | OSS 무료, Pro/Enterprise 는 유료(가격 비공개, 문의)         | ❌ 구조적 미스매치  |
| Flagsmith                   | 오픈소스      | Python               | **6,530★**                                                    | BSD-3                                  | OSS 무료, SaaS 유료 tier 존재(가격 미확인)                  | ❌ 구조적 미스매치  |
| GrowthBook                  | 오픈소스      | TypeScript          | **8,160★**                                                    | MIT (단, `enterprise/` 하위 디렉토리 제외) | OSS 무료, Enterprise 유료(가격 비공개)                      | ❌ 구조적 미스매치  |
| Flipt                       | 오픈소스      | Go                   | **4,883★**                                                    | Apache-2.0                             | 무료 (완전 OSS)                                             | ❌ 구조적 미스매치  |
| Medusa v2 (promotion module) | 오픈소스     | TypeScript          | **36,021★**                                                   | MIT (단, Enterprise Edition 디렉토리 제외) | OSS 무료, Cloud 별도 유료                                   | ❌ (order/cart 결합) |
| Saleor                      | 오픈소스      | Python               | **23,266★**                                                   | BSD-3                                  | OSS 무료, Saleor Cloud 별도 유료(가격 비공개)                | ❌ (order 결합)     |
| Vendure                     | 오픈소스      | TypeScript          | **8,376★**                                                    | GPL-3.0 (또는 상용 라이선스 별매)       | GPLv3 무료 / 상용 라이선스 가격 비공개(문의)                | ❌ (order 결합)     |
| Sylius                      | 오픈소스      | PHP                  | **8,515★**                                                    | MIT                                    | 무료 (완전 OSS)                                             | ❌ (order 결합)     |
| Spree                       | 오픈소스      | Ruby                 | **15,647★**                                                   | BSD-3                                  | 무료 (완전 OSS)                                             | ❌ (order 결합)     |
| Solidus                     | 오픈소스      | Ruby                 | **5,322★**                                                    | (커스텀, OSS)                          | 무료 (완전 OSS)                                             | ❌ (order 결합)     |
| Bagisto                     | 오픈소스      | PHP                  | **27,996★**                                                   | MIT                                    | 무료 (완전 OSS)                                             | ❌ (order 결합)     |
| EverShop                    | 오픈소스      | TypeScript          | **10,424★**                                                   | GPL-3.0                                | 무료 (완전 OSS)                                             | ❌ (order 결합)     |
| Shopware                    | 오픈소스      | PHP                  | **3,408★**                                                    | MIT                                    | 무료 (Community), Cloud/Enterprise 별도 유료(가격 비공개)   | ❌ (order 결합)     |
| Lago (backend, `lago-api`)  | 오픈소스      | Ruby                 | **432★** (백엔드 repo 단독) / 프로젝트 전체(`getlago/lago`) **10,415★** | AGPL-3.0                          | OSS 무료(self-host), Lago Cloud 별도 유료(가격 비공개)      | ❌ **거래단위 만료 없음** (소스 직접 확인, 아래 참조) |
| Kill Bill                   | 오픈소스      | Java                  | **5,705★**                                                    | Apache-2.0                             | 무료 (완전 OSS)                                             | ❌ (인보이스 조정일 뿐) |
| OpenMeter                   | 오픈소스      | Go                    | **2,231★**                                                    | Apache-2.0                             | OSS 무료(self-host), Cloud 별도 유료(가격 비공개)            | 불명 (usage metering 중심, coupon 아님) |
| Orb                          | SaaS 전용(SDK만 OSS) | —          | 해당 없음(서버 비공개)                                        | 폐쇄                                    | **비공개** — 가격표 없음, 영업 문의                          | 불명                |
| Metronome                    | SaaS 전용(SDK만 OSS) | —          | 해당 없음(서버 비공개)                                        | 폐쇄                                    | **비공개** — 가격표 없음, 영업 문의                          | 불명                |
| **OfferKit**                 | 오픈소스      | TypeScript          | **43★** (2026-05-08 생성, 최근 push 2026-08-18, fork 14, watcher 0, open issue 1) | MIT                    | 무료 (완전 OSS, self-host: `docker compose up`)             | ✅ **행 단위 지원** (아래 참조) |

**소스 직접 검증 결과 2건 (clone 후 확인, `~/code_workspace/`):**

1. **Lago (`lago-api`) — 거래 단위 만료 불가, 확정.** `db/structure.sql` 의 `wallet_transactions` 테이블 컬럼을 직접 나열해 확인: `amount`, `credit_amount`, `remaining_amount_cents`, `priority`, `source`, `transaction_status` 는 있지만 **`expir` 로 시작하는 컬럼이 단 하나도 없다.** 만료는 `wallets` 테이블에만 `expiration_at` (지갑 전체 단일 값)로 존재. `app/models/coupon.rb` 는 `COUPON_TYPES = [:fixed_amount, :percentage]` — credit 부여 기능 자체가 없고 인보이스 할인 전용. **"구매 200credit 은 무기한, 프로모 50credit 은 30일 후 소멸"을 표현할 방법이 스키마상 없다.**
2. **OfferKit — 예상 밖으로 우리 요구사항과 구조가 가장 비슷하다.** `packages/db/src/schema/loyalty.ts` 의 `loyalty_transaction` 테이블에 **`expiresAt`/`expiredAt` 이 거래(행) 단위로 존재**하고, `loyalty_program.pointsExpiryDays` 로 프로그램 단위 기본값을 두되 실제 만료는 발급 건마다 개별 계산·인덱싱된다 — **`order_lists.expiration_date` 와 사실상 동일한 설계 철학** (FIFO 소비까지는 미확인이나 append-only ledger 임은 `gift_card_transaction.ts` 주석("Append-only ledger for gift card balance moves")으로 확인). 스택 가능한 할인코드, 기프트카드, 세그먼트, MCP 서버까지 포함해 기능적으로는 세 요구사항 (a)(b)(d) 를 전부 커버할 잠재력이 있다.
   - **그럼에도 채택 보류 이유**: 생성 **3.5개월**(2026-05-08~), **★43 / fork 14 / watcher 0 / 이슈 1건** — 실사용 검증이 사실상 없는 수준. **Postgres 전용**(`drizzle-orm/pg-core` 하드코딩, 우리는 MySQL) → 별도 DB 인스턴스 필요. Redis+Postgres+web+worker 4개 서비스를 credit 원장 하나 때문에 새로 운영해야 하고, Strapi `order_lists` 와 **잔액 원장이 2곳으로 쪼개진다**(정합성 동기화 문제 신규 발생). 프로젝트가 1년 뒤에도 유지보수되고 있다면 재평가할 가치는 있다 — 지금은 아니다.

---

## 결론 3 — "쿠폰으로 가능한 action" 전수 (질문에 대한 답)

이 코드베이스에서 **실제로 구현 가능한** action 목록. 각 항목의 구현 비용이 크게 다르므로 이 표가 곧 phase 근거다.

| #   | Action                     | 구현 방식                                                                             | 비용   | v1 |
| --- | -------------------------- | ------------------------------------------------------------------------------------- | ------ | -- |
| 1   | **만료기한 있는 credit 지급** | `order_lists` 행 생성 (`purpose: 'COUPON'`) + `invalidateCreditCache`                | 낮음   | ✅ |
| 2   | **동시 실행 수 상향**      | `user.taskTier` (free/pro/enterprise) 또는 `user.maxConcurrentTasks`                  | 중간   | ⏭️ |
| 3   | **스토리지 quota 부여**    | `user.storageQuotaBytes` / `hypeagentBlockStorageQuotaBytes`                          | 중간   | ⏭️ |
| 4   | **특정 기능 0원 사용**     | `useCredit` 의 기존 `creditsAmount === 0` free branch (`credit.ts:741`) 재사용        | 중간   | ⏭️ |
| 5   | **베타/실험 기능 플래그**  | `user.userRole` (`beta_tester` 값 이미 존재) 또는 `user.metadata` json                | 중간   | ⏭️ |
| 6   | **구매 시 할인(%/정액)**   | **Dodo discount API 위임** — 자체 할인 계산 구현 금지                                 | 낮음\* | ⏭️ |
| 7   | **자동 발급 트리거**       | 가입 시 / 결제 웹훅 시 / 임의 action 시 → 쿠폰 발급                                   | 낮음   | ✅ |
| 8   | 무료 export quota 해금     | 현재 `availableCredit >= 100` 로 판정 중 → **1번이 이미 부작용으로 해금함**           | —      | ⚠️ |

\* 6번이 "낮음"인 이유: 계산을 Dodo 가 한다. 단 `apps/web-service/src/app/api/checkout/route.ts` 가 **SDK 핸들러 순수 re-export**라 서버측 훅이 없음 → 할인코드를 붙이려면 이 라우트를 직접 작성해야 한다. 그래서 v1 유보.

**8번은 설계 결정이 아니라 이미 존재하는 부작용**이다: `apps/web-service/src/app/api/export/timeline/route.ts` (~line 147) 가 `isPremium = availableCredit >= 100` 으로 무료 export quota 를 게이트한다. 즉 **100 credit 이상 주는 쿠폰은 자동으로 export 무제한을 해금**한다. 의도된 동작인지 확인 필요.

### v1 에서 뺀 것과 이유

`buy X get Y`, 추천인(referral) 코드, 쿠폰 스택, 등급별 누진 — 전부 **지금 필요하다는 근거가 없다**. 스키마에 `action_type` enum 을 두었으므로 나중에 값만 추가하면 된다. (Karpathy §2 Simplicity First)

---

## 설계 (자체 구현)

### 현재 시스템 사실관계 (설계 제약의 근거)

- **credit 잔액 컬럼은 없다.** 잔액 = `SUM(order_lists.credit) WHERE email=? AND expiration_date >= now`. `user` 에 credit 필드 없음.
- 지급 = `order_lists` 행 생성이 **유일한 방법**. 프로덕션 지급 경로는 Dodo 웹훅 `hook.ts:333` 하나뿐.
- 차감 = `POST /api/credit/use` → `credit.ts:643 useCredit` (knex 원자적 조건부 UPDATE, `expiration_date ASC` FIFO).
- **엔타이틀먼트 원시타입이 없다.** 있는 건 `taskTier`, `userRole`, `maxConcurrentTasks`, `*QuotaBytes`, 그리고 자유 형식 `user.metadata` json.
- 기존 수동 지급 = `apps/strapi-ts/scripts/create-credit-order.js` — **redeem 구현의 최적 템플릿** (멱등 `order_id`, `confirmed=true`, `expiration_date = today + months`).

### 스키마 — content-type 2개

**`coupon`** (캠페인 정의 — Strapi Admin 에서 운영자가 직접 생성)

```
code                     string, unique, nullable   -- null = 코드 입력형이 아닌 자동발급 전용
name                     string, required
action_type              enum: grant_credit | entitlement | dodo_discount
credit_amount            decimal                    -- action_type=grant_credit
credit_valid_days        integer                    -- 지급 credit 의 유효일수
entitlement_key          string                     -- action_type=entitlement
entitlement_valid_days   integer
dodo_discount_id         string                     -- action_type=dodo_discount
valid_from / valid_until datetime                   -- 쿠폰 자체의 사용 가능 기간
max_redemptions          integer                    -- 전체 한도 (null=무제한)
max_redemptions_per_user integer, default 1
auto_issue_trigger       enum: none | signup | purchase
auto_issue_product_code  string                     -- trigger=purchase 일 때 대상 상품
is_active                boolean, default true
```

**`coupon-redemption`** (발급/사용 기록 — **이것이 곧 유저별 쿠폰 인벤토리이자 엔타이틀먼트 저장소**)

```
coupon                   relation manyToOne -> coupon
user_email               string, required
user_id                  integer
status                   enum: issued | redeemed        -- issued=보유중, redeemed=사용됨
issued_at / redeemed_at  datetime
entitlement_expires_at   datetime                       -- "보유만 하면 발동" 의 종료 시점
granted_order_id         string                         -- 생성한 order_lists.order_id (추적/멱등)
```

**DB 유니크 제약 `(coupon, user_email)`** 이 중복 사용 방지의 1차 방어선. 애플리케이션 체크만으로는 동시 요청에서 뚫린다.

### 핵심 설계 결정: 엔타이틀먼트는 "리졸버" 방식

`user.taskTier` 를 직접 덮어쓰는 방식은 **쓰지 않는다**. 이유: 원래 값을 어디 보관할지, 만료 시 누가 되돌릴지가 전부 추가 상태가 되고, 되돌리기 실패 시 영구 드리프트가 남는다.

대신 **`coupon-redemption` 을 진실의 원천으로 두고 리졸버가 조회**한다:

```
getActiveEntitlements(userEmail) =
  coupon-redemption WHERE user_email=? AND status='issued'
                      AND entitlement_expires_at > now
  → coupon.entitlement_key 목록
```

날짜가 지나면 자동으로 결과에서 빠진다 — **되돌리기 로직이 존재하지 않는다.** 원 요청의 "마지막일 이후 쿠폰 자동 삭제"는 **행 삭제 대신 만료 필터**로 구현한다(감사 이력 보존). 실제 DELETE 가 필요하면 별도 정리 잡으로 분리.

### 구현 지점

| 대상                          | 파일                                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| content-type 2개              | `apps/strapi-ts/src/api/coupon/`, `apps/strapi-ts/src/api/coupon-redemption/` |
| redeem/validate 컨트롤러      | `apps/strapi-ts/src/api/coupon/controllers/coupon.ts`                    |
| 지급 로직 (order_lists 생성)  | 신규 `apps/strapi-ts/src/lib/coupon-grant.ts` — `create-credit-order.js` 로직 이식 |
| 캐시 무효화                   | 기존 `apps/strapi-ts/src/lib/credit-cache.ts` 의 `invalidateCreditCache` 재사용 |
| 권한 등록 (**코드로만**)      | `apps/strapi-ts/src/index.ts` — `credit-management` authenticated 블록(~line 526) 패턴 복사 |
| 가입 자동발급 훅              | `apps/strapi-ts/src/api/user-registration/services/user-registration.ts` — `attemptStrapiSignup` (line 236) 직후 |
| 구매 자동발급 훅              | `apps/strapi-ts/src/api/hook/services/hook.ts` — `handlePaymentSucceeded` 의 order 생성(line 333) 직후 |
| 코드 입력 UI                  | `apps/web-service/src/app/[locale]/credits/purchase/page.tsx` — 이메일 경고 Alert(~line 354) 와 상품 그리드(~line 356) **사이**. 이 위치만 `packagesLoading`/`packagesError` 와 무관해 상품 fetch 실패해도 redeem 가능 |
| i18n                          | `apps/web-service/src/messages/{en,ko,es}.json` — `PurchaseCredits` 네임스페이스 |
| 아키텍처 문서                 | `docs/system-architecture.md` **§6 크레딧 모델** — 지급 경로가 2개(Dodo 웹훅 + 쿠폰)가 되므로 갱신 필수 (`.claude/rules/architecture-doc-sync.md`) |

### ⛔ 반드시 지켜야 할 제약 (조사에서 나온 실제 지뢰)

1. **redeem 은 반드시 커스텀 컨트롤러 + 명시적 인증.** `apps/web-service/src/app/api/strapi-proxy/[...path]/route.ts` 는 **경로 allowlist 가 없고**, user JWT 가 없으면 마스터 `STRAPI_TOKEN` 으로 폴백한다. content-type 기본 CRUD 를 열면 **비로그인 사용자가 마스터 권한으로 쿠폰을 생성/수정**할 수 있다.
2. **`invalidateCreditCache(email)` 호출 필수.** `getCreditSummary` 는 Redis 300s 캐시. 기존 `customApi` 벌크 지급 2곳이 이걸 빠뜨려 이미 stale 잔액 버그가 잠재해 있다.
3. **`expiration_date` 는 string 컬럼**이고 ISO 문자열로 사전식 비교된다. Dodo 경로의 **full ISO(`toISOString()`)** 로 통일할 것. `YYYY-MM-DD` 를 섞으면 과거에 실제로 터진 가용 credit 버그가 재발한다 (`credit-management.ts` ~line 70 주석 참조).
4. **`useCredit` 은 단일 order 행이 비용 전액을 커버해야 한다** (행 분할 없음, `credit.ts:764~805`). 합계 잔액이 충분해도 **소액 쿠폰 행은 FIFO 에서 조용히 스킵**될 수 있다. 쿠폰 금액을 정할 때 반드시 고려.
5. **멱등성은 `order_lists.order_id` (unique)** 로 건다. 쿠폰 발급 시 `coupon_{couponId}_{userId}` 형태의 결정적 키 사용.
6. **권한은 코드로만 등록.** `apps/strapi-ts/CLAUDE.md` 의 하드 룰 — Admin UI 클릭 금지.
7. **static-config sync 등록 여부 결정.** 쿠폰 정의를 git-tracked JSON 으로 시드하려면 `src/lib/sync-static-config.ts` 의 `TABLE_CONFIGS` **와** `scripts/db-export-static-config.js` 의 `STATIC_TABLES` **양쪽 모두**에 등록해야 한다. 다만 쿠폰은 운영 데이터(런타임 생성)이므로 **등록하지 않는 쪽을 권장**.

---

## 단계 (phase)

| Phase | 내용                                                                                        | 선행조건            |
| ----- | ------------------------------------------------------------------------------------------- | ------------------- |
| **0** | `hook.ts:259` falsy-zero 버그 수정(1줄+회귀테스트) → Dodo 100% 할인코드로 실결제 없는 결제경로 QA 확립 | 없음 — 즉시 가능 |
| **1** | `grant_credit` 쿠폰: content-type 2개 + validate/redeem + 가입 자동발급 + 구매 페이지 UI     | Phase 0 검증 결과   |
| **2** | `entitlement` + 리졸버. 실제 소비처 1곳만 연결 (전면 적용 금지)                             | Phase 1 완료        |
| **3** | `dodo_discount` 연동 — `api/checkout/route.ts` 직접 작성 필요                                | Phase 2 완료, 필요시 |

Phase 1 이 요구사항 (a)(b)(d) 대부분을 덮는다. **hypeagent 예약 SKU 구매 결과는 credit 부여가 전부이므로, "구매와 동일 결과 부여"는 Phase 1 의 `grant_credit` 만으로 달성된다** — 엔타이틀먼트 타입은 필요 없다.

---

## Verification

**Phase 0** (가장 먼저, 나머지 설계의 전제):

1. `hook.ts:259` falsy-zero 수정 + `total_amount: 0` 웹훅 회귀 테스트 (수정과 같은 커밋)
2. Dodo 대시보드/API 로 100% 할인코드 생성 → dev-local 환경 checkout 진행 (staging/prod DB 금지 — `.claude/rules/workflow-rules.md`)
3. Strapi 로그에서 `handlePaymentSucceeded` 진입 및 **`product_cart` 존재 여부** 확인 ← Phase 0 성패를 가르는 지점
4. `order_lists` 행 생성 확인 + `GET /api/credit-management/summary/:email` 로 잔액 반영 확인
5. 결과를 `tests/plan-test/coupon-system/results/` 에 기록 (`.claude/rules/testing-conventions-critical.md` Branch 1)

**Phase 1**:

| 계층        | 대상                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Unit        | `coupon-grant.ts` — 만료일 계산, 결정적 `order_id`, 잘못된 `action_type` 거부                         |
| Integration | redeem 멱등성(동일 코드 2회 → 2번째 거부), **동시 redeem 경합**(`use-credit-race.integration.test.ts` 패턴 재사용), 만료 쿠폰 거부, 한도 초과 거부 |
| Integration | redeem 후 `getCreditSummary` 가 **캐시를 뚫고** 새 잔액 반환 (제약 2 회귀 테스트)                     |
| Integration | 지급된 credit 이 `useCredit` 로 실제 차감되는지 — **제약 4 회귀**: 쿠폰 금액보다 비싼 작업이 스킵되지 않는지 |
| E2E         | 구매 페이지에서 코드 입력 → 잔액 증가 (Playwright, 결과는 `apps/web-service/tests/e2e/results/`)       |
| 보안        | 비로그인 상태로 `/api/strapi-proxy/coupons` 직접 POST → **거부되어야 함** (제약 1 회귀)                |

전 계층 실행 순서는 Unit → Integration → E2E 고정. 백그라운드 실행 시 status 파일 규칙 준수.

---

## Decision Log

### build vs buy — 2026-08-27

| #   | 옵션                          | 장점                            | 단점                                                                       | 적합 조건                     |
| --- | ----------------------------- | ------------------------------- | -------------------------------------------------------------------------- | ----------------------------- |
| 1   | **Strapi 자체 구현** [채택]   | 기존 credit 원장 재사용, 의존성 0 | 직접 작성 필요                                                             | credit/엔타이틀먼트가 본질일 때 |
| 2   | `mumz-strapi-plugin-coupon`   | 설치 즉시                       | 월 42 DL, repo 비공개(감사 불가), 전화번호 신원, 라우트 `auth:false`, credit 개념 없음 | 전화번호 기반 EC              |
| 3   | Voucherify                    | 기능 완비                       | €7,200/년, SaaS 의존, **여전히 자체 원장 필요**, 읽기 경로에 외부 HTTP     | 대규모 마케팅 캠페인 운영     |
| 4   | Medusa promotion 모듈         | MIT, 모듈형                     | `@medusajs/framework` 런타임 필요, cart 모델, credit 없음                  | Medusa 사용 중일 때           |
| 5   | Lago                          | wallet=credit 원장 존재         | **거래단위 만료 불가**(지갑 전체만), 쿠폰은 인보이스 할인만, 8개 서비스 운영, 신원 3중 동기화, AGPL | usage-based 과금이 본업일 때  |
| 6   | Open Loyalty                  | —                               | **OSS 판 없음**(SaaS 전용, 저장소 404)                                     | 해당 없음                     |
| 7   | Feature-flag 플랫폼 (Unleash 등) | 자체 호스팅 쉬움, 성숙          | 유저별 만료 윈도우를 표현 못함(전역 기간만) → (c) 구조적 미스매치          | 캠페인 단위 전역 토글일 때    |
| 8   | offerkit                      | 요구사항에 가장 근접(만료 지원) | 43★, v0.2.0, 메인테이너 1명, Postgres 전용                                 | 1년 뒤 재평가                 |

**결정**: 1번 — **요구사항 4개 중 3개가 할인 계산이 아니라 credit/엔타이티먼트 문제**이고, 2~5번은 전부 할인 계산(=이미 Dodo 가 하는 일)을 푼다. 외부 도입 시 코드가 줄지 않고 오히려 는다.

**2026-08-27 추가 확인(Strapi 연동 제약 해제 후 재검토)**: "별도 self-hosted 서비스 + HTTP 호출" 형태까지 허용해도 결론 불변. Open Loyalty 는 OSS 판이 없고(SaaS 전용), feature-flag 플랫폼은 유저별 redeem-시점-기준 만료 윈도우를 구조적으로 표현 못하며(전역 기간 세그먼트만 지원), 최유력 후보 Lago 는 소스 직접 확인 결과 **거래 단위 만료가 아예 없다**(지갑 전체 단위만) — 반면 우리 `order_lists` 는 이미 행 단위 만료 + FIFO 소비를 8곳+ 소비 경로에서 프로덕션 운영 중. **외부 도입은 이미 갖고 있는 기능의 축소**가 된다.

**2026-08-27 재확인(`~/code_workspace/`에 직접 clone 하여 소스 검증, 위 정밀 비교표)**: `lago-api`, `offerkit` 두 저장소를 실제로 clone 해 DB 스키마/모델 코드를 읽었다. Lago 는 `db/structure.sql` 의 `wallet_transactions` 테이블에 만료 컬럼이 **하나도 없음**을 최종 확인(추측이 아니라 DDL 확인). 유일하게 우리 요구사항과 설계가 정말 비슷한 건 **OfferKit**(거래 단위 `expiresAt`, MIT, self-host 4서비스) 이었으나, ★43/생성 3.5개월/watcher 0 라는 실사용 검증 부재와 **Postgres 전용**(우리는 MySQL, 원장 2원화 문제) 때문에 채택 보류. **최종 결정 불변: 자체 구현.**

### 할인(%) 은 자체 구현하지 않는다 — 2026-08-27

**결정**: `dodo_discount` action 은 Dodo API 에 위임. **이유**: Dodo 가 사용 한도/고객당 한도/`first_time` 자격/상품 제한/스택까지 이미 제공한다. 자체 구현은 순수 중복이며, 결제 금액 계산을 두 곳에 두면 불일치 시 실제 금전 손실이 난다.

### 엔타이틀먼트는 user 필드 덮어쓰기가 아니라 리졸버 — 2026-08-27

**결정**: `coupon-redemption` 조회형 리졸버. **이유**: 필드 덮어쓰기는 원값 보관 + 만료 되돌리기 잡이 추가로 필요하고, 되돌리기 실패가 영구 드리프트로 남는다. 리졸버는 날짜가 지나면 자동으로 결과에서 빠져 **되돌리기 로직 자체가 불필요**하다. 원 요청의 "만료 후 쿠폰 자동 삭제"는 물리 삭제 대신 만료 필터로 구현 — 감사 이력 보존이 더 중요하다고 판단.

---

## Research Log

### Search Keywords

- `strapi-plugin coupon`, `strapi-plugin discount`, `strapi-plugin promotion`, `strapi-plugin voucher`
- GitHub: `coupon engine in:name,description stars:>200`, `promotion engine stars:>200`, `voucher stars:>300`
- repo grep: `coupon|promo|voucher|referral|redeem|gift|bonus|쿠폰|프로모|바우처|추천인|리퍼럴|보너스`

### Reference URLs

- https://docs.dodopayments.com/features/discount-codes — Dodo 할인코드 (핵심)
- https://docs.dodopayments.com/changelog/v1.30.0.md , /v1.52.4.md — 100% 할인 / $0 결제 지원
- https://market.strapi.io/ , https://market-api.strapi.io/plugins?search=coupon — 검색 결과 0건
- https://www.npmjs.com/package/mumz-strapi-plugin-coupon — 유일 npm 후보
- https://www.voucherify.io/pricing — €600/mo 부터
- https://docs.medusajs.com/resources/commerce-modules/promotion , https://medusajs.com/v2-overview
- https://getlago.com/docs/guide/coupons , https://getlago.com/docs/guide/wallet-and-prepaid-credits/overview
- https://github.com/voucherifyio , https://github.com/vinocrzy/strapi-commerce

### Key Findings

- **Dodo 가 100% 할인 / $0 결제를 지원** → 실결제 없는 QA 는 쿠폰 시스템과 무관하게 가능. 단 아래 버그 수정이 선행돼야 하고 `product_cart` 포함 여부는 미검증.
- **기존 버그 발견(코드 확인 완료)**: `hook.ts:259` 의 `!total_amount` 가드가 `total_amount === 0` 을 "값 없음"으로 오판 → $0 결제 웹훅이 무조건 throw/500. 100% 할인 QA 를 시도하면 여기서 먼저 막힌다. 이 버그는 쿠폰 도입과 무관하게 이미 존재.
- **Dodo 는 credit/엔타이틀먼트 부여 불가**라고 문서에 명시 → 요구사항 (a)(b)(c) 는 자체 구현 확정.
- **독립 OSS 쿠폰 엔진 카테고리가 존재하지 않음** (GitHub stars>200 검색 0건). SaaS 벤더가 이 시장을 독점.
- repo 전체에 쿠폰 구현 코드 **0줄**. i18n 문구(`ko.json:1299`, `en.json:1320` "프로모션·이벤트·보너스로 받은 무료 크레딧")만 존재 — **백엔드가 구현하지 않은 정책을 이미 사용자에게 고지 중**.
- `useCredit` 에 이미 프로모션 이음새 2개 존재: `metadata.test_mode === true` (line ~659), `creditsAmount === 0` free branch (line ~741, 주석 "무료(0원): 이벤트/프로모션").
- `subscription` content-type 은 `dodo_subscription_id` 가 **required+unique** → Dodo 결제 없이는 행 생성 불가. 원 지적("결제 강결합")의 실물 사례.
- `hypeagent-billing` 의 `ExhaustionTracker` 는 잔액 소진 ~1분 후 인스턴스를 강제 정지 → "쿠폰 보유 중 hypeagent 무료"는 사후 환불이 아니라 **0원 경로**로 구현해야 한다.

---

## Remaining Tasks

- [ ] **Phase 0-a**: `hook.ts:259` falsy-zero 버그 수정 (`!total_amount` → `total_amount == null`) + `total_amount: 0` 회귀 테스트
- [ ] **Phase 0-b**: Dodo 100% 할인코드 생성 → $0 checkout → `payment.succeeded` 웹훅에 `product_cart` 포함되는지 확인 (나머지 설계의 전제)
- [ ] Phase 0 결과에 따라 Phase 1 착수 여부/범위 확정
- [ ] `export/timeline` 의 `availableCredit >= 100` 프리미엄 판정이 의도된 것인지 확인 (쿠폰 credit 이 무료 export 를 암묵 해금함)
- [ ] Phase 1: content-type 2개 + `coupon-grant.ts` + validate/redeem 컨트롤러
- [ ] Phase 1: `src/index.ts` 권한 등록 (코드로)
- [ ] Phase 1: 가입 자동발급 훅 (`attemptStrapiSignup` 직후)
- [ ] Phase 1: 구매 페이지 코드 입력 UI + i18n 3개 로케일
- [ ] Phase 1: 테스트 (Unit → Integration → E2E), 제약 1·2·4 회귀 테스트 포함
- [ ] `docs/system-architecture.md` §6 갱신 (credit 지급 경로 2개화)
- [x] plan 파일명 규칙 적용 (`20260827_todo_coupon-system.md`) — 착수 시 `_todo_` → `_wip_`
- [x] Strapi 연동 제약을 뺀 self-hosted OSS 재조사 완료 — 결론 불변(자체 구현), 결론 2·Decision Log 갱신 완료
- [x] 정밀 비교표 작성 (오픈소스: language+★, SaaS/설치형: 가격) + `lago-api`/`offerkit` clone 후 소스 직접 검증 (`~/code_workspace/lago-api`, `~/code_workspace/offerkit` — 검증 완료 후 로컬 삭제)
