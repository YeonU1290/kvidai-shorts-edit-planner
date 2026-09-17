<!-- Source: https://github.com/epicmobile18/dev-standards/tree/main/dev-standards/docs/image-generation-conventions.md -->
<!-- Version: 1.11.0 -->
<!-- Last Updated: 2026-06-05 -->

# Image Generation Conventions (Optional)

> **Scope**: 사업계획서·소개자료·발표(PPT) 문서에 들어갈 이미지를 image 생성 모델로 만들 때의 규칙.
> 코드가 아닌 **문서 작업용 optional rule** — 필요할 때만 참조한다.

## Core Style: "논문 50% + 알록달록 50%"

목표는 **전문성(학술적 신뢰감) + 가독성(눈에 띔)의 균형**이다.

| 한쪽으로 치우치면 | 문제 |
| --- | --- |
| 100% 논문 흑백 톤 | 발표자료에서 칙칙하고 안 읽힘 |
| 100% 알록달록/네온 | 싸 보이고 신뢰감 하락, 데이터처럼 안 보임 |

**정답 = academic-meets-modern**: 논문 figure의 정돈된 구조(다이어그램·화살표·일관된 라벨)를 유지하되,
**off-white 배경 + 차분하지만 또렷한 accent 컬러**(soft teal / blue / green 등)로 포인트를 준다.

### 기본 팔레트 (검증된 조합)

- 배경: **off-white / light gray** (순백·검정 배경 금지)
- accent: **soft teal · soft blue · soft green** (단계/블록 구분용)
- 텍스트: **black**, clean modern typography
- 형태: rounded rectangles, subtle shadows, thin connecting arrows
- 금지: neon, glow, dark/futuristic background, fluorescent, 과한 채도

---

## ⛔ HTML-First for Infographics (CRITICAL)

**인포그래픽·다이어그램·표·한글 텍스트가 많은 시각자료는 image 모델보다 HTML이 우선이다.**

### Why

- image 생성 모델은 **한글 텍스트를 거의 항상 깨뜨린다** (글자 뭉개짐·오타·가짜 글자)
- 선·표·정렬된 박스 같은 **기하학적 요소를 깔끔하게 못 그린다**
- HTML/CSS는 한글이 안 깨지고, 선·격자·정렬이 픽셀 단위로 깔끔하다

### 결정 규칙

| 만들 것 | 방법 |
| --- | --- |
| 텍스트·표·플로우차트 위주 인포그래픽 | **HTML 단독** (CSS로 스타일링 → 스크린샷/PDF) |
| 사실적 이미지(인물·제품·배경·before/after) | **image 생성 모델** |
| 둘 다 필요 (예: 사진 위에 한글 라벨·다이어그램) | **HTML + genImage 하이브리드** — 모델로 텍스트 없는 비주얼 생성 → HTML/슬라이드에서 한글 텍스트·선을 위에 얹기 |

### 핵심 원칙

> **image 모델에는 "텍스트 없는 그림"만 맡기고, 글자는 HTML/슬라이드에서 입힌다.**

- 프롬프트에 한글 라벨을 넣지 말 것 → 영문 placeholder로 생성하거나 텍스트 영역을 비워두고 후처리
- HTML 단독으로 충분한 도식이면 굳이 image 모델을 쓰지 말 것 (비용·재현성·품질 모두 HTML 우위)

---

## Prompt Skeleton (model-agnostic)

좋은 프롬프트는 아래 7개 슬롯을 채운다. 한 문장 나열보다 **블록 단위**로 쓰면 모델이 더 잘 따른다.

```
1. 스타일/매체   : "polished technical figure in the style of a top-tier image processing paper (CVPR/ECCV/NeurIPS)"
2. 배경/톤        : "light off-white background, subtle shadows, tasteful muted colors"
3. 주제/구성      : 무엇을 어떤 레이아웃으로 (top row pipeline, bottom row before/after 등)
4. 구성요소 라벨  : 각 블록의 색·텍스트 (English label, soft teal box "Preprocessing" 등)
5. 컬러 지정      : "off-white bg, soft teal/blue/green accents, black text"
6. 포맷/비율      : "16:9 (1920×1080), high detail, sharp text"
7. negative       : 빼고 싶은 것 (아래 참조)
```

