# Task types, sizes, risk

| type | signals | core of the order |
|------|---------|-------------------|
| change | rename, change a text, a value, a colour | what, where, one acceptance check |
| bugfix | "doesn't work", error, stack trace or failing test in the session | symptom, reproduction, expected vs actual, prove the cause before fixing, regression test |
| feature | build, implement, add | behaviour, data, interfaces, UI, edge cases, tests |
| refactor | clean up, split, restructure, file too large | behaviour stays identical, tests green before, fence the scope, small steps |
| architecture | how should we, plan how, design, concept for | no code changes; deliverable is a document: options, criteria, recommendation; no "plan first", the document is the plan |
| large-change | complete, system, across, schema plus permissions plus UI | phases, plan first and wait, migration and rollback, security, tests per phase |
| review | check, review, audit, security check | scope, checklist, format of findings, change nothing |

Mixed cases take the blocks of both types.

"Plan how ..." or "design ..." without a request to change code is architecture:
the order asks for the document. "Implement a complete ..." asks for the system
itself and is large-change, however big it sounds.

## Sizes (count logical places, not files)

| size | criteria | order length |
|------|----------|--------------|
| S | 1 to 2 places, no interface, no schema | 50 to 150 words |
| M | 3 to 8 places, or one new endpoint | 150 to 450 words |
| L | schema change or several features | 350 to 900 words |
| XL | architecture, security, migration across layers | 600 to 1500 words, in phases |

## Risk flags

auth, permissions/roles, payments, migration/schema, deleting data,
security, public API, secrets/keys, data export. A flag lifts S to M and
adds the security block.

## Examples

- "Rename the settings save button to Apply": change, S (one key in five
  dictionaries is one place), no flags. Check if the key is shared.
- "Fix the scrolling after regenerate" with a failing test in the session: bugfix, M.
- "Implement a complete role and permission system": large-change, XL,
  flags auth, permissions, migration. Usually needs the one question.
