<!-- Source: https://github.com/epicmobile18/dev-standards/tree/main/dev-standards/.claude/rules/plan-conventions.md -->
<!-- Version: 1.6.0 -->
<!-- Last Updated: 2026-09-12 -->

# Plans Directory

> **Scope**: Applies to BOTH coding and document writing (business plans, reports, proposals). Map terms via "Code ↔ Document Mapping" below.

## Code ↔ Document Mapping (shared use)

Most sections (naming, status, Changelog, Remaining Tasks, Research Log, Decision Log, mid-work updates, Directory Tracking, "never delete content", done verification) are domain-agnostic — use as-is for both code and docs. Only the "test/implementation" terms are reinterpreted for document work:

| Code term                                 | Document interpretation                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `Implementation & Test Status` → **Impl** | Writing complete?                                                                      |
| **Unit Test** column                      | Internal review (fact/number consistency); for pure prose use `⏭️ doc`                 |
| **Integration Test** column               | Convert & verify (e.g., md→hwpx conversion, opens in Hancom, structure validated)      |
| `Test Execution Results`                  | Conversion/verification results (e.g., validation OK, 0 empty cells, page/table count) |
| `Runnable ✅`                             | Ready to start writing?                                                                |
| "Before Plan **Run**"                     | Before writing/conversion run                                                          |
| `File` column (`abc.ts`)                  | Output file (`*.md`, `*.hwpx`, `*.xlsx`, etc.)                                         |
| `Feature` column                          | Document section / deliverable unit                                                    |
| `git add/commit` in done flow             | If not a git repo (e.g., Google Drive), just rename the file (`_wip_`→`_done_`)        |

> For documents too, **Decision Log · Research Log · Continuous mid-work updates** are mandatory (preserve context against session death).

## Naming Convention

```
YYYYMMDD_{status}_{description}.md
```

| Status | Meaning         |
| ------ | --------------- |
| `todo` | Not yet started |
| `wip`  | In progress     |
| `done` | Completed       |

```
20260130_done_video-edit-skill-setup.md
20260131_wip_add-cli-tests.md
20260201_todo_pypi-publish.md
```

## File Search

**At session start: check for wip plans first. If found, read and resume before starting new work.**

```bash
ls .claude/plans/*_wip_*.md          # in progress — check this first
ls .claude/plans/*_done_*.md         # completed
ls .claude/plans/*_todo_*.md         # to-do
ls -t .claude/plans/*.md | head -5   # latest
```

## File Template

```markdown
---
title: {Title}
created: yyyy-mm-dd
last_updated: YYYY-MM-DD
version: vX.X.X
status: {status}
  - todo: 아직 만들거나 정리할 예정
  - wip: 지금 수정·검증 중
  - done: 현재 작업 완료 상태
  - archived, 또는 deprecated: 더 이상 기본으로 쓰지 않는 과거 버전
  - 재사용 [plan, prompt] 파일에서 done은 “더 이상 안 쓴다”가 아니라 **“현재 작업은 완성된 상태”**로 정의하면 됩니다. 이후 다시 손볼 일이 생기면 잠시 wip로 바꿨다가 검증 후 다시 done으로 돌리면 전혀 이상하지 않습니다.
---

## Command Clarity Check

<!-- Run check per ⛔ Command Clarity Check Before Plan Run section -->

**Runnable**: ✅/❌

---

## Changelog

| Date       | Version | Changes     | Directory | Author |
| ---------- | ------- | ----------- | --------- | ------ |
| YYYY-MM-DD | vX.X.X  | Description | /abs/path | Name   |

---

## Implementation & Test Status

<!-- Docs: File=`*.md`/`*.hwpx`, Feature=section/deliverable, Impl=written, Unit Test=internal review (or ⏭️ doc), Integration Test=convert & verify. See "Code ↔ Document Mapping". -->

| File                     | Feature   | Impl  | Unit Test | Integration Test |
| ------------------------ | --------- | ----- | --------- | ---------------- |
| `apps/api/src/**/abc.ts` | `fn_name` | ✅/❌ | ✅/❌     | ✅/❌/⏭️         |

---

## Remaining Tasks

- [ ] Task 1

---

## Research Log

### Search Keywords

- "exact term used"

### Reference URLs

- https://example.com <!-- record every URL read, even if invalid -->

### Key Findings

- Facts that influenced a decision (not URL summaries)

---

## Decision Log

### {Title} — YYYY-MM-DD

| #   | Option                 | Pros | Cons | Fit when |
| --- | ---------------------- | ---- | ---- | -------- |
| 1   | Option A [recommended] | ...  | ...  | ...      |
| 2   | Option B               | ...  | ...  | ...      |

**Decision**: {choice} — **Why**: {reason}

---

## Decision Conversation Summary

- Initial: {A} → Changed to: {B} — Trigger: {key reason for change}
```