### 표준 Negative Prompt (PPT 문서용)

```
neon, glow, dark background, futuristic, fluorescent, watermark, logos,
company names, product names, cluttered, overly colorful, broken text, distorted letters
```

> 한글이 필요하면 텍스트 자체를 negative로 빼고 HTML에서 입히는 편이 안전하다.

---

## 프롬프트 파일 컨벤션 (1 파일 = 1 이미지)

**프롬프트 파일과 생성 이미지를 1:1로 관리한다. 파일명은 생성 전에 미리 결정한다.**

**파일명은 생성 전에 프롬프트 파일에서 선언한다.**
genmedia CLI는 직접 파일 저장을 지원하므로 URL → curl 별도 단계가 필요 없다.

### 파일 네이밍 규칙

```
{슬러그}_{모델명}_이미지생성.prompt.txt   ← 프롬프트
{슬러그}_{모델명}_{yyyymmdd}-{n}.png            ← 생성 이미지
```

- **매칭 키** = `{슬러그}_{모델명}` — 두 파일 모두 동일 → 프롬프트↔이미지 즉시 대응
- **날짜는 이미지 파일명 끝에** (프롬프트 파일엔 불필요 — 내용이 바뀌면 파일 자체를 수정)
- **`-{n}`** — 동일 프롬프트로 여러 번 생성 시 시퀀스 구분 (`-1`, `-2`, ...)
- 프롬프트 파일의 `이미지생성.prompt` 키워드 — 일반 `.txt`·문서 파일과 구분

**같은 개념을 여러 모델로 비교할 때:**

```
docs/images/
  F5_솔루션_시스템아키텍처_nanobanana2_이미지생성.prompt.txt
  F5_솔루션_시스템아키텍처_nanobanana2_이미지생성.prompt.md
  F5_솔루션_시스템아키텍처_nanobanana2_20260605-1.png
  F5_솔루션_시스템아키텍처_recraftv4-1_이미지생성.prompt.txt
  F5_솔루션_시스템아키텍처_recraftv4-1_20260605-1.png
```

→ 두 결과를 나란히 놓고 비교, 더 나은 쪽만 슬라이드에 삽입.

### 프롬프트 파일 형식 (`.prompt.txt`)

```
# output: F5_솔루션_시스템아키텍처_recraftv4-1_20260605-1.png
# model: fal-ai/recraft-v3            ← 파일명의 모델명과 반드시 일치
# size: landscape_16_9
# seed:                                ← 재생성 필요 시 seed 고정

A polished technical figure in the style of a top-tier paper...

[negative] neon, glow, dark background, watermark, broken text
```

- `output:` — 저장 파일명. 날짜·시퀀스 포함 (`genmedia run --output docs/images/{output}`)
- `model:` — **파일명의 모델명과 반드시 일치** (불일치 시 재현 불가)
- `seed:` — 동일 이미지 재생성 필요 시 채움

### Claude 지시 패턴

```
# ✅ 프롬프트 파일 먼저 만들고 → 생성
"docs/images/F5_솔루션_시스템아키텍처_recraftv4-1_이미지생성.prompt.txt
 프롬프트로 이미지 생성하고 output 헤더 파일명으로 저장해줘"

# ✅ 대응 .png 없는 .prompt.txt 전부 한 번에
"docs/images/ 안의 .prompt.txt 중 대응하는 .png 없는 것들 전부 생성·저장해줘"
```

---

## 검증된 예시 (실사용 프롬프트)

> 출처: `기능2_업스케일링_개발방법_이미지생성.prompt.txt` or `기능2_업스케일링_개발방법_이미지생성.prompt.md` (Real-ESRGAN 파이프라인 figure).
> "academic-meets-modern" 스타일의 레퍼런스 프롬프트로 그대로 재사용/변형 가능.

