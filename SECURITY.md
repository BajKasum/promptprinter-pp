# Security Policy

`promptprinter-pp` (the `/pp` skill and its local context script) is a solo project run in my spare time. If you find a security vulnerability, please report it privately before you publish it.

## Reporting a vulnerability

**Preferred:** use GitHub's private vulnerability reporting. Open the [Security tab](https://github.com/BajKasum/promptprinter-pp/security), choose "Report a vulnerability", and describe the problem. Only the maintainer can see the report.

**Alternative:** write an email to **kasumbajrami7@gmail.com** with the subject "Security vulnerability promptprinter-pp".

Please do **not** open a public issue or pull request for a vulnerability that is not fixed yet.

It helps if you include:

- what is affected: the file, the command, the version or commit
- how to reproduce it, step by step
- what someone could achieve with it
- a suggested fix, if you have one

## What to expect

This is a hobby project, so I answer as fast as I can: expect a reply within a few days. I cannot promise a fixed deadline. You hear from me when I have read your report and again when the problem is fixed. I ask for a reasonable amount of time to fix it before you publish details. There is no bug bounty. I credit you by name if you want.

## Supported versions

There is no release yet; the repository currently contains documentation and CI only. Once there are releases, the latest release and the current `main` are supported. Older versions are not maintained.

## Scope

In scope is the code and the documentation in this repository. As the skill, the context script and the install script appear, these are examples of what counts:

- a secret that gets through the redaction into a context pack, a search result or a saved prompt
- a command that writes or deletes files outside the folders it is meant to touch (path traversal, symbolic links, overwriting files that are not its own)
- the skill editing a file or running a command without the user's explicit yes
- text inside a scanned repository that overrides the skill's rules (prompt injection)
- the script running code from a repository it only meant to read

Not in scope:

- vulnerabilities in Claude Code, Codex, VS Code, GitHub Copilot, Node.js or the model providers: please report them to the vendor
- the PromptPrinter web app at promptprinter.app: it has its own policy in the repository [BajKasum/PromptPrinter](https://github.com/BajKasum/PromptPrinter/blob/main/SECURITY.md)

## Rules for testing

- Test only on your own machine, with your own repositories and data. Never access data of other people. If you see some by accident, do not keep or share it, and tell me right away.
- No social engineering and no phishing, not even against me.
- Do not send unchecked output of automated scanners. Please verify a finding yourself before you report it.
