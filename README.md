# promptprinter-pp

`/pp` turns what you want into one ready-to-use prompt for your coding agent. It reads the context you are already working in (conversation, git state, project structure, rule files, the files that matter for the task), and the agent's own model writes the prompt. It never edits a file and never runs anything without your explicit yes.

> **Status: ended in this form (2026-10-27).** The skill exists and works, and it was measured on twelve tasks in two rounds. It missed its own quality bar both times (recall 88 of 99 facts where 90 were required, and writing the order cost more than the limit set for it). The repository stays as a record and as a starting point. It is not maintained, and the planned context script was never built.

## What is here

- **`skill/pp/`**: the Agent Skill (version 0.2.0) with four reference files. Built for Claude Code, where you call it as `/pp`. It collects the facts itself; it first tries to call a context script that does not exist and then falls back to reading the repository, which costs one harmless failed call per use. Only Claude Code was measured, Codex and VS Code Copilot were not.
- **`eval/`**: the measurement. Twelve tasks with known facts, three conditions (the raw sentence, plan mode, `/pp`), small Node scripts without dependencies that run the conditions, check the result and compare, and the result tables. The rating was done by Claude, not blind, so differences of a few facts are within the noise.

No server, no account, no telemetry. Nothing leaves your machine except what your own agent already sends to its own model provider.

## Install

Copy the folder `skill/pp/` to `~/.claude/skills/pp/` and call `/pp` followed by what you want. Nothing else is needed.

## What the measurement showed

On the eleven tasks where plan mode also has a result (version 0.2.0 of the skill, `eval/results/`):

| | raw sentence in plan mode | `/pp` |
|---|---|---|
| Facts of the task found in the plan or order | 83 of 99 | 88 of 99 |
| Rating of the plan or order (176 points) | 153 | 167 |
| Tasks done right on the first try | 8 of 11 | 10 of 11 |

In the twelve runs of version 0.2.0, `/pp` invented no file or function, changed nothing before the yes, and in the one task built to tempt it put no secret from the repository into its output. It did not reach the bar of 90 facts. The order cost 45 to 51 percent of what the execution cost on three of the four medium and large tasks (18 percent on the fourth), against a limit of about 15. The order has to read the repository before it can write anything, so that cost is built in.

## How it relates to PromptPrinter

[PromptPrinter](https://promptprinter.app) is a web app: Finn asks one question and writes a prompt for any AI and any task. `promptprinter-pp` is a separate line next to it, made for people who work in a terminal with a coding agent. The two share ideas, not code: the rules for good prompts are taken from Finn, adapted for coding work. There is no runtime dependency in either direction. `CLAUDE.md` lists which parts of the web app this repository draws from.

## License

[MIT](LICENSE)
