#!/usr/bin/env node
// Prüft, ob die Bezeichner in Backticks eines Auftrags im geprüften Commit vorkommen (Erfundenes, K2).
//   node eval/tools/check-identifiers.mjs --repo <Ordner> --commit <Hash> <auftrag.md> [--only-missing]
//
// Gezählt werden Wörter in Backticks, die wie ein Bezeichner aussehen (Buchstaben, Ziffern, _ . $ - : ohne Leerzeichen).
// Pfade prüft check-paths.mjs. Ein Bezeichner, der nicht vorkommt, ist nicht automatisch erfunden: der Auftrag darf
// Neues vorschlagen ("neu", "Vorschlag"); die Liste ist das, was ein Mensch ansehen muss. Es wird nie ein Wert ausgegeben,
// nur der Bezeichner aus dem Auftrag.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const options = { _: [] };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--only-missing") options.onlyMissing = true;
  else if (argv[i].startsWith("--")) options[argv[i].slice(2)] = argv[++i];
  else options._.push(argv[i]);
}
if (!options.repo || !options.commit || !options._[0]) {
  console.error("usage: node eval/tools/check-identifiers.mjs --repo <dir> --commit <hash> <file.md> [--only-missing]");
  process.exit(2);
}

const text = readFileSync(options._[0], "utf8");
const found = new Set();
for (const match of text.matchAll(/`([^`\n]{2,80})`/g)) {
  // Aus Ausdrücken wie `can(role, permission)` oder `a.b.c` die Namen einzeln holen.
  for (const word of match[1].split(/[^A-Za-z0-9_$.:\-/]+/)) {
    const clean = word.replace(/^[.:\-/]+|[.:\-/]+$/g, "");
    if (clean.length < 3 || /^\d/.test(clean) || clean.includes("/")) continue;
    if (/^[A-Za-z_$][\w$.:-]*$/.test(clean)) found.add(clean);
  }
}

const present = (term) => {
  try {
    execFileSync("git", ["grep", "-q", "-F", "-e", term, options.commit, "--"], { cwd: options.repo, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const rows = [...found].sort().map((term) => ({ term, present: present(term) }));
const missing = rows.filter((r) => !r.present);
if (!options.onlyMissing) console.log(`${rows.length} Bezeichner geprüft, ${rows.length - missing.length} vorhanden`);
for (const row of options.onlyMissing ? missing : rows.filter((r) => !r.present)) console.log(`fehlt: ${row.term}`);
if (!missing.length) console.log("alle vorhanden");
