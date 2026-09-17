<!-- Source: https://github.com/epicmobile18/dev-standards/tree/main/dev-standards/docs/testing-conventions.md -->
<!-- Version: 1.4.0 -->
<!-- Last Updated: 2026-03-09 -->

# Testing Conventions

## Test Strategy

### Test Priority by Type

| Priority | Type               | Description                                                            | Required                |
| -------- | ------------------ | ---------------------------------------------------------------------- | ----------------------- |
| 1        | Unit Test          | Tests for **small code units** — individual functions/classes          | Required                |
| 2        | Integration Test   | Tests combining multiple modules/components (API, service integration) | Required                |
| 3        | Browser Test (E2E) | Tests for real user flows → see `ui-testing.md`                        | Core plan features only |

> **Follow execution order**: Unit → Integration → Browser (E2E).
> Do not proceed to a lower-level test while a higher-level test is failing.

## Mock Tests — SDK vs REST API

Before writing mock test code, first check whether an **official SDK** for the target service exists in your project's language.

### SDK Usage Criteria

| Condition                                       | Decision        |
| ----------------------------------------------- | --------------- |
| SDK exists + updated within the last 6 months   | ✅ Prefer SDK   |
| SDK exists + last update more than 6 months ago | ❌ Use REST API |
| No SDK                                          | ❌ Use REST API |

**Why prefer SDK**: Using the type/model definitions bundled in the SDK ensures mock object structure matches actual responses, improving test accuracy.

### How to Find SDKs

Check the official package registry and GitHub for each language:

| Language             | Where to Search        | Example Command                        |
| -------------------- | ---------------------- | -------------------------------------- |
| TypeScript / Node.js | npmjs.com              | `npm info {package} time.modified`     |
| Python               | pypi.org               | `pip index versions {package}`         |
| Go                   | pkg.go.dev             | `go list -m -json {module}@latest`     |
| Other                | GitHub / official docs | Search `{service-name} sdk {language}` |

> If update date is hard to confirm, use the last commit date on the GitHub repo.

### ✅ SDK Usage Examples

```typescript
// TypeScript - using built-in SDK types
import Dodopayments from 'dodopayments';
import type { Payment } from 'dodopayments/resources';

const mockPayment: Payment = { ... }; // type-safe mock
```

```python
# Python - using SDK model classes
from dodopayments import Dodopayments
from dodopayments.types import Payment

mock_payment = Payment(id="pay_123", status="succeeded", ...)
```

```go
// Go - using SDK structs
import "github.com/dodopayments/dodopayments-go"

mockPayment := dodopayments.Payment{ID: "pay_123", Status: "succeeded"}
```

### ❌ Direct REST API Usage (when SDK is missing or outdated)

```typescript
// No type safety — structure errors possible
const mockResponse = { id: 'pay_123', status: 'succeeded' };
```

## Self-Improvement Loop

Automatically iterate fixes when errors occur after running tests:

```
1. Write test code
2. Run tests
3. Error? → Analyze cause → Fix code → Back to 2
4. Success? → Move to next step
```

- Prevent infinite loops: report to user after 3 repetitions of the same error
- Watch for regressions in existing functionality when making fixes

## Meaningful Coverage Strategy

### Coverage Type Priority

| Type         | Meaning                       | Target                                   |
| ------------ | ----------------------------- | ---------------------------------------- |
| **Line**     | Lines executed                | Baseline only — insufficient alone       |
| **Branch**   | Both sides of if/else covered | Required (70%+)                          |
| **Mutation** | Code variants caught by tests | Primary quality metric (80%+)            |
| **Path**     | All condition combinations    | Impractical — use property tests instead |

**Goal: Branch + Mutation coverage, not just line coverage.**

### Test Case Discovery Methods

#### Boundary Value Analysis

Test the edges of valid input ranges. Always include: `min`, `min−1`, `max`, `max+1`, `0`, `-1`, `NaN`, `Infinity`, `null`, `undefined`, `""`.

#### Equivalence Partitioning

Group inputs that produce identical behavior → test one representative per group. Skip redundant cases within the same group.

#### Decision Table Testing

List all condition combinations as a table → each row becomes one test case. Essential when multiple conditions interact.

