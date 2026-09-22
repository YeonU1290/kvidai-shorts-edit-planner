# AI 편집 추천 결과 JSON 스키마

## 개요
`/api/recommend` 엔드포인트가 반환하는 응답 형식입니다. OpenAI Structured Output(`json_schema`, `strict: true`)으로 강제되며, 서버에서 Zod로 재검증됩니다.

## 스키마 정의

```json
{
  "summary": "string (전체 편집 방향 요약)",
  "recommendedClips": [
    {
      "sceneId": "string (원본 scene ID 참조)",
      "startTime": "number (초 단위, 0 이상)",
      "endTime": "number (초 단위, startTime보다 커야 함)",
      "reason": "string (이 구간을 추천하는 이유)",
      "suggestedCaption": "string (추천 자막 문구)"
    }
  ]
}
```

## 예시 응답

```json
{
  "summary": "요리 완성 장면과 감탄사가 포함된 구간이 시청자의 몰입도를 높일 것으로 예상되어, 조리 클라이맥스와 만족스러운 반응 장면을 중심으로 추천합니다.",
  "recommendedClips": [
    {
      "sceneId": "scene-3",
      "startTime": 22,
      "endTime": 40,
      "reason": "마늘 볶는 소리와 시각적 효과(김, 지글거림)가 감각적 자극을 주는 구간",
      "suggestedCaption": "이 냄새 미쳤다 🔥"
    },
    {
      "sceneId": "scene-5",
      "startTime": 55,
      "endTime": 62,
      "reason": "만족스러운 반응이 시청자의 공감을 유도하는 마무리 구간",
      "suggestedCaption": "진짜 맛있어보여요 😍"
    }
  ]
}
```

## 검증 규칙

1. **스키마 레벨 (Zod)**
   - `summary`: 필수, string
   - `recommendedClips`: 필수, 최소 1개 이상의 배열
   - 각 클립의 5개 필드(`sceneId`, `startTime`, `endTime`, `reason`, `suggestedCaption`) 모두 필수

2. **비즈니스 규칙 레벨 (`validateEditPlan` 함수)**
   - `startTime < endTime` 이어야 함
   - `startTime >= 0` 이어야 함
   - `endTime <= 원본 영상의 durationSeconds` 이어야 함

## 에러 응답 형식

```json
{
  "error": "string (에러 요약 메시지)",
  "details": "선택적, 상세 검증 에러 배열 또는 객체"
}
```

| HTTP 상태 코드 | 의미 |
|---|---|
| 400 | 요청 입력(fixture) 검증 실패 |
| 502 | AI 응답이 비어있거나, 스키마/비즈니스 규칙 위반 |
| 500 | 서버 내부 오류 (OpenAI API 호출 실패 등) |