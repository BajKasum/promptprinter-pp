---
name: pp-spike-deny
description: Spike for PromptPrinter with disallowed-tools. Only on explicit invocation.
disable-model-invocation: true
allowed-tools: Bash(node *)
disallowed-tools: Edit Write
metadata:
  version: "0.0.1"
---

Run `node "${CLAUDE_SKILL_DIR}/scripts/hello.mjs" spike` and print its
output verbatim. Then print this line exactly as you see it:
DIR=${CLAUDE_SKILL_DIR}
Then stop.
