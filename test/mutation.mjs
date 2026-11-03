// Mutationstests für context.mjs und den Text des Skills (Hausregel): sichert die Quelle, macht je eine Schranke kaputt,
// lässt die Tests laufen, stellt den Quelltext wieder her. Aufruf: npm run mutation. Jede Zeile muss "erkannt" sein.
import { spawnSync } from "node:child_process";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";

const SRC = "skill/pp/scripts/context.mjs";
const SKILL = "skill/pp/SKILL.md";
const TYPES = "skill/pp/references/task-types.md";
const CHECKLIST = "skill/pp/references/checklist.md";
const BACKUP = "mutation-backup.tmp";

const ASSIGN_FROM = "NOT_A_VALUE.test(value) ? whole : `${head}[redacted: assignment]`";
const context = [
  ["Schwärzmuster AWS entfernt", `  ["aws key", /\\bAKIA[0-9A-Z]{16}/g],\n`, ""],
  ["Schwärzmuster GitHub entfernt", `  ["github token", /\\bgh[pousr]_[A-Za-z0-9]{30,}/g],\n`, ""],
  ["Schwärzmuster Supabase entfernt", `  ["supabase key", /\\bsb_secret_[A-Za-z0-9_-]{16,}/g],\n`, ""],
  ["Schwärzmuster npm entfernt", `  ["npm token", /\\bnpm_[A-Za-z0-9]{30,}/g],\n`, ""],
  ["Bearer ohne Ziffernprobe", `/\\bBearer\\s+(?=[^\\s]*\\d)[A-Za-z0-9`, `/\\bBearer\\s+[A-Za-z0-9`],
  ["URL-Passwort nicht geschwärzt", `  ["url credentials", /\\b[a-z][a-z0-9+.-]*:`, `  ["url credentials", /\\bnie[a-z0-9+.-]*:`],
  ["URL: Platzhalter wird geschwärzt", `(?![$<{[%]|(?:pass|password|changeme|secret|x+)@)`, ``],
  ["Zuweisung nicht mehr geschwärzt", ASSIGN_FROM, "whole"],
  ["Zuweisung: Stichwort service_role entfernt", `|service[_-]?role[_-]?key`, ``],
  ["Zuweisung: Stichwort private_key entfernt", `|private[_-]?key`, ``],
  ["Zuweisung: JSON-Anführungszeichen vor dem Doppelpunkt", `auth[_-]?key)["']?\\s*[:=]`, `auth[_-]?key)\\s*[:=]`],
  ["Zuweisung: Passwort mit $ gilt als Verweis", `/^(?:\\$\\{|\\$[A-Z_][A-Z0-9_]*[;,)]*$|<`, `/^(?:\\$|<`],
  ["Zuweisung: Code wird geschwärzt", `import\\.meta)|\\(/;`, `import\\.meta)/;`],
  ["Langer Block nicht geschwärzt", `(looksEncoded(value) ? "[redacted: long encoded value]" : value)`, `value`],
  ["Langer Block: check meldet nichts", `if ((line.match(LONG_ENCODED) ?? []).some(looksEncoded)) found.push(`, `if (false) found.push(`],
  ["Langer Block: Hash wird geschwärzt", `/[A-Z]/.test(value) && /[a-z]/.test(value) && /\\d/.test(value) && `, ``],
  ["Sperrliste: id_rsa entfernt", `if (base.startsWith("id_rsa") || base.startsWith("id_ed25519")) return true;`, ""],
  ["Sperrliste: .env entfernt", `if (base === ".env" || (base.startsWith(".env.") && base !== ".env.example")) return true;`, ""],
  ["Sperrliste: Einzeldateien entfernt", `if (base === ".dev.vars" || base === ".envrc" || base === ".git-credentials" || base === "kubeconfig" || base === "wp-config.php") return true;`, ""],
  ["Sperrliste: Dienstkonten entfernt", `if (/(^|[-_.])service[-_]?account[^/]*\\.json$|-adminsdk[^/]*\\.json$|[-_]credentials[^/]*\\.json$|^appsettings\\.production[^/]*\\.json$/.test(base)) return true;`, ""],
  ["Sperrliste: secrets-Ordner entfernt", `if (segments.at(-2) === "secrets" && /\\.(ya?ml|json|env|txt)$/.test(base)) return true;`, ""],
  ["Sperrliste: .docker/config.json entfernt", `if (segments.at(-2) === ".docker" && base === "config.json") return true;`, ""],
  ["Sperrliste: denyPaths ignoriert", `return (config?.denyPaths ?? []).some((prefix) => clean.startsWith(prefix));`, "return false;"],
  ["Testbefehl wieder fest auf npm", `if (hasScript("test")) command = TEST_COMMANDS[manager ?? "npm"];`, `if (hasScript("test")) command = "npm run test";`],
  ["Paketmanager: Eintrag ignoriert", `if (TEST_COMMANDS[declared]) return declared;`, ""],
  ["Paketmanager: Lockfile ignoriert", `return LOCKFILES.find(([file]) => existsSync(join(root, file)))?.[1] ?? "npm";`, `return "npm";`],
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
const text = [
  ["allowed-tools wieder mit Stern vor dem Skript", `allowed-tools: Bash(node "\${CLAUDE_SKILL_DIR}/scripts/context.mjs" *)`, `allowed-tools: Bash(node *context.mjs*)`, SKILL],
  ["Aufruf in anderer Form als die Freigabe", `3a. Run \`node "\${CLAUDE_SKILL_DIR}/scripts/context.mjs" pack`, `3a. Run \`node "<skill-dir>/scripts/context.mjs" pack`, SKILL],
  ["check wieder über eine Pipe", `Give the script the draft as a here-document directly behind the command:`, `Pipe the draft into the command:`, SKILL],
  ["Here-Document aus dem Aufruf entfernt", ` <<'PP_ORDER'\n`, `\n`, SKILL],
  ["Bugfix verlangt wieder immer einen Test", `a test that already fails is the regression test and stays unchanged, add one only if no test shows the bug`, `regression test`, TYPES],
  ["Prüfliste ohne neue Sperren", `.docker/config.json, `, ``, CHECKLIST],
];

const results = [];
function runAll(list, defaultFile, testFile) {
  for (const [name, from, to, file = defaultFile] of list) {
    // Git legt die Dateien unter Windows mit CRLF ab, die Textstellen hier enthalten \n.
    const original = readFileSync(file, "utf8").replaceAll("\r\n", "\n");
    if (!original.includes(from)) {
      results.push([name, "NICHT ANGEWENDET (Textstelle fehlt)"]);
      continue;
    }
    copyFileSync(file, BACKUP);
    try {
      writeFileSync(file, original.replace(from, to));
      const run = spawnSync(process.execPath, ["--test", testFile], { encoding: "utf8" });
      results.push([name, run.status === 0 ? "ÜBERLEBT (kein Test schlägt an)" : "erkannt"]);
    } finally {
      copyFileSync(BACKUP, file);
    }
  }
}

const before = [SRC, SKILL, TYPES, CHECKLIST].map((file) => readFileSync(file, "utf8"));
runAll(context, SRC, "test/context.test.mjs");
runAll(text, SKILL, "test/skill.test.mjs");
for (const [name, outcome] of results) console.log(`${outcome.startsWith("erkannt") ? "ok " : "!! "} ${name}: ${outcome}`);
const after = [SRC, SKILL, TYPES, CHECKLIST].map((file) => readFileSync(file, "utf8"));
console.log(before.every((content, i) => content === after[i]) ? "Quelltext wiederhergestellt" : "FEHLER: Quelltext weicht ab");