```typescript
// | userPlan   | isRunning | hasCapacity | result            |
// | free       | false     | true        | start             |
// | free       | true      | true        | reject (duplicate)|
// | pro        | false     | false       | queue             |
// | enterprise | false     | false       | priority queue    |
```

#### State Transition Testing

Map all valid transitions → test each path including invalid ones.

```
idle → running → completed
     → running → paused → running
     → running → error → idle (retry)
     → running → error → error (max retry exceeded)
// Also test: completed → running (must throw)
```

### Expanded Tool Map

| Purpose             | TS/JS                  | Python              | Go                     | Rust          |
| ------------------- | ---------------------- | ------------------- | ---------------------- | ------------- |
| Mutation            | Stryker                | mutmut, Cosmic Ray  | gremlins               | cargo-mutants |
| Property/fuzz       | fast-check, @jazzer.js | Hypothesis, atheris | rapid, `go test -fuzz` | proptest      |
| Race condition      | —                      | —                   | `go test -race`        | loom          |
| API contract        | Schemathesis, Pact     | Schemathesis        | Pact                   | —             |
| Snapshot/regression | vitest snapshots       | syrupy              | cupaloy                | —             |

> Core tool selection (Stryker / fast-check / Hypothesis / `go test -race` / Schemathesis) is in `workflow-rules.md`.

### AI Prompt Patterns for Test Case Discovery

AI generates cases; algorithmic tools validate them. Use these prompts in sequence:

**Pattern 1 — Branch analysis (start here)**

```
Analyze this function and list:
1. All branch conditions
2. Boundary values for each condition
3. Invalid inputs (null, undefined, empty, negative, NaN)
4. Concurrency/ordering edge cases
Return case list only — no test code yet:
[paste code]
```

**Pattern 2 — Mutation perspective**

```
Generate 20 mutations for this code:
- Comparison operators (>, >=, <, <=, ===, !==)
- Logic operators (&& → ||)
- Off-by-one (±1 on boundaries)
- Condition inversion (add/remove !)
For each mutation, what test input would catch it?
```

**Pattern 3 — Fix survived mutants (use after Stryker run)**

```
Stryker survived mutants from my last run:

[file: runner.ts, line 42]
Original: if (retryCount >= maxRetry)
Mutated:  if (retryCount > maxRetry)  ← survived

Write the minimum vitest test case(s) to kill each mutant.
```

**Pattern 4 — Assess existing tests**

```
Review these tests and identify:
1. Bugs they would NOT catch
2. Mutants likely to survive (Stryker perspective)
3. Missing test cases (High / Medium / Low priority)

[paste existing test code]
[paste implementation code]
```

### Practical Workflow (AI + Algorithmic Tools)

```
① Write code
② Ask AI for case list (Pattern 1)
③ Add fast-check / Hypothesis property tests (crash + invariant checks)
④ Write unit tests from case list
⑤ Run Stryker → check survived mutants
⑥ Feed survived mutants to AI (Pattern 3) → add missing tests
⑦ Repeat ⑤–⑥ until mutation score ≥ 80%
```

**Key principle**: AI generates candidates; Stryker gives the final verdict — it's math, not opinion.

---

## Browser Test

### When to Run

- Test only **core features related to the current plan** instead of the full 60-minute test suite
- See agent-browser setup in CLAUDE.md and `ui-testing.md`

### UI Screenshots — `scripts/screenshot-ui.sh`

Automated screenshot script. When implementing a new feature, add that page to the script then run it.

**Prerequisites:**

```bash
# 1. Start test DB
docker-compose -f docker-compose.test.yml up -d

# 2. Set environment variables (.env.local)
DATABASE_URL={test_db_url}
```

**Run:**

```bash
bash scripts/screenshot-ui.sh
```

**Output:** `docs/ui-screenshots/*.png` — commit to view instantly on GitHub

**Adding a new page + capturing it (instruction to AI):**

```
Add a screenshot of the /{new-feature-path} page
to the {section-name} section in scripts/screenshot-ui.sh,
then run the script and save the image to docs/ui-screenshots/.
Filename: {feature-name}.png
```

> **Rule**: After modifying the script, always run it → save `docs/ui-screenshots/*.png` → complete `git commit`

### Time Optimization

- Narrow test scope to core features
- Minimize unnecessary navigation and wait times

## QA Documentation

### Scope