```text
# output: 기능2_업스케일링파이프라인_flux-dev_20260605-1.png
# model: fal-ai/flux/dev
# size: landscape_16_9

A polished technical figure in the style of a top-tier image processing paper
(CVPR / ECCV / NeurIPS). Light off-white background. Clean modern typography.
Subtle shadows, rounded rectangles, tasteful muted colors.

Top row — pipeline diagram flowing left to right:
Block "Input" (light gray) → Arrow → Block "Preprocessing" (soft teal rounded box)
→ Arrow → Block "Generator G" (soft blue wider box, "RRDB×23", "×4 upscale")
→ Arrow → Block "Post-processing" (soft teal) → Arrow → Block "Output" (soft green).

Bottom row — side-by-side before/after comparison panel with magnified ×4 crop.

Thin connecting arrows, clean labels, refined academic-meets-modern visual style.

[Negative] neon, glow, dark background, futuristic, fluorescent, watermark,
logos, company names, product names, infographic icons, cluttered, overly colorful

[Params] Aspect 16:9 (1920×1080) · off-white bg, soft teal/blue/green accents, black text
```

---

## 도구별 문법 (Tool-Specific Patterns)

같은 스타일 의도를 각 도구 문법으로 옮긴 것. **스타일/배경/컬러/negative는 위 공통 규칙 그대로**, 비율·파라미터만 도구별로 다르다.

### 범용 (Generic / model-agnostic)

자연어 문장 + 명시적 컬러·비율·negative. 위 Skeleton 그대로 사용. 도구를 모를 땐 이 형식으로 작성.

### DALL-E / GPT-image (OpenAI)

- 긴 자연어 서술을 잘 따름 → Skeleton을 **줄글로 풀어서** 작성
- 별도 negative 필드 없음 → 본문에 "avoid neon, dark background, broken text" 식으로 포함
- 비율: `1792×1024`(≈16:9 가로), `1024×1024`, `1024×1792`(세로)
- 한글 텍스트 품질 낮음 → 텍스트는 비우고 HTML 후처리 권장

### Midjourney

```
<scene description>, academic paper figure style, off-white background,
soft teal and blue accents, clean typography --ar 16:9 --style raw --s 250 --no neon, dark background, watermark, text
```

- `--ar 16:9` (PPT 표준), `--style raw`(과한 미감 억제, 도식에 적합)
- `--s`(stylize) 낮게(0~250) → 사실/정돈된 톤. 높이면 알록달록↑
- `--no <list>` 가 negative prompt 역할
- 텍스트 렌더링 약함 → 라벨은 후처리

### Nano Banana / Imagen (Gemini)

- 자연어 서술 + 끝에 파라미터 힌트 블록(Style / Aspect ratio / Quality / Colors)을 덧붙이는 형식이 잘 먹힘 (위 검증된 예시가 이 형식)
- 비율: `16:9` 명시
- 한글 텍스트 비교적 나은 편이나, 정확성 필요 시 여전히 HTML 우선

### Stable Diffusion 계열 (SDXL/로컬)

- `positive` / `negative` 프롬프트 필드 분리 → Skeleton을 positive, 위 표준 negative를 그대로 negative에
- 스타일 키워드: `infographic, technical diagram, flat design, clean vector, off-white background`
- 비율: `1344×768`(≈16:9), CFG 5~7, 텍스트는 거의 못 그림 → HTML 후처리 필수

---

## ⛔ API 호출은 genmedia CLI 또는 MCP로 (직접 SDK 코드 작성 금지) — 시간 우선

**직접 SDK 코드를 짜지 말고, 용도에 맞는 도구를 선택한다.**

### 도구 선택 — genmedia vs MCP vs Skills

