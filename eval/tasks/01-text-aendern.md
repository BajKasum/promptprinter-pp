# Aufgabe 01: Text ändern

| Feld | Wert |
|---|---|
| Repo | PromptPrinter, Kopie ohne Remote (`pp-eval/promptprinter-kopie`) |
| Typ, Grösse | Änderung, S |
| Repo-Stand | `main` bei `c61b51f` (docs: verweise auf das Schwester-Repo promptprinter-pp) |
| Gold-Fakten geprüft | 2026-10-26, am Code der Kopie |

## Absicht (der rohe Satz)

> Knopf Speichern in den Einstellungen heisst jetzt Übernehmen

## Vorbereitung

Kopie auf `main` bei `c61b51f`, Arbeitsbaum sauber. Für jeden Lauf ein frischer Worktree dieses Commits (die Kopie hat keinen Remote). Nichts weiter.

## Vorspiel

Keins.

## Gold-Fakten

1. Der gemeinte Knopf sitzt in der Leiste "Ungespeicherte Änderungen" in `src/features/settings/components/settings-workspace.tsx` (Zeile 344) und zeigt `t.common.save`.
2. `t.common.save` wird an **drei** Stellen gelesen: `settings-workspace.tsx:344`, `src/features/settings/components/api-keys.tsx:233` und `src/features/chat/components/save-prompt-button.tsx:111`. Den Wert von `common.save` zu ändern würde alle drei ändern, also bekommt der Knopf einen eigenen Schlüssel (zum Beispiel unter `settings`), und `common.save` bleibt.
3. Auf der Einstellungsseite gibt es zwei Knöpfe, die "Speichern" heissen: die Leiste und den API-Key-Knopf (`api-keys.tsx`, eingebunden in `settings-workspace.tsx:240`). Welcher gemeint ist, muss angenommen und als Annahme markiert werden (Leiste); eine Rückfrage ist nicht nötig.
4. Während des Speicherns zeigt derselbe Knopf `t.settings.savingEllipsis` ("Speichern…", `de.ts:368`). Wer nur das Wort des Ruhezustands ändert, lässt "Speichern…" stehen. Der Auftrag muss das nennen und entscheiden oder als Annahme markieren.
5. Alle fünf Wörterbücher unter `src/shared/i18n/messages/` bekommen den neuen Schlüssel: `de.ts`, `en.ts`, `fr.ts`, `it.ts`, `es.ts`. Der Typ `Messages` erzwingt gleiche Schlüssel; `tests/guards/i18n-catalog.test.ts` prüft Platzhalter.
6. Tests, die den Knopf über seinen Namen finden, müssen mit: `src/features/settings/components/settings-workspace.behavior.test.tsx` (`saveButton` mit `/Speichern/` in Zeile 91, `/Speichern…/` in den Zeilen 359 und 378, `/Speichern/` in Zeile 389; dazu Testtitel mit "Speichern" in den Zeilen 296, 314 und 350). `api-keys.test.tsx:151` bleibt unverändert, weil der API-Key-Knopf bleibt.
7. Im Pull-Request-Text steht, dass fr, it und es nicht von Muttersprachlern geprüft sind (Regel in `CLAUDE.md`, Tabelle "Wenn du etwas hinzufügst").
8. Das Gate aus `CLAUDE.md` gilt: `npm run audit:gate && npm run typecheck && npm run lint && npm run test && npm run build`, der Build mit den Platzhaltern `NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co` und `NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key`.

## Ausführung erfolgreich

- Nur die Leiste zeigt "Übernehmen" (Deutsch). Der API-Key-Knopf und der Knopf zum Speichern eines Prompts zeigen weiter "Speichern".
- `common.save` ist unverändert, der neue Schlüssel steht in allen fünf Wörterbüchern.
- Die angepassten Tests und der Rest der Suite sind grün, das Gate ist grün (Festlegung zum Gate: siehe `eval/README.md`).

## Muss

Keine Rückfrage (Grösse S: K4 gleich 0).

## Bewertungsraster

Pro Kriterium 0, 1 oder 2 Punkte, höchstens 16 (Definition in der Planung "Qualität und Evaluation"). Die Spalte rechts sagt, was bei dieser Aufgabe die 2 bedeutet.

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | nur die Leiste, Wortlaut "Übernehmen" |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | `settings-workspace.tsx:344`, `t.common.save`, drei Stellen |
| Betroffene Dateien | falsch | unvollständig | richtig | `settings-workspace.tsx`, fünf Wörterbücher, `settings-workspace.behavior.test.tsx`; nicht `api-keys.tsx`, nicht `save-prompt-button.tsx` |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | eigener Schlüssel, fünf Sprachen, fr/it/es-Hinweis, Gate |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | Wahl der Leiste und der Umgang mit "Speichern…" sind markiert |
| Akzeptanzkriterien | keine | vage | prüfbar | sichtbarer Wortlaut, `common.save` unverändert, Tests grün |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | kein Umbau der Einstellungen, keine neuen Komponenten |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | die Tests, die `/Speichern/` suchen, sind genannt |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan nannte vier Stellen für `common.save` und zählte `project-rail.tsx` dazu. Das stimmt nicht: `project-rail.tsx` hat keinen Speichern-Knopf, die Felder speichern beim Verlassen. Es sind drei Stellen, schon am 2026-10-19 (`09aa56e`). Neu aufgenommen sind die Fakten 4 und 6, die im Plan fehlten.
