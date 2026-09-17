<!-- Source: https://github.com/epicmobile18/dev-standards/tree/main/dev-standards/.claude/rules/testing-conventions-critical.md -->
<!-- Version: 1.0.0 -->
<!-- Last Updated: 2026-08-19 -->

# Testing Conventions (Critical Rules)

This file extracts only the rules from `docs/testing-conventions.md` (full testing strategy, mocking rules, example code) that **must not be missed** — `docs/` isn't auto-loaded every session, which is why this file exists. See @docs/testing-conventions.md for full context/example code.

---

## ⛔ Bug Fix Requires Test Update (CRITICAL)

**When you find a bug and fix the code, don't stop at the production code — the test code that covers that bug must be updated in the same pass.**

This applies without exception, including bugs found during live debugging/investigation outside a planned TDD cycle. Specifically:

- **If an existing test was asserting the buggy behavior** — update that assertion to match the corrected behavior (e.g. flip a test that verified "swallow error → return null" into one that verifies "re-throw").
- **If no existing test covers the case that reproduces the bug** — add a new regression test that reproduces the failure.
- **If the same function has other side effects** (e.g. this fix changes a caller's degrade behavior) — add/update tests that guard that caller's behavior too.

If you fix only the code and leave the tests as-is, the next session/developer may mistake the stale test asserting the buggy state for correct behavior, or the same bug can silently regress without the test suite catching it.

### ✅ Correct

```ts
// packages/host-runtime/src/runtimes/nomad.ts — fixed getNetworkAddressByJobId()
// swallowing even real network errors into null (changed to re-throw)
//
// Tests updated in the same commit/turn:
// - flipped the existing "returns null (not throw) on a network error" test to "throws ..."
// - added a new regression test guarding listAgentInstances()'s per-job degrade behavior
```

### ❌ Prohibited

```
# Fixed the bug in nomad.ts but left __tests__/nomad.test.ts untouched
# → the stale test still asserts "returns null (not throw) on a network error"
#   → the next session may read that test and assume it's the intended behavior,
#      or a regression can slip back in with the test suite staying green
```

---

## ⛔ Test Execution Order (CRITICAL)

**Proceed in the order Unit → Integration → Browser (E2E).** Don't move to a lower (heavier) level while a higher-level test is still failing.

---

## ⛔ Any Backgrounded Test Run — Status Tracking (CRITICAL)

**The risk factor isn't "how long the test takes" — it's "whether it runs detached from the current turn"** (`run_in_background`, `nohup ... &`, or any approach where the result doesn't come back synchronously in the same tool call). A fast `vitest run` that returns its result in the same call is unaffected — this applies from the moment execution goes to the background.

**Background**: This project has repeatedly, empirically confirmed cases where a background-task-completion notification never arrives, arrives late, or arrives wrong, even though the actual process finished normally minutes to tens of minutes earlier (one case: a Playwright run had already finished 14 minutes earlier but was reported as "still waiting"; another case: a wait-loop's grep matched a stale status string from a previous run, so a "completed" notification arrived abnormally fast). The problem isn't the process or the logs — **the notification itself is unreliable**.

### Rules

1. **Every backgrounded test run must keep a live, structured status file updated throughout the run** — a raw log that only leaves a one-line pass/fail at the end isn't enough. At minimum: overall state (`running | passed | failed`), and on failure, the actual error/output text.
2. **The status file must**:
   - **Be cheap to check** — one `cat`/`Read` call must be enough; don't require re-parsing hundreds of log lines or depend on whether a notification arrived.
   - **Keep updating during the run** — don't write only once at the end. Even if checked mid-run (or after a session/turn was interrupted and resumed), it must reflect the real current state.
3. **A status file written directly "inside" the test runner process takes priority over one written by an external wrapper process.** A wrapper that spawns+tails the test command as a separate OS process inherits a whole class of process-management bugs (the child process getting orphaned when the wrapper is killed, needing to propagate signals, etc.) — empirically confirmed (an early wrapper version reproduced exactly this: killing the wrapper left the real test process orphaned). Writing from inside the same process as the runner avoids this problem entirely.
4. **Even after a completion notification arrives, don't trust it as-is — reopen and check the status file directly.** The notification's content and the actual file state can differ (empirically confirmed — see "Background" above). The notification is only a signal to "go check," not the result itself.
5. **When retrying a backgrounded run, delete the previous status file or use a new file path before setting up the wait loop.** Otherwise the wait loop's grep can match a leftover FAILED/PASSED string from the previous run at a point when the new run hasn't written anything yet, and misjudge it as "done" immediately (an empirically confirmed race).

### Implementation Patterns (by language/framework)

Priority rule: **whenever what you're verifying can be expressed with a test framework (vitest/pytest/Playwright/etc.), always use the framework** — a plain bash/curl script is a last resort only for cases a framework genuinely can't cover. Concrete example code lives in `docs/testing-conventions.md`'s "Any Backgrounded Test Run — Status Tracking" section:

| Situation                                       | Approach                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| Playwright                                      | Custom Reporter (`apps/web-service/tests/e2e/status-reporter.ts`)     |
| pytest                                          | `pytest-reportlog` (`--report-log=file.jsonl`, separate pip package)  |
| Go / Rust                                       | `go test -json` / `cargo-nextest` (not yet verified in this monorepo) |
| Plain bash verification script, no framework    | `scripts/lib/test-status.sh` (use via `source`)                       |
| Only when none of the above apply (last resort) | `scripts/run-test-with-status.sh` (generic external wrapper)          |

### Committing Results

Don't commit the live/mutable status file itself — it only leaves a meaningless git diff. Copy the final result as a timestamped snapshot (to the location defined by the "Test Artifacts Directory" rule below), then **commit and push it** — if it only lives locally, no other developer can tell whether this test code is "written but never run / passed / failed / some other state." The record only means something once it's pushed.

---

## ⛔ Test Artifacts Directory (CRITICAL)

**Priority: whenever what you're verifying can be expressed with a test framework (vitest/pytest/Playwright/etc.), always do that.** A plain bash/curl script is a last resort only for cases a framework genuinely can't express (e.g. infrastructure-level checks, process/permission/network-level verification) — not the default choice. Using a framework gets you assertions, a reporter, parallel execution, and CI integration for free.

**Core principle: test code and its execution results must always stay paired** — if the results live somewhere disconnected from the code, whoever opens that test file can't find its execution history. This principle is why the rule splits into two branches below:

### Branch 1 — Plain scripts with no framework (no canonical location exists)

**`tests/plan-test/{plan-slug}/` is the location for "scripts that don't run under a test framework"** (`tests/plan-test/AGENTS.md`: no `vitest.config.ts`/`turbo.json`/CI workflow references this directory — i.e. no framework auto-discovers it). For scripts like bash curl or a ts/mjs check that have no framework or reporter API and thus no canonical location at all, **both** the script and its results live here — the script itself is plan-specific, so code and results naturally pair up in the same directory.

```
tests/plan-test/{plan-slug}/{script}.sh
tests/plan-test/{plan-slug}/results/{YYYYMMDD-HHMM}-{label}.txt
```

### Branch 2 — Framework tests (Playwright/vitest/pytest/etc., already have a canonical location)

Leave the test code **exactly where it already lives** (don't move or copy it) — `tests/plan-test/` is not this code's home. **Store the execution results next to the test code's own directory (in a `results/` subdirectory), not in `tests/plan-test/`** — if code and results sit in different directories, whoever opens that spec file has no way to tell "was this ever run, did it pass."

```
{directory containing the test file}/results/{YYYYMMDD-HHMM}-{plan-slug}-{label}.md
```

Example: if `apps/web-service/tests/e2e/hypeagent-assistant-ui-real-backend.spec.ts` was verified for some plan →
`apps/web-service/tests/e2e/results/20260823-1530-hypeagent-multihost-ha-postmigration.md`

Why the filename includes `{plan-slug}`: since multiple plans can verify the same spec file at different times (while the results location is tied to the code), it must still be possible to trace "which plan's work this result came from" from the filename alone.

The bar isn't "how many times it ran" but "whether routine CI tracks it automatically" — even re-running the same verification multiple times within one plan (confirming a repro, re-verifying after a bug fix, etc.) is in scope every time. Routine tests that run automatically on every commit (`pnpm test`, `turbo run test`, whatever CI runs) are already tracked via CI pass/fail, so they're not a separate snapshot target — the target here is what gets verified manually/one-off during plan work, in between those routine runs.

(`tests/plan-test/AGENTS.md` already presupposes Branch 1's scope — "This is not a regression suite... tests/e2e/ (Playwright, CI-wired) is a separate, unrelated directory".)

`{plan-slug}` = the plan filename with `YYYYMMDD_` and `{status}_` stripped. E.g. `20260527_wip_prompt-injection-cryptic-locket.md` → `prompt-injection-cryptic-locket`. Branch 1's folder name does **not** change even when status moves wip→done.

Even after a session ends, "what command verified what" must survive so the next session can reproduce/regress-check it. Inline curl/scripts get buried in chat and disappear.

### What to Save

| Branch             | File                                                                   | Content                                                                                    |
| ------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1 (plain script)   | `tests/plan-test/{plan-slug}/*.sh` / `*.ts` / `*.mjs`                  | The executed test script (must be re-runnable)                                             |
| 1 (plain script)   | `tests/plan-test/{plan-slug}/results/{YYYYMMDD-HHMM}-{label}.txt`      | One run's result (stdout/stderr, HTTP responses, etc.) — timestamped                       |
| 1 (plain script)   | `tests/plan-test/{plan-slug}/README.md`                                | What this folder verifies + how to run it                                                  |
| 2 (framework test) | `{test code directory}/results/{YYYYMMDD-HHMM}-{plan-slug}-{label}.md` | One run's result (framework status snapshot, summary log, etc.) — code is not copied/moved |

Verification done as inline curl/Bash must also be saved as a `*.sh` file the same way. Don't leave it as chat-only output. **Save the results not just locally but commit + push them** — that's what lets another developer immediately tell whether this test code is "written but not yet run / ran successfully / ran and failed / some other state" (see "Committing Results" above).

### ✅ Correct

```bash
# Branch 1 — Phase 4 verification, 8 curl scenarios that can't be expressed with a framework
mkdir -p tests/plan-test/prompt-injection-cryptic-locket/results
echo '#!/bin/bash
KEY=$1
curl -s ... ' > tests/plan-test/prompt-injection-cryptic-locket/phase4-scenarios.sh
chmod +x tests/plan-test/prompt-injection-cryptic-locket/phase4-scenarios.sh
./tests/plan-test/prompt-injection-cryptic-locket/phase4-scenarios.sh \
  > tests/plan-test/prompt-injection-cryptic-locket/results/20260604-1530-phase4.txt 2>&1
git add tests/plan-test/prompt-injection-cryptic-locket/
git commit -m "test: record phase4 scenario results" && git push

# Branch 2 — re-verifying a Playwright e2e for a specific plan
pnpm --filter kvidai-web-service exec playwright test tests/e2e/hypeagent-assistant-ui-real-backend.spec.ts \
  > /tmp/run.log 2>&1
mkdir -p apps/web-service/tests/e2e/results
cp /tmp/run.log apps/web-service/tests/e2e/results/20260823-1530-hypeagent-multihost-ha-postmigration.md
git add apps/web-service/tests/e2e/results/
git commit -m "test: record hypeagent e2e postmigration result" && git push
```

### ❌ Prohibited

```bash
# Running verification as inline curl only in chat → the next session can't reproduce it
curl -s -X POST http://localhost:3000/api/agent -d '...'  # → result only lives in chat

# Saving results to /tmp → lost on machine reboot
curl ... > /tmp/test.txt

# Saving a framework test's (already has a canonical location) results into tests/plan-test/ → separates code from results
cp run.log tests/plan-test/some-plan/results/20260823-e2e.md   # ← should be apps/web-service/tests/e2e/results/

# Saving results but not pushing → no other developer can tell this test's execution state
git add apps/web-service/tests/e2e/results/ && git commit -m "..."   # missing push
```

The plan file template in `.claude/rules/plan-conventions.md` references the Branch 1 path in one line (`**Test Artifacts**: tests/plan-test/{plan-slug}/`) — if a plan also verified Branch 2 (framework tests), list those result paths in the plan file too.
