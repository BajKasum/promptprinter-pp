# Target profiles

## claude (Claude Code)
- Reference CLAUDE.md instead of copying it. Claude Code loads CLAUDE.md,
  .claude/CLAUDE.md, CLAUDE.local.md and .claude/rules/; it reads AGENTS.md
  only when none of the CLAUDE.md files exists.
- L and XL: "work out a plan first and wait for approval" (fits plan mode).
- Name files with paths so the agent can read them directly.
- Fresh session: the user saves the order and starts
  `claude "<order>"` or pastes it after /clear.

## codex (Codex)
- Reference AGENTS.md. Codex never loads CLAUDE.md: if the repo has only a
  CLAUDE.md, copy the rules that decide this task verbatim into the order.
- Codex caps AGENTS.md at 32 KiB in total; if the pack warns, say which
  rule lies beyond the cap.
- L and XL: suggest /plan first.
- Fresh session: `codex "<order>"`; /copy copies the last answer.

## generic
- For another agent or a fresh session without rule files: copy the rules
  that decide the task verbatim, describe the current state in more
  detail, keep paths relative to the repo root.