## Status Icons

| Icon | Meaning                  |
| ---- | ------------------------ |
| ✅   | Done / Pass              |
| ❌   | Not done / Fail / N/A    |
| ⏭️   | Skip (condition not met) |
| 🚧   | In progress              |

---

## ⛔ Command Clarity Check Before Plan Run (CRITICAL)

**Before running a plan, verify the command is clear enough on two dimensions. Keep asking until both pass.**

### Structural Check

| Item           | What to confirm                                   |
| -------------- | ------------------------------------------------- |
| Scope          | What is being built or changed?                   |
| Done criteria  | When is it "done"?                                |
| Constraints    | What must not be touched? What must be preserved? |
| Error handling | How are errors/edge cases handled?                |

### Intention Mirror

When the command is ambiguous, state your interpretation and confirm before acting.

```
"I read this as internal cleanup inside auth — does it include API interface changes too?"
```

- Confirm the **direction**, not a file list — files are AI's job to find
- Skip if Done criteria is already unambiguous

### Multiple-Choice Questions

Present options inline in chat as usual. Also write the full pros/cons table to the plan file's Decision Log, then tell the user: `"Detailed comparison written to plan file — check it before deciding."`

```markdown
## Decision Log

### DB choice — YYYY-MM-DD

| #   | Option                   | Pros                   | Cons                 | Fit when                   |
| --- | ------------------------ | ---------------------- | -------------------- | -------------------------- |
| 1   | PostgreSQL [recommended] | ACID, mature           | heavier setup        | team has DB ops experience |
| 2   | SQLite                   | zero-config, fast      | no concurrency       | single-user / local only   |
| 3   | PlanetScale              | serverless, auto-scale | vendor lock-in, cost | serverless env, no DB ops  |

**Decision**: — **Why**:
```

### Answer Validation

If the user picks an option with no explanation on a hard-to-reverse decision, probe once:

```
"You picked [X] — is it because [specific reason]? Just confirming this fits your situation."
```

- Applies when: user answers with just "1", "A", "yes", or mirrors the recommendation verbatim
- Skip for trivial choices; apply on decisions that are hard to reverse or affect large scope

### Run Condition

Proceed when Structural Check is fully ✅ and ambiguous commands are resolved via Intention Mirror.

If blocked → re-ask only the unresolved items, repeat until conditions pass.

### ❌ Blocked Example

```markdown
## Command Clarity Check

| Item           | Status |
| -------------- | ------ |
| Scope          | ✅     |
| Done criteria  | ❌     |
| Constraints    | ✅     |
| Error handling | ❌     |

**Runnable**: ❌
→ Pending:

1. Done criteria: What is the success condition?
2. Error handling: Is rollback required on failure?
```

---

## ⛔ Directory Tracking (CRITICAL)

**A plan file can move across directories. Every write must record which directory it came from.**

| Level | Field                           | Rule                                                            |
| ----- | ------------------------------- | --------------------------------------------------------------- |
| File  | `Created In` header             | Directory where file was first created. **Never changes.**      |
| Entry | `Directory` column in Changelog | Working directory at time of each write. Update on every write. |

```bash
pwd  # check before writing
```

---

## ⛔ Continuous Mid-Work Updates (CRITICAL)

**Create the plan file at task start. Update throughout — never batch-update at the end.**

Sessions can die at any time. If nothing is recorded, the next session starts from scratch with no context.

| When                                      | What to record                                            |
| ----------------------------------------- | --------------------------------------------------------- |
| Task start                                | Remaining Tasks list, approach                            |
| After search/research                     | Search Keywords, Reference URLs, Key Findings             |
| After a decision                          | Decision Log (chosen + rejected + why)                    |
| After each task completes                 | `[ ]` → `[x]`, update Implementation Status               |
| When blocked / direction changes          | What failed, why direction changed                        |
| When scope turns out larger than expected | Stop — report to user, get confirmation before continuing |
| Before session end                        | Current state, next resumption point                      |

### Research Log rules

- Record every search term used (exact)
- Record every URL read (even if invalid/dead)
- Key Findings = facts that influenced a decision — **not** URL summaries

### Decision Log rules

- Always include rejected options with reasons — that's the entire point
- Decision Conversation Summary: record only **moments when a decision changed**, not full conversation

### ❌ Prohibited — batch update at the end

