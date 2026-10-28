// Mutationstests für context.mjs (Hausregel): sichert die Quelle, macht je eine Schranke kaputt, lässt die Tests laufen,
// stellt den Quelltext wieder her. Aufruf: npm run mutation. Jede Zeile muss "erkannt" sein.
import { spawnSync } from "node:child_process";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

const SRC = "skill/pp/scripts/context.mjs";
const BACKUP = "mutation-backup.tmp";
copyFileSync(SRC, BACKUP);
const original = readFileSync(SRC, "utf8");

const ASSIGN_FROM = "NOT_A_VALUE.test(value) ? whole : `${head}[redacted: assignment]`";
const mutations = [
  ["Schwärzmuster AWS entfernt", `  ["aws key", /\\bAKIA[0-9A-Z]{16}/g],\n`, ""],
  ["Schwärzmuster GitHub entfernt", `  ["github token", /\\bgh[pousr]_[A-Za-z0-9]{30,}/g],\n`, ""],
  ["Zuweisung nicht mehr geschwärzt", ASSIGN_FROM, "whole"],
  ["Sperrliste: id_rsa entfernt", `if (base.startsWith("id_rsa") || base.startsWith("id_ed25519")) return true;`, ""],
  ["Sperrliste: .env entfernt", `if (base === ".env" || (base.startsWith(".env.") && base !== ".env.example")) return true;`, ""],
  ["Sperrliste: denyPaths ignoriert", `return (config?.denyPaths ?? []).some((prefix) => clean.startsWith(prefix));`, "return false;"],
  ["save: Link-Prüfung entfernt", `if (!created && lstatSync(home).isSymbolicLink()) {`, "if (false) {"],
  ["save: Zielprüfung entfernt", `if (relative(expected, target) !== "") {`, "if (false) {"],
  ["save: Geheimnisprüfung entfernt", `if (secrets.length) {`, "if (false) {"],
  ["save: überschreibt (kein wx)", `{ flag: "wx" });\n      emit(`, `{ flag: "w" });\n      emit(`],
  ["save: kein Slug-Bereinigen", `.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "auftrag"`, `|| "auftrag"`],
  ["Exit-Code 1 statt 0", `process.exitCode = 0;`, "process.exitCode = 1;"],
  ["Ausnahme in doctor", `function cmdDoctor(options) {`, `function cmdDoctor(options) {\n  throw new Error("mutation");`],
  ["check: Geheimnisfehler weg", `for (const s of findSecrets(rawInput)) result.errors.push(`, `for (const s of []) result.errors.push(`],
  ["check: Pfadprüfung weg", `for (const m of missing.slice(0, 20)) result.hints.push(`, `for (const m of []) result.hints.push(`],
  ["search: Testdatei-Abzug weg", `- (test && penalizeTests ? 1 : 0)`, `- 0`],
  ["search: Deckel ignoriert", `const SIZE_LIMITS = { S: 5, M: 10, L: 15, XL: 15 };`, `const SIZE_LIMITS = { S: 50, M: 50, L: 50, XL: 50 };`],
  ["search: Lockfiles nicht gefiltert", `const NOISE_FILE = /(^|\\/)(package-lock\\.json|`, `const NOISE_FILE = /(^|\\/)(nothing-here|`],
  ["Terme: Shell-Zeichen bleiben", `part.replace(/[^\\p{L}\\p{N}_.\\-/: ]/gu, "")`, `part`],
  ["pack: Status ohne Untracked", `"status", "--porcelain=v1", "-z", "--untracked-files=all"]);\n    if (status != null)`, `"status", "--porcelain=v1", "-z", "--untracked-files=no"]);\n    if (status != null)`],
  ["Netzwerk-Import eingeschleust", `import { promisify } from "node:util";`, `import { promisify } from "node:util";\nimport { get } from "node:https";`],
  ["Shell statt Argumentliste", `const out = execFileSync("git", gitArgs(args), gitOptions(cwd, timeoutMs));`, `const out = execFileSync("git", gitArgs(args), { ...gitOptions(cwd, timeoutMs), shell: true });`],
];

const results = [];
try {
  for (const [name, from, to] of mutations) {
    if (!original.includes(from)) {
      results.push([name, "NICHT ANGEWENDET (Textstelle fehlt)"]);
      continue;
    }
    writeFileSync(SRC, original.replace(from, to));
    const run = spawnSync(process.execPath, ["--test", "test/context.test.mjs"], { encoding: "utf8" });
    results.push([name, run.status === 0 ? "ÜBERLEBT (kein Test schlägt an)" : "erkannt"]);
  }
} finally {
  copyFileSync(BACKUP, SRC);
}
for (const [name, outcome] of results) console.log(`${outcome.startsWith("erkannt") ? "ok " : "!! "} ${name}: ${outcome}`);
console.log(readFileSync(SRC, "utf8") === original ? "Quelltext wiederhergestellt" : "FEHLER: Quelltext weicht ab");
