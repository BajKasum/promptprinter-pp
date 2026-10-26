#!/usr/bin/env node
// Lässt nach einem Lauf das Gate des Repos im Worktree laufen und hält je Schritt Exit-Code und Dauer fest.
//   node eval/tools/gate.mjs --tag A-01 [--date 2026-10-26] [--eval-dir <Ordner>] [--steps typecheck,test]
//
// "Gate grün" heisst im Eval typecheck, lint, test und build (eval/README.md, "Festlegung zum Gate").
// `audit:gate` läuft nicht mit: es hängt vom Tag ab und sagt nichts über die Änderung des Agenten.
// Kein Schritt wird durch `tail` oder `head` geleitet; der Exit-Code ist der des Schritts selbst.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const PLACEHOLDERS = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
};

const GATES = {
  "01-10": [
    ["typecheck", "npm run typecheck"],
    ["lint", "npm run lint"],
    ["test", "npm run test"],
    ["build", "npm run build", PLACEHOLDERS],
  ],
  11: [["test", "npm test"]],
  12: [
    ["typecheck", "npx tsc -p tsconfig.spec.json"],
    ["test", "npx vp test --run src/utils/cookie.test.ts src/helper/cookie/index.test.ts"],
  ],
};

function args() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) out[a[i].replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = a[i + 1];
  return out;
}

function run(cwd, command, extraEnv) {
  return new Promise((done) => {
    const started = Date.now();
    const child = spawn(command, { cwd, shell: true, env: { ...process.env, ...extraEnv, CI: "1" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    child.on("close", (code) => done({ code, output, seconds: Math.round((Date.now() - started) / 1000) }));
  });
}

const plain = (text) => text.replace(/\x1b\[[0-9;]*m/g, "");

async function main() {
  const opts = args();
  const tag = opts.tag;
  const id = tag.split("-")[1];
  const evalDir = resolve(opts.evalDir ?? process.env.PP_EVAL_DIR ?? join(REPO_ROOT, "..", "pp-eval"));
  const date = opts.date ?? new Date().toLocaleDateString("sv-SE");
  const worktree = join(evalDir, "runs", tag);
  const outDir = join(evalDir, "results-roh", date, tag);
  mkdirSync(outDir, { recursive: true });

  const steps = id === "11" ? GATES[11] : id === "12" ? GATES[12] : GATES["01-10"];
  const wanted = opts.steps?.split(",");
  const results = [];
  for (const [name, command, env] of steps) {
    if (wanted && !wanted.includes(name)) continue;
    let r = await run(worktree, command, env);
    let text = plain(r.output);
    // Unter Windows scheitert `next build` am Schluss gelegentlich mit EBUSY beim Kopieren nach `.next/standalone`,
    // obwohl alles übersetzt ist (am 2026-10-26 auf unverändertem `main` beobachtet). Ein Fehler des Codes ist das
    // nicht: einmal wiederholen, den Versuch aber festhalten.
    let versuche = 1;
    if (name === "build" && r.code !== 0 && text.includes("EBUSY")) {
      writeFileSync(join(outDir, "gate-build-versuch1.log"), text);
      r = await run(worktree, command, env);
      text = plain(r.output);
      versuche = 2;
    }
    writeFileSync(join(outDir, `gate-${name}.log`), text);
    const tests = text.match(/^\s*Tests\s+(.+)$/m)?.[1] ?? null;
    results.push({ schritt: name, exit: r.code, sekunden: r.seconds, tests, versuche });
    console.log(JSON.stringify(results.at(-1)));
  }
  // Mit --steps wird nur wiederholt: die übrigen Schritte aus dem früheren Lauf bleiben stehen, der neue Eintrag ersetzt den alten.
  let merged = results;
  if (wanted && existsSync(join(outDir, "gate.json"))) {
    const earlier = JSON.parse(readFileSync(join(outDir, "gate.json"), "utf8")).schritte;
    merged = [...earlier.filter((e) => !results.some((r) => r.schritt === e.schritt)), ...results];
    merged.sort((a, b) => steps.findIndex((s) => s[0] === a.schritt) - steps.findIndex((s) => s[0] === b.schritt));
  }
  const gruen = merged.length === steps.length && merged.every((r) => r.exit === 0);
  writeFileSync(join(outDir, "gate.json"), JSON.stringify({ gruen, schritte: merged }, null, 2));
  console.log(JSON.stringify({ tag, gruen }));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