| Scope       | File Location          | Content                          |
| ----------- | ---------------------- | -------------------------------- |
| Monorepo QA | `docs/qa/` (root)      | Overall integration test results |
| Subrepo QA  | each `apps/*/docs/qa/` | Individual service test results  |

### Required Items

- Test date
- Test environment (staging/production)
- Pass/Fail per test item
- Cause and action taken for failures

## Test Seed Data Scripts

Rules for managing seed scripts for local DB manual testing.

### Location and Naming

```
scripts/
├── seed-test-users.ts          # common test users
├── seed-{feature-name}-data.ts # feature-specific test data
```

### Creating + Running a New Seed Script (instruction to AI)

```
Create scripts/seed-{feature-name}-data.ts
and run it against the local test DB to actually generate the seed data.

Data to create:
- {model1}: {description}
- {model2}: {description}

DB URL: {DATABASE_URL}
```

> **Rule**: After creating the script, always run it → generate data in DB → verify API behavior using the test commands printed at the end of the script

### Direct Execution

```bash
DATABASE_URL={db_url} {runtime} scripts/seed-{feature-name}-data.ts
# e.g.: DATABASE_URL=postgresql://... tsx scripts/seed-feature-data.ts
```

### Seed Script Writing Principles

- Use upsert → ensures idempotency (safe to run multiple times)
- Use fixed IDs (`id: "seed-{feature}-{entity}"`) → reusable across re-runs
- Print test commands at the end of the script → enables immediate API testing
- Always close DB connection in a `finally` block

---

## Any Backgrounded Test Run — Status Tracking (CRITICAL)

**The enforceable rule (problem statement + must-follow requirements) now lives in `.claude/rules/testing-conventions-critical.md`** — read that first, it's short and auto-loaded every session (this `docs/` file isn't). What follows here is the concrete implementation pattern per language/runner, plus the commit convention.

This monorepo isn't Node/web-only (`packages/python/video-edit-automation` is pytest-based) — the pattern below is language-agnostic even though the first reference implementation happened to be built for the Node/Playwright side of a specific hypeagent E2E investigation. Pick the mechanism that matches what's being run and what runner/language it's in:

### 1a. Playwright — custom reporter

`apps/web-service/tests/e2e/status-reporter.ts` implements Playwright's `Reporter` interface and writes a live status file from `onTestBegin`/ `onTestEnd`/`onEnd` — real structured `TestCase`/`TestResult` objects, no
console-output parsing. Pass it alongside (or instead of) this project's normal reporters via `--reporter=`:

```bash
STATUS_FILE=tests/plan-test/{plan-slug}/results/live-status.md \
  npx playwright test some.spec.ts --project=chromium \
  --reporter=list,./tests/e2e/status-reporter.ts &
# check progress any time, from any turn/session:
cat tests/plan-test/{plan-slug}/results/live-status.md
```

`STATUS_FILE` defaults to `test-results/live-status.md` if unset. The same `Reporter` interface pattern applies to vitest too (its own `Reporter` API is conceptually the same shape: `onInit`/`onTaskUpdate`/`onFinished`) — build a `vitest-status-reporter.ts` the same way if a vitest suite ever needs this; none of this project's vitest suites have been slow/backgrounded enough yet to have needed one.

### 1b. pytest — `pytest-reportlog` (verified live)