```markdown
## Remaining Tasks

- [ ] Task 1 ← no updates from start to finish

## Research Log

(empty) ← nothing recorded during the session
```

If the session dies in this state, recovery is impossible.

---

## ⛔ Plan File Update Rules (CRITICAL)

When updating, reflect results but **never delete existing scenarios, design, or calculation content**.

| ❌ Avoid                                            | ✅ Correct                                                |
| --------------------------------------------------- | --------------------------------------------------------- |
| Delete scenario details when marking done           | Update header + add Changelog row                         |
| Remove calculation content when adding test results | Update implementation status table with ✅                |
| "Summarize" by deleting detailed formulas           | Add Test Execution Results section below the status table |

**Test Execution Results** go directly below `Implementation & Test Status`:

```markdown
## Test Execution Results

\`\`\`
Test Files N passed (N)
Tests N passed (N)
Duration X.Xs
✓ path/to/test.ts (N tests) Xms
\`\`\`
```

---

## ⛔ Test Artifacts Directory (CRITICAL)

**상세 규칙(우선순위, 경로 규칙, 저장할 것, 예제)은 `.claude/rules/testing-conventions-critical.md`
"Test Artifacts Directory" 섹션 참조** — 테스트 관련 컨벤션이라 그쪽으로 이동함.

여기서 알아야 할 건 하나: plan 파일 자체는 `Implementation & Test Status` 표 위 또는 별도
섹션에 이 경로를 한 줄로 명시해야 한다 (`{plan-slug}` = plan 파일명에서 `YYYYMMDD_` 와
`{status}_` 를 제외한 부분, 예: `20260527_wip_foo.md` → `tests/plan-test/foo/`):

```markdown
**Test Artifacts**: `tests/plan-test/{plan-slug}/`
```

---

## ⛔ Plan File Scope Rules (CRITICAL)

### 1 Plan = 1 Feature

One plan file covers exactly one feature. Bundle = impossible to track. Split when:

| Situation                          | Action           |
| ---------------------------------- | ---------------- |
| 2+ features in one file            | Split by feature |
| Remaining Tasks > 10               | Split by phase   |
| Feature can complete independently | Separate file    |

```
✅ 20260421_wip_login-ui.md
   20260421_wip_login-otp.md

❌ 20260421_wip_login-and-dashboard-and-filter.md
```

### ⛔ Completing a plan — Full Verification Required (CRITICAL)

**Never rename to `done` until ALL of the following pass.**

#### Pre-done Checklist

| Check                        | Condition                                                          |
| ---------------------------- | ------------------------------------------------------------------ |
| Remaining Tasks              | Every `[ ]` is now `[x]` — zero unchecked items                    |
| Implementation & Test Status | No ❌ in **any** column — each ❌ must be ⏭️ with a written reason |
| Scope                        | Nothing promised in the plan was silently dropped                  |

If any check fails → status stays `wip`. Fix or explicitly ⏭️-skip first, then complete.

Auto-done is allowed — but only when the checklist passes 100% objectively.
If anything is ambiguous or requires judgment → stop and report to user instead of self-justifying.

#### ❌ Prohibited

```
# Any ❌ in status table without ⏭️ reason → cannot mark done
| apps/api | scaffold | ✅ | ❌ | ✅ |   ← Unit Test ❌ → stay wip or add ⏭️ reason
| packages/shared | scaffold | ✅ | ❌ | ❌ |   ← two ❌ → stay wip
```

```
# Remaining Tasks still has unchecked items → cannot mark done
- [x] Task 1
- [ ] Task 2    ← unchecked → status must stay wip
```

```
# Rationalizing ❌ as acceptable without writing ⏭️ in the file → prohibited
"Done criteria for FS0 is met. Unit Test is fine to skip since it's scaffold phase."
← NEVER self-justify. Write ⏭️ with reason in the status table, then re-check.
```

#### ✅ Correct flow

<!-- Non-git env (e.g., Google Drive docs): skip git steps, just rename the file -->

```bash
# 1. All tasks [x] and all ❌ resolved (fixed or ⏭️ with reason written in file)
# 2. Auto-rename and commit — no user confirmation needed
mv .claude/plans/20260421_wip_login-otp.md \
   .claude/plans/20260421_done_login-otp.md
git add .claude/plans/          # only if git repo; skip if non-git
git commit -m "docs: complete login-otp plan"   # skip if non-git
```

```markdown
# ✅ Acceptable ⏭️ skip — reason written in the file

| FS0 | apps/api scaffold | ✅ | ⏭️ scaffold only, no logic to test | ✅ |
```
