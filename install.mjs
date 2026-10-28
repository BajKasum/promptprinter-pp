#!/usr/bin/env node
// Installiert den Skill /pp: kopiert skill/pp/ nach ~/.claude/skills/pp und ~/.agents/skills/pp.
//   node install.mjs [--target claude|agents|all] [--update] [--force] [--uninstall] [--dry-run] [--home <ordner>]
//
// Fasst nie ein Projekt an und schreibt nie außerhalb der zwei Skill-Ordner. Ein fremder `pp`
// (anderer Autor) wird nur mit --force ersetzt oder entfernt, nach Anzeige, was ersetzt wird.
// Der Ordner .promptprinter/ in den Projekten bleibt bei --uninstall stehen.

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = join(dirname(fileURLToPath(import.meta.url)), "skill", "pp");

function parseArgs(argv) {
  const options = { target: "all", flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--target" || arg === "--home") options[arg.slice(2)] = argv[++i];
    else if (arg.startsWith("--")) options.flags.add(arg.slice(2));
    else options.unknown = arg;
  }
  return options;
}

function frontmatterValue(dir, key) {
  try {
    const text = readFileSync(join(dir, "SKILL.md"), "utf8");
    return text.match(new RegExp(`^\\s*${key}:\\s*"?([^"\\n]+)"?`, "m"))?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

// Vergleich von "0.2.0" mit "0.10.1" nach Zahlen, nicht nach Zeichen.
export function isOlder(a, b) {
  const x = String(a).split(".").map(Number);
  const y = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) < (y[i] ?? 0);
  }
  return false;
}

function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const source = join(from, entry);
    if (statSync(source).isDirectory()) copyDir(source, join(to, entry));
    else copyFileSync(source, join(to, entry));
  }
}

export function install(argv, log = console.log) {
  const options = parseArgs(argv);
  const { flags } = options;
  if (options.unknown || !["claude", "agents", "all"].includes(options.target)) {
    log("usage: node install.mjs [--target claude|agents|all] [--update] [--force] [--uninstall] [--dry-run]");
    return 1;
  }
  const home = resolve(options.home ?? homedir());
  const targets = [];
  if (options.target !== "agents") targets.push(join(home, ".claude", "skills", "pp"));
  if (options.target !== "claude") targets.push(join(home, ".agents", "skills", "pp"));
  const dry = flags.has("dry-run");
  const newVersion = frontmatterValue(SOURCE, "version");
  let failed = false;

  for (const target of targets) {
    const exists = existsSync(target);
    const author = exists ? frontmatterValue(target, "author") : null;
    const version = exists ? frontmatterValue(target, "version") : null;
    const own = author === "PromptPrinter";

    if (flags.has("uninstall")) {
      if (!exists) log(`skip: ${target} is not installed`);
      else if (!own && !flags.has("force")) {
        log(`skip: ${target} is not a PromptPrinter skill (author ${author ?? "unknown"}); use --force to remove it`);
        failed = true;
      } else {
        log(`${dry ? "would remove" : "remove"}: ${target}`);
        if (!dry) rmSync(target, { recursive: true, force: true });
      }
      continue;
    }

    if (exists) {
      const replaceable = flags.has("force") || (flags.has("update") && own && version && isOlder(version, newVersion));
      if (!replaceable) {
        const why = !own
          ? `a skill named pp by ${author ?? "an unknown author"} is there; --force replaces it`
          : flags.has("update")
            ? `version ${version} is not older than ${newVersion}; nothing to update`
            : `version ${version} is installed; use --update to replace it`;
        log(`skip: ${target}: ${why}`);
        if (!own) failed = true;
        continue;
      }
      log(`${dry ? "would replace" : "replace"}: ${target} (${author ?? "unknown"} ${version ?? "?"} -> ${newVersion})`);
      if (!dry) rmSync(target, { recursive: true, force: true });
    } else log(`${dry ? "would install" : "install"}: ${target} (${newVersion})`);
    if (!dry) copyDir(SOURCE, target);
  }

  if (flags.has("uninstall")) log("note: .promptprinter/ folders in your projects stay; delete them yourself if you want.");
  return failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = install(process.argv.slice(2));
}
