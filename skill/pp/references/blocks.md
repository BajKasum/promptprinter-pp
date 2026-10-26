# Blocks of a work order

Include a block only if it carries project-specific information.

| # | block | include when | content |
|---|-------|--------------|---------|
| 1 | Goal | always | 1 to 2 sentences: what is different at the end and why |
| 2 | Current state | always (S: one line) | what exists today, with paths and names from the repo |
| 3 | Affected files | candidates found | list of paths, each verified to exist |
| 4 | Requirements | M and up | concrete, testable behaviour |
| 5 | Non-goals | M and up, or when scope can creep | what must NOT be touched |
| 6 | Rules and constraints | a project rule applies | only the relevant rules, with a pointer to the rule file; git workflow if the branch conflicts; open changes in the working tree |
| 7 | Approach | L and up | steps; XL: "work out a plan first and wait for approval" |
| 8 | Edge cases | feature and bugfix from M | the 2 to 5 that can really happen here |
| 9 | Security | a risk flag is set | threat, protection, a test that fails without it |
| 10 | Tests and acceptance | always, at least one testable criterion | list from M |
| 11 | Verification | the project has a gate or test command | the command verbatim from the repo |
| 12 | Assumptions and open points | there are any | marked so the executing agent does not treat them as facts |
| 13 | Report back | M and up | what to report at the end: changed files, test result, open points |

## Anti-padding rules

- No generic lines ("write clean code", "follow best practices").
- No role line ("You are an experienced developer"): coding agents know
  what they are; the space belongs to context.
- What the target agent loads anyway (CLAUDE.md, AGENTS.md) is referenced,
  not copied. Copy a rule verbatim only if it decides this task.
- Say WHAT to do; leave the HOW open where the repo does not prescribe it.
- If the draft exceeds the corridor of its size, cut; never expand.

## Skeletons

- S: Goal, Current state, (Affected files), Rules and Assumptions where they
  apply, Tests and acceptance, Verification.
- M: Goal, Current state, Affected files, Requirements, Non-goals, Rules,
  Edge cases, Tests and acceptance, Verification, Report back.
- L: M plus Approach and, if flagged, Security.
- XL: Goal, "plan first and wait", Current state, Rules, Phases (each with
  its own acceptance), Security, Non-goals, Assumptions, Report back.
