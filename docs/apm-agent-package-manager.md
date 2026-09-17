# Agent Package Manager

https://microsoft.github.io/apm/quickstart/

## Skills (APM)

Skills are managed via [Microsoft APM](https://github.com/microsoft/apm).

```
.agents/skills/(someSkill)/   ← installed by APM (codex target)
.claude/skills/(someSkill)/   → symlink → .agents/skills/  (Claude Code compatibility)
```

### Install APM (once)

Quickstart: https://microsoft.github.io/apm/quickstart/

```bash
# Linux / macOS
curl -sSL https://aka.ms/apm-unix | sh

# Windows
# irm https://aka.ms/apm-windows | iex

# Alternative (pip)
# pip install apm-cli
```

### Install / Update Skills

```bash
cd /path/to/destination

# Install or update from apm.yml
apm install --target codex

# Recreate symlinks (first install or if removed)
cd .claude/skills
for skill in kvidai-media kvidai-preset kvidai-video-project kvidai-video-use someSkill; do
  ln -sf ../../.agents/skills/$skill $skill
done
```

### Registered Skills (`apm.yml`)

example, Registered Skills may vary by project.

| Skill | Description |
|-------|-------------|
| `kvidai-video-use` | Conversation-driven video editor (subtitles, cuts, color grade) |
| `kvidai-video-project` | Create video projects + AI auto-edit |
| `kvidai-media` | Media upload / management |
| `kvidai-preset` | Preset CRUD |

Source example: `epicmobile18/kvidai-skills` (public or private) — installs from `main` branch.
