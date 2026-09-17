<!-- Source(base): https://github.com/epicmobile18/dev-standards/tree/main/dev-standards/docs/CLAUDE.md -->
<!-- Version: 1.0.1 -->
<!-- Last Updated: 2026-03-09 -->

# docs/ - Documentation Directory

> **Writing principle**: AI reads this every conversation — minimize token usage. Be concise and stick to essentials.
>
> **⚠️ No duplication**: Write document content only in CLAUDE.md. Keep README.md minimal.
>
> **When adding new docs**: Update the CLAUDE.md of that directory; add only the filename to README.md.

## Example Directory Structure

```
docs/
├── ui-screenshots/      # Key UI screenshots (update and commit on UI changes)
├── qa/                  # QA test cases
├── api_schema/          # API schema documents
├── payment/             # Payment system integration docs
└── ai-query-list/       # AI conversation logs (by date)
```

## Document Categories

**Environment & Setup**
- `ENVIRONMENT_SETUP.md` - development environment
- `project-summary.md` - project overview
- `requirements.md` - requirements
- `current-status.md` - progress status

**Implementation Guides**
- Feature-specific implementation docs
- API migration guides

**Issues & Tasks**
- Known issue docs
- `task-breakdown.md` - task breakdown

## Parallel Development (Multiple AI Agents)

여러 AI agent가 동시에 같은 repo에서 작업할 때: `parallel-dev-workflow.md` 참조.
핵심: 작업 scope가 겹치면 git worktree로 분리, `.env*` 파일 수동 복사 필수.

## Image Generation (문서/PPT용, optional)

사업계획서·발표자료 이미지를 image 생성 모델로 만들 때: `image-generation-conventions.md` 참조.
핵심: academic-meets-modern 스타일(off-white bg + soft teal/blue/green accent), **인포그래픽·한글 텍스트는 HTML 우선**(모델은 한글·선을 깨뜨림), 도구별(DALL-E/Midjourney/Nano Banana/SD) 문법 정리.

## Writing Rules

- Filenames: `kebab-case.md`
- Add a CLAUDE.md to each subdirectory (AI index)
- Keep README.md as a file list only (no detailed content needed)