| 도구 | 역할 | 필수 여부 |
| --- | --- | --- |
| **genmedia CLI** | fal.ai agent-first CLI — 검색·실행·**직접 파일 저장** | ✅ txt→png 배치 워크플로 기본 |
| **genmedia skills** (`genmedia init`) | genmedia **사용법** 번들 — Claude가 CLI 명령을 알고 쓰게 함 | ✅ **필수** (없으면 Claude가 genmedia 명령 모름) |
| **fal.ai MCP** | 원격 HTTP MCP — 자연어 트리거 | 대화 중 즉석 one-off 생성 |
| **Replicate MCP** | 로컬 프로세스 MCP — Replicate 모델 접근 | Replicate 모델 사용 시 |
| **fal.ai/Replicate 플랫폼 Skills** | 모델 선택·프롬프트 노하우 | ⏭️ 선택 — 이 문서가 대체 |

> **Skills 구분**: genmedia 자체 skills(`genmedia init`) ≠ fal.ai 플랫폼 skills(`npx skills add`).
> 전자는 "genmedia CLI 사용법" → 필수. 후자는 "어떤 모델을 쓸지 노하우" → 이 문서로 대체.

#### genmedia 설치 순서 (최초 1회 + 프로젝트별)

```bash
# 1. CLI 설치 (global, 최초 1회)
curl https://genmedia.sh/install -fsS | bash   # macOS/Linux
irm https://genmedia.sh/install.ps1 | iex      # Windows PowerShell

# 2. API 키 설정 (global, 최초 1회)
genmedia setup
# 또는 non-interactive (CI/에이전트):
genmedia setup --non-interactive --api-key "$FAL_KEY"

# 3. 프로젝트 skills 설치 (프로젝트 루트에서, 프로젝트별 1회)
#    .claude/ 디렉토리가 있으면 → .claude/skills/ 에 설치
#    .agents/ 디렉토리가 있으면 → .agents/skills/ 에 우선 설치
#    둘 다 없으면 → 먼저 디렉토리 생성 요구
mkdir -p .claude   # Claude Code 프로젝트는 이미 존재
genmedia init

# 4. skills 디렉토리 커밋 (팀원·다른 에이전트도 동일 컨텍스트)
git add .claude/skills/
git commit -m "chore: add genmedia skill bundle"
```

> genmedia는 `FAL_KEY` 환경변수를 사용한다.
> 프로젝트에서 `FALAI_API_KEY`로 관리하는 경우 셸 프로파일에 `export FAL_KEY="$FALAI_API_KEY"` 추가.

#### genmedia CLI가 배치 워크플로에 적합한 이유

- `genmedia run --output` 으로 **직접 파일 저장** → MCP처럼 URL 반환 후 curl 불필요
- `genmedia models` · `genmedia schema` · `genmedia pricing` — 모델 탐색을 Bash에서 처리
- `--json` 플래그로 Claude Bash tool에서 결과 파싱 가능
- "No MCP required" — MCP 설정 없이 동작

#### txt → png 배치 실행 패턴

```bash
# 단건 (output·model 헤더를 파일에서 읽어 실행)
f="docs/images/F5_솔루션_시스템아키텍처_recraftv4-1_이미지생성.prompt.txt"
model=$(grep '^# model:' "$f" | sed 's/# model: *//')
out=$(grep '^# output:' "$f" | sed 's/# output: *//')
genmedia run "$model" \
  --prompt "$(sed '/^#/d' "$f")" \
  --image-size landscape_16_9 \
  --output "docs/images/$out"

# 대응 .png 없는 .prompt.txt 전부 생성
# output 헤더에 날짜·시퀀스가 포함되므로 헤더 기준으로 경로 결정
for f in docs/images/*.prompt.txt; do
  out="docs/images/$(grep '^# output:' "$f" | sed 's/# output: *//')"
  [ -f "$out" ] && continue
  model=$(grep '^# model:' "$f" | sed 's/# model: *//')
  genmedia run "$model" \
    --prompt "$(sed '/^#/d' "$f")" \
    --image-size landscape_16_9 \
    --output "$out"
done
```

#### fal.ai MCP 트리거 방식 (즉석 생성용)

MCP는 `/command` 같은 슬래시 명령이 아니라 **자연어 대화를 보고 Claude가 자율 판단으로 tool 호출**한다.

