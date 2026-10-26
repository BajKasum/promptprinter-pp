#!/usr/bin/env node
// Prüft die Pfade eines Auftrags (bei B eines Plans) gegen den geprüften Commit des Repos der Aufgabe. Das ist die
// maschinelle Hälfte von K2 (Erfundenes): jeder genannte Pfad muss in diesem Stand existieren.
//   node eval/tools/check-paths.mjs --tag C-01 [--date 2026-10-26] [--file auftrag.md] [--eval-dir <Ordner>]
//
// Gelesen werden `results-roh/<datum>/<tag>/meta.json` (Repo und Commit) und der Text (Standard: `auftrag.md`, sonst
// `plan.md`). Das Ergebnis steht auf der Konsole und als `pfade.json` neben dem Text. Ein fehlender Pfad ist ein
// Hinweis, kein Urteil: nennt der Auftrag ihn ausdrücklich als neu anzulegen (eine neue Migration, eine neue Datei),
// ist er nicht erfunden. Das entscheidet, wer bewertet, mit der Zeile aus `fehlend`. Der Exit-Code ist immer 0.
//
// Als Pfad zählt ein Token mit Schrägstrich, dessen letztes Stück eine Dateiendung trägt oder dessen erstes Stück ein
// Eintrag der obersten Ebene des Repos ist, und ein Dateiname mit bekannter Endung. Adressen (`//host/...`) und
// Schrägstrich-Wörter wie `fr/it/es` oder `Pro/Team` zählen nicht.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO_DIRS = { kopie: "promptprinter-kopie", fixture: "fixture-aufgabenliste", hono: "hono-kopie" };
const KNOWN_EXT = "tsx?|jsx?|mjs|cjs|json|md|mdx|sql|css|html|ya?ml|toml|env|txt|sh|lock|conf|config";

const TOKEN = new RegExp(
  `[A-Za-z0-9_@.()\\[\\]{}*$-]+(?:/[A-Za-z0-9_@.()\\[\\]{}*$-]+)+/?|(?<![A-Za-z0-9_/.-])[A-Za-z0-9_.-]+\\.(?:${KNOWN_EXT})(?![A-Za-z0-9_])`,
  "g",
);

function args() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) out[a[i].replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = a[i + 1];
  return out;
}

const git = (cwd, ...params) => execFileSync("git", params, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }).trim();

/** Entfernt Satzzeichen am Rand, die nicht zum Pfad gehören (`.` `,` `;` am Ende, nicht geschlossene Klammern). */
function clean(token) {
  let t = token.replace(/[.,;]+$/, "");
  if (t.startsWith("(") && t.endsWith(")") && t.indexOf(")") === t.length - 1) t = t.slice(1, -1); // "(src/a.ts)" in Klammern gesetzt
  while (t.endsWith(")") && (t.match(/\)/g)?.length ?? 0) > (t.match(/\(/g)?.length ?? 0)) t = t.slice(0, -1).replace(/[.,;]+$/, "");
  while (t.startsWith("(") && (t.match(/\(/g)?.length ?? 0) > (t.match(/\)/g)?.length ?? 0)) t = t.slice(1);
  return t.replace(/^\.\//, "");
}

const globToRegExp = (glob) =>
  new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*")}$`);

function main() {
  const opts = args();
  const tag = opts.tag;
  if (!tag) throw new Error("--tag fehlt (zum Beispiel C-01)");
  const evalDir = resolve(opts.evalDir ?? process.env.PP_EVAL_DIR ?? join(REPO_ROOT, "..", "pp-eval"));
  const date = opts.date ?? new Date().toLocaleDateString("sv-SE");
  const dir = join(evalDir, "results-roh", date, tag);
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
  const fileName = opts.file ?? (existsSync(join(dir, "auftrag.md")) ? "auftrag.md" : "plan.md");
  const text = readFileSync(join(dir, fileName), "utf8").replace(/\r\n/g, "\n");
  const repoDir = join(evalDir, REPO_DIRS[meta.repo]);

  const files = new Set(git(repoDir, "ls-tree", "-r", "--name-only", meta.commit).split("\n").filter(Boolean));
  const dirs = new Set();
  for (const f of files) for (let i = f.indexOf("/"); i !== -1; i = f.indexOf("/", i + 1)) dirs.add(f.slice(0, i));
  const top = new Set([...files, ...dirs].map((p) => p.split("/")[0]));
  const lines = text.split("\n");

  const seen = new Map();
  for (const m of text.matchAll(TOKEN)) {
    if (text.slice(Math.max(0, m.index - 2), m.index) === "//") continue; // Adresse
    const path = clean(m[0]);
    if (!path || seen.has(path)) continue;
    const last = path.replace(/\/$/, "").split("/").pop();
    const hasSlash = path.replace(/\/$/, "").includes("/");
    const looksLikePath = hasSlash ? /\.[A-Za-z0-9]{1,6}$/.test(last) || top.has(path.split("/")[0]) || path.endsWith("/") : true;
    if (looksLikePath) seen.set(path, lines.find((l) => l.includes(m[0])) ?? "");
  }

  const vorhanden = [];
  const teilpfad = [];
  const fehlend = [];
  for (const [path, zeile] of seen) {
    const bare = path.replace(/\/$/, "");
    if (bare.includes("*")) {
      const re = globToRegExp(bare);
      if ([...files].some((f) => re.test(f))) vorhanden.push(path);
      else fehlend.push({ pfad: path, zeile: zeile.trim() });
    } else if (files.has(bare) || dirs.has(bare)) {
      vorhanden.push(path);
    } else {
      // Nur ein Dateiname oder ein zu kurzer Pfad: gibt es ihn irgendwo im Baum?
      const hit = [...files].find((f) => f === bare || f.endsWith(`/${bare}`));
      if (hit) (bare.includes("/") ? teilpfad : vorhanden).push(bare.includes("/") ? { pfad: path, treffer: hit } : path);
      else fehlend.push({ pfad: path, zeile: zeile.trim() });
    }
  }

  const result = { tag, datei: fileName, repo: meta.repo, commit: meta.commit, geprueft: seen.size, vorhanden: vorhanden.length, teilpfad, fehlend };
  writeFileSync(join(dir, "pfade.json"), JSON.stringify({ ...result, vorhandenListe: vorhanden }, null, 2));
  console.log(`${tag} (${fileName}, ${meta.repo} @ ${meta.commit}): ${seen.size} Pfade geprüft, ${vorhanden.length} vorhanden, ${teilpfad.length} nur als Teilpfad, ${fehlend.length} fehlend`);
  for (const t of teilpfad) console.log(`  Teilpfad: ${t.pfad} -> ${t.treffer}`);
  for (const f of fehlend) console.log(`  fehlt: ${f.pfad}   | ${f.zeile.slice(0, 140)}`);
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
