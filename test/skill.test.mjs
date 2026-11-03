// Tests für den Text des Skills: die Stellen, an denen ein falscher Satz das Verhalten des Agenten ändert.
//   node --test test/*.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { isDeniedPath } from "../skill/pp/scripts/context.mjs";

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "skill", "pp");
const skill = readFileSync(resolve(SKILL_DIR, "SKILL.md"), "utf8");
const frontmatter = skill.split("---")[1];

describe("SKILL.md", () => {
  test("allowed-tools gibt nur das Skript aus dem Skill-Ordner frei", () => {
    // Ein * vor dem Skript-Pfad passte auch auf `node -e "..." context.mjs` und auf eine context.mjs aus dem Repo.
    const rule = frontmatter.match(/^allowed-tools: (.*)$/m)[1];
    assert.ok(rule.startsWith('Bash(node "${CLAUDE_SKILL_DIR}/scripts/context.mjs" *)'), rule);
    assert.equal(rule.match(/Bash\(/g).length, 1);
  });

  test("jeder Aufruf des Skripts hat dieselbe Form wie die Freigabe", () => {
    const calls = skill.match(/node "[^"\n]*"/g);
    assert.ok(calls.length >= 4);
    for (const call of calls) assert.equal(call, 'node "${CLAUDE_SKILL_DIR}/scripts/context.mjs"');
  });

  test("der Entwurf geht als Here-Document direkt hinter den Befehl, nie über eine Pipe", () => {
    assert.match(skill, /context\.mjs" check --size <S\|M\|L\|XL> <<'PP_ORDER'/);
    assert.doesNotMatch(skill, /\bpipe the (draft|order)\b/i);
  });
});

describe("Referenzen", () => {
  test("ein schon roter Test bleibt der Regressionstest", () => {
    const types = readFileSync(resolve(SKILL_DIR, "references", "task-types.md"), "utf8");
    assert.match(types.split("\n").find((line) => line.startsWith("| bugfix")), /already fails is the regression test and stays unchanged/);
  });

  test("die Sperrliste der Prüfliste und die des Skripts decken dieselben Dateien", () => {
    const checklist = readFileSync(resolve(SKILL_DIR, "references", "checklist.md"), "utf8");
    for (const [named, example] of [
      [".dev.vars", ".dev.vars"], [".envrc", ".envrc"], [".git-credentials", ".git-credentials"], ["*.tfvars", "a.tfvars"],
      ["kubeconfig", "kubeconfig"], ["wp-config.php", "wp-config.php"], ["*service-account*.json", "service-account.json"],
      ["*-adminsdk*.json", "x-adminsdk-1.json"], ["*-credentials*.json", "google-credentials.json"],
      ["appsettings.Production*.json", "appsettings.Production.json"], [".docker/config.json", ".docker/config.json"],
      [".kube/", ".kube/config"], [".secrets/", ".secrets/a"],
    ]) {
      assert.ok(checklist.includes(named), `fehlt in checklist.md: ${named}`);
      assert.ok(isDeniedPath(example), `fehlt im Skript: ${example}`);
    }
  });
});
