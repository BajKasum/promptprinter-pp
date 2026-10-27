#!/usr/bin/env node
// Stellt C neben B nach den Kriterien von G1 (eval/README.md, "Go/No-Go G1"). Liest die CSV der Basislinie (A und B) und die
// CSV von C und rechnet auf den Aufgaben, für die beide ein Ergebnis haben.
//   node eval/tools/vergleich.mjs --basis eval/results/2026-10-26-basislinie.csv --c eval/results/2026-10-26-skill-v0.csv [--aufgaben 01,02,03]
//
// Die Schwellen stehen in der README als feste Zahlen für alle elf Aufgaben (Recall 90,3 %, Raster 14,7, Aufgabe 12 rund 73 %).
// Auf einer Teilmenge rechnet das Werkzeug dieselbe Formel mit dem B der Teilmenge und zeigt beide Werte. Ein Zwischenstand ist keine Entscheidung.

import { readFileSync } from "node:fs";

function args() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) out[a[i].replace(/^--/, "")] = a[i + 1];
  return out;
}

/** CSV mit Anführungszeichen und Zeilenumbrüchen in Feldern. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") (row.push(field), (field = ""));
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length > 0) (row.push(field), rows.push(row));
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const opts = args();
const read = (path) => parseCsv(readFileSync(path, "utf8"));
const base = read(opts.basis).filter((r) => r.bedingung === "B");
// --c nimmt eine oder mehrere CSV-Dateien, durch Komma getrennt (Teil 1 und Teil 2).
const c = opts.c.split(",").flatMap(read).filter((r) => r.bedingung === "C");
const wanted = opts.aufgaben?.split(",");

// Nur Aufgaben, bei denen beide ein Ergebnis haben (B-07 hat keins) und die in der Auswahl stehen.
const hasResult = (r) => r.recall_treffer !== "" && r.raster_punkte !== "";
const ids = c.filter(hasResult).map((r) => r.aufgabe).filter((id) => base.some((b) => b.aufgabe === id && hasResult(b)) && (!wanted || wanted.includes(id)));
const pick = (rows) => rows.filter((r) => ids.includes(r.aufgabe));
const bRows = pick(base);
const cRows = pick(c);

const num = (v) => Number(v) || 0;
const sum = (rows, key) => rows.reduce((s, r) => s + num(r[key]), 0);
const recall = (rows) => (100 * sum(rows, "recall_treffer")) / sum(rows, "recall_gesamt");
const raster = (rows) => sum(rows, "raster_punkte") / rows.length;
const count = (rows, key, value) => rows.filter((r) => r[key] === value).length;
const gap = (b, max) => b + 0.4 * (max - b);

const b12 = base.find((r) => r.aufgabe === "12");
const c12 = c.find((r) => r.aufgabe === "12");
const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : "-");

console.log(`Aufgaben: ${ids.join(", ")} (${ids.length})`);
console.log(`| Messwert | B | C | Schwelle auf dieser Auswahl | Schwelle der README (elf Aufgaben) | erfüllt |`);
console.log(`|---|---|---|---|---|---|`);
const rb = recall(bRows);
const rc = recall(cRows);
console.log(`| Recall, % | ${fmt(rb)} | ${fmt(rc)} | ${fmt(gap(rb, 100))} | 90,3 | ${rc >= gap(rb, 100) ? "ja" : "nein"} (Auswahl), ${rc >= 90.3 ? "ja" : "nein"} (README) |`);
const sb = raster(bRows);
const sc = raster(cRows);
console.log(`| Raster, Mittel von 16 | ${fmt(sb, 2)} | ${fmt(sc, 2)} | ${fmt(gap(sb, 16), 2)} | 14,7 | ${sc >= gap(sb, 16) ? "ja" : "nein"} (Auswahl), ${sc >= 14.7 ? "ja" : "nein"} (README) |`);
console.log(`| Erfolg ja / teils / nein | ${count(bRows, "erfolg_erster_versuch", "ja")} / ${count(bRows, "erfolg_erster_versuch", "teils")} / ${count(bRows, "erfolg_erster_versuch", "nein")} | ${count(cRows, "erfolg_erster_versuch", "ja")} / ${count(cRows, "erfolg_erster_versuch", "teils")} / ${count(cRows, "erfolg_erster_versuch", "nein")} | C nicht schlechter | | ${count(cRows, "erfolg_erster_versuch", "ja") >= count(bRows, "erfolg_erster_versuch", "ja") ? "ja" : "nein"} |`);
console.log(`| Erfundenes (K2) | ${sum(bRows, "erfunden")} | ${sum(cRows, "erfunden")} | 0 | 0 | ${sum(cRows, "erfunden") === 0 ? "ja" : "nein"} |`);
console.log(`| Geheimnis-Treffer (K11) | ${sum(bRows, "geheimnis_treffer")} | ${sum(cRows, "geheimnis_treffer")} | 0 | 0 | ${sum(cRows, "geheimnis_treffer") === 0 ? "ja" : "nein"} |`);
{
  const n = cRows.length;
  const facts = sum(cRows, "recall_gesamt");
  const missFacts = (pct) => Math.max(0, Math.ceil((pct / 100) * facts - 1e-9) - sum(cRows, "recall_treffer"));
  const missPoints = (thr) => Math.max(0, Math.ceil(thr * n - 1e-9) - sum(cRows, "raster_punkte"));
  console.log(`| Fehlend bis zur Schwelle, Gold-Fakten | | | ${missFacts(gap(rb, 100))} (Auswahl) | ${missFacts(90.3)} (README) | |`);
  console.log(`| Fehlend bis zur Schwelle, Rasterpunkte | | | ${missPoints(gap(sb, 16))} (Auswahl) | ${missPoints(14.7)} (README) | |`);
}
console.log(`| Rückfragen | ${sum(bRows, "rueckfragen")} | ${sum(cRows, "rueckfragen")} | | | |`);
console.log(`| Nachlieferungen | ${sum(bRows, "nachlieferungen")} | ${sum(cRows, "nachlieferungen")} | | | |`);
console.log(`| Kosten, USD (Summe aller Züge) | ${fmt(sum(bRows, "kosten_usd"), 2)} | ${fmt(sum(cRows, "kosten_usd"), 2)} | | | |`);
if (b12 && c12 && hasResult(c12) && hasResult(b12)) {
  const p = (100 * num(c12.recall_treffer)) / num(c12.recall_gesamt);
  const q = (100 * num(b12.recall_treffer)) / num(b12.recall_gesamt);
  console.log(`| Aufgabe 12, Recall % | ${fmt(q)} | ${fmt(p)} | ${fmt(gap(q, 100))} | rund 73 | ${p >= gap(q, 100) ? "ja" : "nein"} |`);
} else console.log("| Aufgabe 12 | | | | rund 73 | (noch kein Lauf) |");

// K8 und K9 nur für C: Kosten des Auftrags gegen die der Ausführung (Grösse M und L), Zeit bis zum Auftrag.
console.log("\nK8 und K9 (nur C):");
for (const r of cRows) {
  const auftrag = num(r.kosten_auftrag_usd);
  const ausfuehrung = num(r.kosten_usd) - auftrag;
  console.log(`  ${r.aufgabe}${r.modus === "lesend" ? " (lesend, K8 gilt nicht)" : ""}: Auftrag ${fmt(auftrag, 2)} USD von ${fmt(num(r.kosten_usd), 2)} (${fmt((100 * auftrag) / Math.max(ausfuehrung, 0.01), 0)} % der übrigen Kosten, Vorspiel eingerechnet), ${r.sekunden_auftrag} s bis zum Auftrag, Rückfragen ${r.rueckfrage_runden}, Zug 3 ${r.zug3}`);
}