```
사용자: "이 파이프라인 figure, academic-meets-modern 스타일로 16:9 만들어줘"
Claude: → fal-ai MCP tool 자동 선택·호출 → URL 반환
        → (저장 경로 지정 시) Bash curl로 로컬 저장
```

### 환경변수 설정 (Windows / macOS / Linux 공통)

> **env 변수명**: fal.ai = `FALAI_API_KEY` (본 프로젝트 표준), Replicate = `REPLICATE_API_TOKEN`
> fal.ai SDK 기본값은 `FAL_KEY`이나, MCP config에서 직접 참조하므로 이름은 자유롭게 지정 가능.

**Step 1 — `.env` 파일에 키 작성** (프로젝트 루트, `.gitignore`에 반드시 포함)

```bash
# .env
FALAI_API_KEY=your-fal-key-here
REPLICATE_API_TOKEN=your-replicate-token-here
```

**Step 2 — 시스템/셸 환경변수로 export** (Claude Code가 이 값을 MCP config에서 읽음)

```bash
# macOS / Linux — ~/.zshrc 또는 ~/.bashrc 에 추가
export FALAI_API_KEY="your-fal-key-here"
export REPLICATE_API_TOKEN="your-replicate-token-here"
# 이후: source ~/.zshrc  (또는 터미널 재시작)

# Windows — PowerShell (영구 설정)
[System.Environment]::SetEnvironmentVariable("FALAI_API_KEY","your-fal-key-here","User")
[System.Environment]::SetEnvironmentVariable("REPLICATE_API_TOKEN","your-replicate-token-here","User")
# 이후: PowerShell 재시작

# Windows — 설정 GUI
# 시스템 속성 → 고급 → 환경 변수 → 사용자 변수 → 새로 만들기
```

> `.env` 파일 직접 로드: `dotenv -e .env -- claude` 식으로 Claude Code를 실행하면 셸 설정 없이도 동작.

**Step 3 — `.mcp.json`에서 참조**

fal.ai는 **원격 HTTP MCP** (로컬 프로세스 없음), Replicate는 **로컬 프로세스 MCP**.

```json
// .mcp.json  또는  ~/.claude/settings.json의 mcpServers 블록
{
  "mcpServers": {
    "fal-ai": {
      "type": "http",
      "url": "https://mcp.fal.ai/mcp",
      "headers": {
        "Authorization": "Bearer ${FALAI_API_KEY}"
      }
    },
    "replicate": {
      "command": "npx",
      "args": ["-y", "replicate-mcp"],
      "env": {
        "REPLICATE_API_TOKEN": "${REPLICATE_API_TOKEN}"
      }
    }
  }
}
```

> `${VAR_NAME}` 형식으로 쓰면 Claude Code가 실행 시 시스템 환경변수에서 자동 치환.
> 키를 값으로 직접 작성하지 말 것 — `.mcp.json`은 git에 커밋될 수 있음.

**Claude Code CLI로 fal.ai MCP 추가 (one-liner 대안)**

```bash
claude mcp add --transport http fal-ai \
  https://mcp.fal.ai/mcp \
  --header "Authorization: Bearer ${FALAI_API_KEY}"
# → ~/.claude/settings.json의 mcpServers에 자동 저장됨
```

> 키는 항상 env로만. 프롬프트·소스·`.mcp.json` 값에 하드코딩 금지.

**fal.ai/Replicate 플랫폼 Skills (선택 — 이 문서로 대체 가능)**

```bash
# 모델 선택·프롬프트 노하우가 필요할 때만 설치
npx skills add replicate/skills
# genmedia init 은 위 "genmedia 설치 순서"에서 별도 처리 (필수)
```

### 시간 절약 포인트

- **변형 N장 동시 생성** → 한 번에 여러 시안 뽑고 고르기 (web UI 1장씩 클릭 ❌)
- **재현성**: 프롬프트·seed·모델명이 대화/파일에 남음 → 동일 톤으로 재생성·일괄 수정
- 에이전트에게 "academic-meets-modern 스타일로 이 figure, 16:9, 4장" 식으로 위 공통 규칙을 그대로 지시

