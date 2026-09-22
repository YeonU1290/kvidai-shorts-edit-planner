# QA 시나리오 — KvidAI Shorts Edit Planner

## 정상 케이스

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 1 | 유효한 fixture로 추천 요청 | 200 OK, summary + recommendedClips 배열 반환 |
| 2 | 추천된 각 클립의 시간 범위가 원본 scene 범위 내에 있음 | 검증 통과, 에러 없음 |
| 3 | 여러 개의 scene이 있는 영상 | 각 scene을 반영한 다양한 클립 추천 |

## 예외 케이스

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 4 | 요청 body가 비어있음 | 400 Bad Request, 입력 검증 에러 메시지 |
| 5 | scenes가 빈 배열인 fixture | 400 Bad Request (Zod 검증 실패, min(1) 위반) |
| 6 | durationSeconds가 없는 fixture | 400 Bad Request (필수 필드 누락) |
| 7 | OpenAI API 호출 자체가 실패 (네트워크 오류, 키 오류 등) | 500 Internal Server Error, 에러 메시지 반환 |
| 8 | OpenAI가 응답을 비워서 반환 | 502 Bad Gateway, "AI 응답이 비어있습니다" |
| 9 | OpenAI 응답이 JSON Schema는 맞지만 논리적으로 틀림 (예: startTime > endTime) | 502 Bad Gateway, validateEditPlan 에러 상세 반환 |
| 10 | OpenAI 응답의 endTime이 원본 영상 길이를 초과 | 502 Bad Gateway, 관련 에러 메시지 반환 |

## 프론트엔드 UX 케이스

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 11 | "편집 추천 받기" 버튼 클릭 | 로딩 상태("분석 중...") 표시, 버튼 비활성화 |
| 12 | 추천 성공 | summary + 클립별 카드(시간, 이유, 자막) 렌더링 |
| 13 | 추천 실패 | 빨간색 에러 박스에 에러 메시지 표시 |
| 14 | 연속으로 버튼 두 번 클릭 | 이전 요청 완료 전 중복 요청 방지 (버튼 disabled 상태로 처리됨) |

## 실행 방법

```bash
# 단위 테스트
npm run test

# 수동 테스트
npm run dev
# → http://localhost:3000/recommend 접속 후 버튼 클릭
```