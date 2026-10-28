# promptprinter-pp

`/pp` turns what you want into one ready-to-use prompt for your coding agent. It reads the context you are already working in (conversation, git state, project structure, rule files, the files that matter for the task), and the agent's own model writes the prompt. It never edits a file and never runs anything without your explicit yes.

> **Status (2026-10-28): built, measured three times, quality bar not reached.** The skill and its context script exist and work (`skill/pp/`, version 0.3.0, plus `install.mjs` and tests on Linux, macOS and Windows with Node 22 and 24). The skill was measured on twelve tasks three times (0.1.0 and 0.2.0 without the script, 0.3.0 with it). It missed its own bar every time: recall 84, 88 and 82 of 99 facts where 90 were required, and writing the order cost far more than the limit set for it (about 15 percent of the work; measured 21 to 73 percent). The rating was done by Claude, not blind. Whether to go on is the maintainer's decision; the repository is not maintained meanwhile.

## What is here

- **`skill/pp/`**: the Agent Skill (version 0.3.0) with four reference files and `scripts/context.mjs`, a Node script without dependencies and without network access (`pack`, `search`, `check`, `save`, `doctor`). Built for Claude Code, where you call it as `/pp`. Without Node 22 or git the skill falls back to reading the repository itself. Only Claude Code was measured, Codex and VS Code Copilot were not.
- **`install.mjs`**: copies the skill to `~/.claude/skills/pp` and `~/.agents/skills/pp` (`--update`, `--force`, `--uninstall`, `--dry-run`).
- **`test/`**: tests for the script and the installer (`npm test`, no dependencies) and a mutation check (`npm run mutation`).
- **`eval/`**: the measurement. Twelve tasks with known facts, three conditions (the raw sentence, plan mode, `/pp`), small Node scripts without dependencies that run the conditions, check the result and compare, and the result tables. The rating was done by Claude, not blind, so differences of a few facts are within the noise.

No server, no account, no telemetry. Nothing leaves your machine except what your own agent already sends to its own model provider.

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

In all thirty-six runs of the three versions, `/pp` invented no file or function, changed nothing before the yes, and in the one task built to tempt it put no secret from the repository into its output. The script found its way into the order less than hoped: version 0.3.0 gained rating points but not facts. The measurement also found a defect of the skill text: the `check` step was refused by the permission rules in `claude -p` in all twelve runs because the agent piped a here-document into it (`cat | node`); a call with the here-document directly after the command is allowed. The text of version 0.3.0 was not changed after the measurement.

## How it relates to PromptPrinter

[PromptPrinter](https://promptprinter.app) is a web app: Finn asks one question and writes a prompt for any AI and any task. `promptprinter-pp` is a separate line next to it, made for people who work in a terminal with a coding agent. The two share ideas, not code: the rules for good prompts are taken from Finn, adapted for coding work. There is no runtime dependency in either direction. `CLAUDE.md` lists which parts of the web app this repository draws from.

## License

[MIT](LICENSE)
