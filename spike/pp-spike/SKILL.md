---
name: pp-spike
description: Spike for PromptPrinter. Only on explicit invocation.
disable-model-invocation: true
allowed-tools: Bash(node *)
metadata:
  version: "0.0.1"
---

Run `node "${CLAUDE_SKILL_DIR}/scripts/hello.mjs" spike` and print its
output verbatim. Then print this line exactly as you see it:
DIR=${CLAUDE_SKILL_DIR}
Then stop.