### ⛔ 생성 결과는 반드시 로컬 파일로 저장 (CRITICAL)

**MCP는 URL을 반환한다 — URL만 받고 끝내면 fal.ai/Replicate 웹 GUI에 접속해서 직접 저장해야 하므로, MCP를 쓰는 의미가 없다.**

전체 흐름은 반드시 **MCP 호출 → URL 반환 → 로컬 저장**까지 한 번에 완료해야 한다.

```
# genmedia (배치 워크플로 기본) — 직접 파일 저장, URL 단계 없음
1. genmedia run {model} --prompt "..." --output docs/images/output_01.png
2. 완료 — URL 반환 없이 파일 직접 저장

# fal.ai MCP (즉석 one-off) — URL 반환 후 curl 저장
1. fal-ai MCP tool 호출 (수초 blocking wait)
2. URL 반환: https://fal.ai/cdn/xxxxxxxx.png
3. Bash: curl -fsSL "URL" -o ./docs/images/output_01.png
4. 완료
```

**저장 경로 컨벤션**

```
docs/images/          ← 문서·발표자료용 생성 이미지 기본 위치
  01_설명_aimodelNameVersion_YYYYMMDD-{n}.png
  02_설명_aimodelNameVersion_YYYYMMDD-{n}.png
  ...
```

**Claude에게 지시할 때 저장까지 명시**

```
# ✅ 올바른 지시 — 저장 위치 포함
"academic-meets-modern 스타일로 파이프라인 figure 4장 만들고
 docs/images/01~04_pipeline_aimodelNameVersion_20260605-1.png 로 저장해줘"

# ❌ 잘못된 지시 — URL만 받고 끝남
"이미지 만들어줘"
→ URL만 반환, 로컬 저장 안 됨 → 브라우저 열어야 함
```

> Claude Code는 MCP tool + Bash tool(`curl`)을 연속으로 실행할 수 있다.
> 지시에 저장 경로를 포함하면 URL 반환 즉시 자동으로 `curl` 다운로드까지 처리한다.
> fal.ai CDN URL은 **임시 호스팅**이므로 세션 종료 전에 반드시 로컬 저장할 것.

### Direct vs 중개(fal/replicate) — 공식 MCP & 가격

| Provider | 공식 MCP/Skill | 가격 성격 |
| --- | --- | --- |
| **fal.ai / Replicate** | ✅ 둘 다 공식 MCP + Skill (단일 창구) | 독점 모델은 passthrough+소액 마진, 오픈 모델(FLUX)은 자체 호스팅 경쟁가 |
| **Black Forest Labs (FLUX)** | ✅ 공식 MCP (`black-forest-labs/flux-mcp`) | direct, 중간 마진 없음 |
| **Google (Nano Banana)** | ⚠️ 공식 Gemini CLI 확장(`gemini-cli-extensions/nanobanana`), 단독 MCP는 커뮤니티 | Gemini API direct |
| **OpenAI (gpt-image-2)** | ❌ 공식 image MCP 없음 (커뮤니티만) | API direct만 |

**선택 원칙**

- **독점 모델(gpt-image-2 · nano banana pro)** → OpenAI·Google만 실행. 중개는 재판매이므로 **direct가 같거나 저렴**. 단 마진은 보통 한 자릿수 % → "시간 > 비용"이면 무시 가능.
- **오픈 모델(FLUX)** → 중개사 자체 호스팅이라 direct와 가격 비슷, 차이 미미.

> **이 프로젝트 기준 (몇십 장 규모, fal/replicate 결제 완료)**: 마진은 무의미한 수준 →
> **fal/replicate MCP 단일 창구에서 gpt-image-2 · nano banana · FLUX · Recraft를 그대로 호출**한다.
> direct(BFL MCP, Gemini CLI 확장)는 *특정 모델을 수천 장 단위로 대량 생성해 단가가 중요해질 때*만 고려.

