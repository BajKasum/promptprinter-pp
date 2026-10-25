# promptprinter-pp

`/pp` turns what you want into one ready-to-use prompt for your coding agent. It reads the context you are already working in (conversation, git state, project structure, rule files, the files that matter for the task), and the agent's own model writes the prompt. It never edits a file and never runs anything without your explicit yes.

> **Status: planning, nothing installable yet.** The repository was created on 2026-10-25. The skill, the context script and the install script are built in phases; none of them exists yet.

## What is planned

- An Agent Skill `/pp` for Claude Code, later the same file for Codex (`$pp`) and VS Code Copilot (`/pp`).
- A small local script (Node, no dependencies) that collects a bounded, redacted context pack and finds candidate files.
- No server, no account, no telemetry. Nothing leaves your machine except what your own agent already sends to its own model provider.

## How it relates to PromptPrinter

[PromptPrinter](https://promptprinter.app) is a web app: Finn asks one question and writes a prompt for any AI and any task. `promptprinter-pp` is a separate product line next to it, for people who work in a terminal with a coding agent. The two share ideas, not code: the rules for good prompts are taken from Finn, adapted for coding work, and the file selection logic follows the web app's project memory. There is no runtime dependency in either direction. `CLAUDE.md` lists which parts of the web app this repository draws from, so a change on one side gets a look on the other.

## License

[MIT](LICENSE)
