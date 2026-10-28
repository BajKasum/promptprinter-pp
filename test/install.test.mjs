// Tests für install.mjs, immer mit einem Wegwerf-Home (--home), nie mit dem echten.
//   node --test test/*.test.mjs

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, test } from "node:test";

import { install, isOlder } from "../install.mjs";

const homes = [];
after(() => homes.forEach((h) => rmSync(h, { recursive: true, force: true })));

function newHome() {
  const home = mkdtempSync(join(tmpdir(), "pp-home-"));
  homes.push(home);
  return home;
}

function run(home, ...args) {
  const lines = [];
  const code = install([...args, "--home", home], (l) => lines.push(l));
  return { code, text: lines.join("\n") };
}

const claudeDir = (home) => join(home, ".claude", "skills", "pp");
const agentsDir = (home) => join(home, ".agents", "skills", "pp");

function fakeSkill(dir, { author, version }) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), `---\nname: pp\nmetadata:\n  version: "${version}"\n  author: "${author}"\n---\n`);
}

describe("install.mjs", () => {
  test("installiert in beide Ordner, mit Skript und Referenzen", () => {
    const home = newHome();
    const { code, text } = run(home);
    assert.equal(code, 0, text);
    for (const dir of [claudeDir(home), agentsDir(home)]) {
      assert.ok(existsSync(join(dir, "SKILL.md")));
      assert.ok(existsSync(join(dir, "scripts", "context.mjs")));
      assert.ok(existsSync(join(dir, "references", "blocks.md")));
    }
  });

  test("--target wählt einen Ordner", () => {
    const home = newHome();
    run(home, "--target", "claude");
    assert.ok(existsSync(claudeDir(home)));
    assert.ok(!existsSync(agentsDir(home)));
    assert.equal(run(home, "--target", "unsinn").code, 1);
  });

  test("--dry-run ändert nichts", () => {
    const home = newHome();
    const { text } = run(home, "--dry-run");
    assert.match(text, /would install/);
    assert.ok(!existsSync(join(home, ".claude")));
  });

  test("ein vorhandener eigener Skill wird ohne Flag nicht ersetzt, mit --update nur wenn älter", () => {
    const home = newHome();
    fakeSkill(claudeDir(home), { author: "PromptPrinter", version: "0.0.1" });
    assert.match(run(home, "--target", "claude").text, /use --update/);
    assert.match(readFileSync(join(claudeDir(home), "SKILL.md"), "utf8"), /0\.0\.1/);
    assert.match(run(home, "--target", "claude", "--update").text, /replace/);
    assert.ok(existsSync(join(claudeDir(home), "scripts", "context.mjs")));
    assert.match(run(home, "--target", "claude", "--update").text, /nothing to update/);
  });

  test("ein fremder pp wird nur mit --force ersetzt", () => {
    const home = newHome();
    fakeSkill(claudeDir(home), { author: "Someone Else", version: "9.9.9" });
    const refused = run(home, "--target", "claude", "--update");
    assert.equal(refused.code, 1);
    assert.match(refused.text, /--force replaces it/);
    assert.match(readFileSync(join(claudeDir(home), "SKILL.md"), "utf8"), /Someone Else/);
    assert.equal(run(home, "--target", "claude", "--force").code, 0);
    assert.match(readFileSync(join(claudeDir(home), "SKILL.md"), "utf8"), /PromptPrinter/);
  });

  test("--uninstall entfernt nur eigene Ordner und sagt, dass .promptprinter bleibt", () => {
    const home = newHome();
    run(home);
    fakeSkill(agentsDir(home), { author: "Someone Else", version: "1.0.0" });
    const { code, text } = run(home, "--uninstall");
    assert.equal(code, 1);
    assert.ok(!existsSync(claudeDir(home)));
    assert.ok(existsSync(agentsDir(home)), "fremder Skill bleibt");
    assert.match(text, /\.promptprinter\/ folders in your projects stay/);
    assert.equal(run(home, "--uninstall", "--force").code, 0);
    assert.ok(!existsSync(agentsDir(home)));
  });

  test("Versionsvergleich nach Zahlen", () => {
    assert.ok(isOlder("0.2.0", "0.10.1"));
    assert.ok(!isOlder("0.10.1", "0.2.0"));
    assert.ok(!isOlder("1.0.0", "1.0.0"));
    assert.ok(isOlder("1.0", "1.0.1"));
  });
});