---

## 문서 삽입용 모델 선택 (의미 있는 이미지)

**사업계획서·발표자료에 들어갈 "의미 있는" 이미지(설명용 figure, 라벨 있는 도식, 사실적 비주얼)는 텍스트 렌더링이 강한 최신 모델을 쓴다.**

| 모델 | 강점 | 문서 삽입 적합 |
| --- | --- | --- |
| **GPT Image 2** (`gpt-image-2`, OpenAI) | **in-image 타이포그래피 최강**(텍스트 정확도 ≈99%), 라벨·다이어그램·메뉴·포스터 | 텍스트 라벨 많은 figure 1순위 |
| **Nano Banana Pro** (Gemini 3 Pro Image, Google) | 사실적 묘사·조명·피부질감 최상 + 텍스트 렌더링 우수, 다국어, 멀티이미지 합성 | 사실적 비주얼/제품샷 1순위 (SynthID 워터마크 내장) |
| Nano Banana 2 (Gemini 3.1 Flash Image) | Pro 기능 + Flash 속도, 웹 지식 기반 | 빠른 시안 |
| **Recraft V3** (`recraft-v3`, fal/replicate 경유) | 벡터/SVG풍 깔끔한 선·아이콘·도식, 텍스트 비교적 정확, 브랜드 일관 스타일 | **벡터 인포그래픽 (HTML 대안)**, 아이콘 세트 |
| FLUX 계열 (BFL, fal/replicate 경유) | 빠르고 저렴, 범용 figure·배경 | 대량 시안·배경 |

> ⚠️ **"paperbanana"는 없는 이름** — Google 모델은 **Nano Banana / Nano Banana Pro**다.

### 한글 텍스트 — 규칙 업데이트

> GPT Image 2·Nano Banana Pro는 텍스트 렌더링이 크게 좋아져 **짧은 한글 라벨은 모델 직접 생성도 시도 가능**.
> 단 **표·정밀 정렬·긴 한글 문단·깔끔한 선은 여전히 HTML 우선**(위 HTML-First 규칙 유지). 생성 후 한글은 반드시 눈으로 검수.

---

## Aspect Ratio 빠른 참조 (PPT 기준)

| 용도 | 비율 | 예시 해상도 |
| --- | --- | --- |
| 슬라이드 전체 배경 / figure | **16:9** | 1920×1080 |
| 본문 삽입 다이어그램 | 16:9 또는 4:3 | 1600×900 / 1200×900 |
| 아이콘·정사각 썸네일 | 1:1 | 1024×1024 |
| 세로 포스터/카드 | 9:16, 3:4 | 1080×1920 |

---

## Checklist (이미지 만들기 전)

- [ ] **HTML로 충분한가?** (텍스트·표·선 위주 → HTML 단독. 그러면 여기서 멈춤)
- [ ] 스타일 = academic-meets-modern (off-white bg + soft teal/blue/green accent)?
- [ ] 한글 텍스트를 프롬프트에 직접 넣지 않았나? (→ HTML/슬라이드에서 후처리)
- [ ] 표준 negative prompt 포함 (neon·dark·watermark·broken text 등)?
- [ ] 비율 명시 (PPT면 16:9)?
- [ ] 도구별 문법에 맞게 변환 (Midjourney `--ar/--no`, SD positive/negative 등)?
- [ ] **프롬프트 `.prompt.txt` 파일 먼저 작성** (`output:` · `model:` 헤더 포함)?
- [ ] 파일명 형식 준수? `{슬러그}_{모델명}_이미지생성.prompt.txt`
- [ ] 이미지 파일명 형식 준수? `{슬러그}_{모델명}_{yyyymmdd}-{n}.png`
- [ ] 슬러그·모델명이 프롬프트↔이미지 양쪽에서 일치 (매칭 키)?
- [ ] `model:` 헤더가 파일명 모델명과 일치?
- [ ] 지시에 **저장 경로 명시** (output 헤더 기준)? URL만 받고 끝내지 않음?
