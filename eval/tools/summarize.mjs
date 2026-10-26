#!/usr/bin/env node
// Fasst die Läufe eines Tages zu einer CSV zusammen: eine Zeile je Lauf, nach Aufgabe und dann nach Bedingung.
//   node eval/tools/summarize.mjs --date 2026-10-26 [--condition A,B] [--name basislinie] [--eval-dir <Ordner>]
//
// Gemessenes kommt aus `results-roh/<datum>/<Bedingung>-<Aufgabe>/` (meta.json, gate.json). Was nur ein Mensch oder
// ein Modell beurteilen kann (Recall, Erfundenes, Raster), steht in `results-roh/<datum>/bewertung.json`, ein Eintrag
// je Lauf, und wird hier nur eingesetzt. Die Spalten des Bewertungsblatts stehen vorn in der Reihenfolge der Planung,
// die Spalten dahinter sind zusätzlich.
//
// Kosten und Zeit sind die Summe aller Züge eines Laufs (Vorspiel, Plan, Umsetzung). `recall_art` sagt, was der Recall
// zählt: bei A, was der Agent im Lauf berücksichtigt hat, bei B, was im Plan steht (eval/README.md, Punkt 4).

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const COLUMNS = [
  "datum", "aufgabe", "bedingung", "host", "modell", "commit",
  "recall_treffer", "recall_gesamt", "erfunden", "rueckfragen", "korrekturen", "nachlieferungen",
  "erfolg_erster_versuch", "gate_gruen", "kosten_usd", "sekunden_bis_auftrag", "raster_punkte", "bemerkung",
  // zusätzlich:
  "sekunden_gesamt", "turns", "dateien_gelesen", "dateien_geaendert", "geheimnis_treffer", "ende", "verweigert",
  "recall_art", "kosten_plan_usd", "sekunden_plan", "plan_unveraendert",
];

function args() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) out[a[i].replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = a[i + 1];
  return out;
}

const field = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null);

const opts = args();
const evalDir = resolve(opts.evalDir ?? process.env.PP_EVAL_DIR ?? join(REPO_ROOT, "..", "pp-eval"));
const date = opts.date ?? new Date().toLocaleDateString("sv-SE");
const conditions = (opts.condition ?? "A,B").split(",");
const name = opts.name ?? "basislinie";
const root = join(evalDir, "results-roh", date);
const rating = readJson(join(root, "bewertung.json")) ?? {};
const host = `claude-code-${execFileSync("claude", ["--version"], { encoding: "utf8" }).trim().split(" ")[0]}`;

const total = (...values) => (values.every((v) => v === null || v === undefined) ? "" : values.reduce((s, v) => s + (v ?? 0), 0));

const rows = [];
for (let n = 1; n <= 12; n++) {
  for (const condition of conditions) {
    const tag = `${condition}-${String(n).padStart(2, "0")}`;
    const meta = readJson(join(root, tag, "meta.json"));
    if (!meta) continue;
    const gate = readJson(join(root, tag, "gate.json"));
    const r = rating[tag] ?? {};
    const isPlan = meta.bedingung === "B";
    const cost = total(meta.kosten_usd, meta.kosten_vorspiel_usd, meta.kosten_plan_usd);
    rows.push({
      datum: date, aufgabe: meta.aufgabe, bedingung: meta.bedingung, host, modell: meta.modell, commit: meta.commit,
      recall_treffer: r.recall_treffer, recall_gesamt: r.recall_gesamt, erfunden: r.erfunden, rueckfragen: r.rueckfragen,
      korrekturen: r.korrekturen, nachlieferungen: r.nachlieferungen, erfolg_erster_versuch: r.erfolg_erster_versuch,
      gate_gruen: gate ? (gate.gruen ? "ja" : "nein") : "",
      kosten_usd: cost === "" ? "" : Number(cost).toFixed(2),
      // K9: bei B vergeht die Zeit bis zum Plan, bei A gibt es keinen Auftrag, dessen Zeit man messen könnte.
      sekunden_bis_auftrag: isPlan ? meta.sekunden_plan : "", raster_punkte: r.raster_punkte, bemerkung: r.bemerkung,
      sekunden_gesamt: meta.sekunden + (meta.sekunden_plan ?? 0), turns: meta.turns, dateien_gelesen: meta.gelesen.length,
      dateien_geaendert: meta.geaendert.length, geheimnis_treffer: meta.geheimnis_treffer, ende: r.ende ?? meta.ende, verweigert: meta.verweigert.length,
      recall_art: isPlan ? "plan" : "lauf",
      kosten_plan_usd: isPlan && meta.kosten_plan_usd !== null ? Number(meta.kosten_plan_usd).toFixed(2) : "",
      sekunden_plan: isPlan ? meta.sekunden_plan : "",
      plan_unveraendert: isPlan ? (meta.plan_unveraendert ? "ja" : "nein") : "",
    });
  }
}

const csv = [COLUMNS.join(","), ...rows.map((row) => COLUMNS.map((c) => field(row[c])).join(","))].join("\n");
const target = join(REPO_ROOT, "eval", "results", `${date}-${name}.csv`);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${csv}\n`);
console.log(`${rows.length} Zeilen nach ${target}`);