`packages/python/video-edit-automation` and any other pytest suite in this monorepo: the `pytest-reportlog` plugin (a separate package — NOT bundled with pytest itself, confirmed live: `--report-log` errors as an unrecognized flag until it's installed) writes one JSON object per line to the given file as the run progresses — confirmed live it's genuinely incremental (checked a file mid-run, during a `time.sleep(2)` inside the still-running first test, and its `setup` event was already on disk), not buffered until the end.

```bash
pip install pytest-reportlog   # add to the package's dev deps if adopting this
pytest --report-log=results/$(date -u +%Y%m%d-%H%M)-my-suite.jsonl tests/ &
# check progress any time — each line is a self-contained JSON event
# (SessionStart / CollectReport / TestReport with nodeid+outcome+when):
tail -5 results/*.jsonl | python3 -m json.tool 2>/dev/null || tail -5 results/*.jsonl
```

No markdown-table conversion needed for this one — the JSONL file itself
already IS the structured, appendable, live status record; read it
directly (`jq`, a one-line `python3 -c` loop, or just `tail`).

### 1c. Other languages — same pattern, not yet used in this monorepo

Neither Go nor Rust is actually used anywhere in this monorepo today, so nothing below is live-verified the way 1a/1b are — treat these as pointers to the known pattern for whenever they show up, not as tested guidance:

- **Go**: `go test -json ./...` is a stable, **built into the toolchain** flag (no extra package, unlike pytest) — emits one JSON `TestEvent` per line (`Action: "run"/"pass"/"fail"/"output"`, per package/test) to stdout as the run progresses. Redirect that stream to a file the same way as pytest's JSONL above.
- **Rust**: stable `cargo test` has no built-in streaming JSON output (`libtest`'s own `--format json` is nightly-only). The practical path is [`cargo-nextest`](https://nexte.st/), which supports a machine-readable
  event stream on stable Rust — check its current docs for the exact flag name before relying on it, since this hasn't been checked against a real run in this repo.
- **Anything else with no hook/plugin/streaming-JSON option at all**: fall back to option 2 or 3 below — the bash library and the external wrapper are both already language-agnostic, since they only need a command to invoke, not a framework-specific API.

### 2. Plain bash verification scripts — sourced library

For the `tests/plan-test/*/verify-*.sh` family (no test framework, no reporter API — a script driving `curl`/real infra calls directly), source `scripts/lib/test-status.sh` and call its functions from inside the script itself — same in-process principle, just for shell:

```bash
#!/bin/bash
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../../scripts/lib/test-status.sh"
status_init "results/$(date -u +%Y%m%d-%H%M)-my-check.md"

status_item "start real instance" running
if curl -sf http://localhost:9000/start-agent -d '...'; then
  status_item "start real instance" passed
else
  status_item "start real instance" failed "curl failed, see script's own output above"
  status_finish failed
  exit 1
fi

status_item "send real message" running
# ...
status_item "send real message" passed "reply length=142"

status_finish passed
```

Call `status_item` after every meaningful step (not just at the end), and call `status_finish` on **every** exit path, including right before an early `exit 1` — not just the happy path, or the status file is left stuck on `RUNNING` forever with no way to tell a real hang apart from a script that just forgot to call it.

### 3. Last resort — external wrapper (only when neither above applies)

`scripts/run-test-with-status.sh` — a runner-agnostic wrapper for cases with no reporter API and no room to add a `source` line (a third-party binary, `go test` on a package you don't want to touch, etc.). Use `setsid`-based process-group killing internally specifically so that killing the wrapper doesn't orphan the real test process (confirmed live this was a real bug in an earlier version — read that script's own header comment before reaching for this option over 1/2 above):

```bash
bash scripts/run-test-with-status.sh results/some-run-status.md -- \
  go test ./... &
cat results/some-run-status.md   # check any time
```

Prefer options 1/2 whenever the test is Playwright, vitest, or a bash script you're writing anyway — this wrapper exists for the remaining gap, not as the default.

### Committing the result — durable history, not the live file itself

The live status file is scratch — it gets overwritten repeatedly during a single run (`RUNNING` → `RUNNING` → `PASSED`/`FAILED`) and is meaningless once the next run starts. **Don't commit that mutable file itself** — committing a single filename that gets silently overwritten run after run produces git history that's just noise (each commit shows "previous run's result → next run's result" with no connecting context).

For a durable, reviewable record of "was this actually run, and what happened" (exactly the gap a repo full of test code with no execution evidence has), copy the **final** status to a timestamped snapshot once the run completes, then **commit and push it** — a snapshot that only exists locally tells no other developer whether this test file has been run at all, let alone whether it passed. Where the snapshot goes depends on whether the test has a canonical framework location (Playwright/vitest/pytest — snapshot lives next to the test code) or is a plain script with no such home (`tests/plan-test/{plan-slug}/`) — full rule, path patterns, and examples: `.claude/rules/testing-conventions-critical.md`, "⛔ Test Artifacts Directory".

This gives an append-only history across time (git log shows every real verification run's actual outcome, in order) instead of one file silently flip-flopping between states with no record of what came before.

## Test Environment

### Stopping Processes

> After testing, always stop all server instances.
> Leaving them running risks zombie processes modifying DB data.

### Node.js Version

- Manage Node version per submodule via `.nvmrc`
- Also specify in `package.json` `engines` field
- On version mismatch, switch with `nvm use` before testing
