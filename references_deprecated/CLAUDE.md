<!-- Source: epicmobile18/rules/contextual/CLAUDE.md -->
<!-- Version: 1.1.0 -->
<!-- Last Updated: 2026-04-17 -->

# CLAUDE.md — {PROJECT_NAME}

This file contains guidelines for AI coding agents (e.g., Claude Code) working in this codebase.

---

## Project Overview

| Field | Value |
|-------|-------|
| **Service** | {SERVICE_NAME} |
| **Domain** | {DOMAIN} |
| **Framework** | {FRAMEWORK} |
| **Tech Stack** | {TECH_STACK} |
| **Package Manager** | pnpm |
| **Build Tool** | Turborepo |
| **Deployment** | {DEPLOY_PLATFORM} |

## Directory Structure

```
{project}/
├── apps/                    # Applications (git submodules)
│   ├── {app1}/
│   ├── {app2}/
│   └── ...
├── services/                # Server-side infrastructure
├── packages/                # Shared packages
│   ├── types/               # @{scope}/types
│   ├── config/              # @{scope}/config
│   └── ...
├── infrastructure/          # Infra (Pulumi, Kamal, Docker, PM2, etc.)
├── docs/
├── .claude/
│   └── plans/
├── CLAUDE.md
├── turbo.json
└── pnpm-workspace.yaml
```

## Git Submodules

| Path | Description |
|------|-------------|
| `apps/{name}` | {description} |
| `packages/python/{name}` | {description} |

```bash
# Initialize
git submodule update --init --recursive

# Clone with submodules
git clone --recursive {repo-url}

# Update to latest
git submodule update --remote
```

## Tech Stack

| Area | Technology |
|------|-----------|
| Package Manager | pnpm {version} |
| Build Tool | Turborepo |
| Runtime | Node.js {version}+, Python {version}+ |
| Language | TypeScript, Python |
| Frameworks | {Next.js / Strapi / Remotion / ...} |

## Dev Commands

See `README.md` for dev/build/test/deploy commands.

## Environment Variables

```bash
NODE_ENV=development|staging|production

# {service category 1}
{ENV_VAR}={value}

# {service category 2}
{ENV_VAR}={value}

# Internal
INTERNAL_API_KEY=your-internal-api-key
```

> For each submodule's env vars, see that submodule's `CLAUDE.md`.

## Per-Submodule Guide

**When working on a specific submodule, read its `CLAUDE.md` first.**

| Submodule | CLAUDE.md Location | Key Content |
|-----------|-------------------|-------------|
| `{name}` | `apps/{name}/CLAUDE.md` | {description} |

## Cross-Module Work Guide

### When Modifying Shared Types

1. Modify types in `packages/types/src/`
2. `pnpm --filter @{scope}/types build`
3. Verify types in consuming apps

### When Changes Span Multiple Submodules

Respect dependency order: `types → config → apps`

```bash
# 1. Commit in each submodule individually
cd apps/{submodule}
git add . && git commit -m "feat: {description}"
git push

# 2. Update submodule reference from root (separate commit)
cd {root}
git add apps/{submodule}
git commit -m "chore: update {submodule} submodule"
```

## Key Rules

Details: `.claude/rules/`

| Rule | File |
|------|------|
| Documentation principles (CLAUDE.md vs README.md role separation) | `documentation-rules.md` |
| File path conventions (monorepo vs standalone submodule) | `file-path-rules.md` |
| Git commit messages | `git-commit-rules.md` |
| Plan file conventions | `plan-conventions.md` |
| Workflow checklist | `workflow-rules.md` |

## Coding Conventions

- TypeScript strict mode
- ESLint + Prettier
- {Add framework-specific conventions}

## MCP Servers

Configured centrally in root `.mcp.json`. Submodule `.mcp.json` files are not auto-loaded → add required MCPs to root.

## APM(Agent Package Manager)

A dependency manager for AI agents -- like npm for agent context. `docs/apm-agent-package-manager.md`

## Project-Specific Guides

> Common workflows (bug fix, refactor, submodule, feature): see `.claude/rules/workflow-rules.md`.

### When Modifying TypeScript Packages

1. Modify types in `packages/types/`
2. `pnpm --filter @{scope}/types build`
3. Verify types in consuming apps + `pnpm typecheck`

### When Working on Docker Images

1. Modify `infrastructure/docker/{name}/Dockerfile`
2. `docker build -f infrastructure/docker/{name}/Dockerfile -t {image}:{tag} .`
3. Verify with `docker run --rm -it --entrypoint /bin/bash {image}:{tag}`
4. `docker push {image}:{tag}`

## Browser Automation & UI Screenshots

UI screenshots are more intuitive than code. Committing to `docs/ui-screenshots/` enables instant review on GitHub.

Base guide: `docs/ui-testing.md` (customize as `docs/ui-testing-custom.md` per project)

```bash
# Start local server then take screenshots
npm run dev   # → http://localhost:3000
```

## Notes

- **Python packages** (`packages/python/`) are excluded from the pnpm workspace (no package.json)
- **Environment variables** are managed individually per submodule
- {Add project-specific notes}

## Reference Documents

| Document | Location |
|----------|----------|
| Work plans | `.claude/plans/` |
| API schema | `docs/api_schema/` |
| QA docs | `docs/qa/` |
| {additional docs} | `{path}` |
