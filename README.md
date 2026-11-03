<div align="center">

<img src="assets/promptprinter-pp-logo.png" alt="PromptPrinter /pp (promptprinter-pp)" width="620" />

</div>

`/pp` turns what you want into one ready-to-use prompt for your coding agent. It reads the context you are already working in (conversation, git state, project structure, rule files, the files that matter for the task), and the agent's own model writes the prompt. It never edits a file and never runs anything without your explicit yes.

> **Status (2026-11-03): version 0.4.0, quality bar not reached in the last measurement.** The skill and its context script exist and work (`skill/pp/`, plus `install.mjs` and tests on Linux, macOS and Windows with Node 22 and 24). Versions 0.1.0 to 0.3.0 were measured on twelve tasks (0.1.0 and 0.2.0 without the script, 0.3.0 with it). They missed the bar every time: recall 84, 88 and 82 of 99 facts where 90 were required, and writing the order cost far more than the limit set for it (about 15 percent of the work; measured 21 to 73 percent). The rating was done by Claude, not blind. Version 0.4.0 fixes defects found in a review (secrets that got through the redaction, a test command fixed to npm, the refused `check` step, a permission rule that was too wide, a bugfix template that asked for a needless test) and was not measured. Whether to measure again is the maintainer's decision.

## What is here

- **`skill/pp/`**: the Agent Skill (version 0.4.0) with four reference files and `scripts/context.mjs`, a Node script without dependencies and without network access (`pack`, `search`, `check`, `save`, `doctor`). Built for Claude Code, where you call it as `/pp`. Without Node 22 or git the skill falls back to reading the repository itself. Only Claude Code was measured, Codex and VS Code Copilot were not.
- **`install.mjs`**: copies the skill to `~/.claude/skills/pp` and `~/.agents/skills/pp` (`--update`, `--force`, `--uninstall`, `--dry-run`).
- **`test/`**: tests for the script and the installer (`npm test`, no dependencies) and a mutation check (`npm run mutation`).
- **`eval/`**: the measurement. Twelve tasks with known facts, three conditions (the raw sentence, plan mode, `/pp`), small Node scripts without dependencies that run the conditions, check the result and compare, and the result tables. The rating was done by Claude, not blind, so differences of a few facts are within the noise.

No server, no account, no telemetry. Nothing leaves your machine except what your own agent already sends to its own model provider.

The redaction works on file names and known patterns. It catches common keys, tokens, assignments and passwords in URLs, not a short password or a secret in an unknown format, and your agent can still read any file with its own tools. Read an order before you share it.

## Install

Run `node install.mjs` in a clone of this repository (Node 22 or newer), or copy the folder `skill/pp/` to `~/.claude/skills/pp/` yourself. Then call `/pp` followed by what you want.

## What the measurement showed

On the eleven tasks where plan mode also has a result (`eval/results/`, rated by Claude, not blind):

| | plan mode | skill 0.1.0 | skill 0.2.0 | skill 0.3.0 (with script) |
|---|---|---|---|---|
| Facts of the task found in the plan or order (bar: 90) | 83 of 99 | 84 | 88 | 82 |
| Rating of the plan or order (bar: 162 of 176) | 153 | 159 | 167 | 170 |
| Tasks done right on the first try | 8 of 11 | 7 | 10 of 11 | 9 of 11 |
| Cost of the order against the work after it (target 15 percent) | | 17 to 74 % | 18 to 51 % | 21 to 73 % |

In all thirty-six runs of the three versions, `/pp` invented no file or function, changed nothing before the yes, and in the one task built to tempt it put no secret from the repository into its output. The script found its way into the order less than hoped: version 0.3.0 gained rating points but not facts. The measurement also found a defect of the skill text: the `check` step was refused by the permission rules in `claude -p` in all twelve runs because the agent piped a here-document into it (`cat | node`); a call with the here-document directly after the command is allowed. Version 0.4.0 tells the agent to use that form; in one trial run with `claude -p`, `pack`, `search` and `check` all ran without a refusal.

## How it relates to PromptPrinter

[PromptPrinter](https://promptprinter.app) is a web app: Finn asks one question and writes a prompt for any AI and any task. `promptprinter-pp` is a separate line next to it, made for people who work in a terminal with a coding agent. The two share ideas, not code: the rules for good prompts are taken from Finn, adapted for coding work. There is no runtime dependency in either direction. `CLAUDE.md` lists which parts of the web app this repository draws from.

## License

[MIT](LICENSE)
