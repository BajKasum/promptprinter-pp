# Aufgabe 04: Markdown-Export

| Feld | Wert |
|---|---|
| Repo | PromptPrinter, Kopie ohne Remote (`pp-eval/promptprinter-kopie`) |
| Typ, Grösse | Feature, M |
| Repo-Stand | `main` bei `c61b51f` |
| Gold-Fakten geprüft | 2026-10-26, am Code der Kopie |

## Absicht (der rohe Satz)

> Gespeicherte Prompts sollen sich auch als Markdown exportieren lassen

## Vorbereitung

Kopie auf `main` bei `c61b51f`, Arbeitsbaum sauber. Für jeden Lauf ein frischer Worktree dieses Commits. Nichts weiter.

## Vorspiel

Keins. (Eine Variante mit Vorspiel, etwa "wir haben entschieden, Markdown ohne Frontmatter", kommt später dazu und ist nicht Teil dieser Datei.)

## Gold-Fakten

1. Gespeicherte Prompts zeigt die Komponente `SavedPromptList` in `src/features/prompts/components/saved-prompt-list.tsx` (358 Zeilen). Sie wird an zwei Stellen eingebunden: `src/app/(app)/prompts/page.tsx` (Zeile 118) und `src/app/(app)/projects/[id]/(workspace)/results/page.tsx` (Zeile 139). Der Export muss an beiden Stellen funktionieren, und das gelingt über die eine Komponente.
2. Es gibt einen PDF-Export: der Knopf in `saved-prompt-list.tsx` (Zeile 317) erscheint nur bei `canExportPdf`, und `exportPdf()` (Zeile 134) lädt `src/features/prompts/lib/pdf-export.ts` (jsPDF) erst beim Klick. `canExportPdf = isAdmin || plan !== "free"` steht in beiden Seiten (`prompts/page.tsx:59`, `results/page.tsx:75`). `PlanKey` kennt nur `free` und `pro` (`src/shared/lib/plans.ts`), Pro ist nicht kaufbar (`PRO_AVAILABLE = false`): heute sieht den PDF-Knopf also nur ein Admin.
3. **Einen Markdown-Download gibt es schon, im Chat.** `ChatReplyActions.exportMd` in `src/features/chat/components/chat-transcript.tsx` (Zeilen 151 bis 154) ruft `downloadFile` mit dem Dateinamen `prompt-<n>.md`, `markAiMarkdown(content)` und dem Typ `text/markdown` auf. `downloadFile` steht in `src/shared/lib/utils.ts` (Zeile 41), `markAiMarkdown` in `src/shared/lib/ai-marker.ts` (Zeile 28), der Test in `chat-transcript.test.tsx` (Zeile 111). Beides wird wiederverwendet, nichts davon neu gebaut.
4. **Die Freischaltung ist entschieden: Markdown gehört zu jedem Plan, nicht an `canExportPdf`.** Belege: Preisliste Free in `src/shared/i18n/messages/de.ts` (Zeile 806, "Markdown-Export") und die Tabellenzeile "Markdown-Export" (Zeile 686); Hilfe `src/app/(marketing)/docs/ergebnisse/page.tsx` (Zeile 50: "Kopieren und der Markdown-Export sind in jedem Plan dabei") und `docs/plaene-und-limits/page.tsx` (Zeile 49); Kommentar in `results/page.tsx` (Zeile 70: "Free only gets copy/markdown"). Die Frage "gilt dieselbe Grenze wie bei PDF" beantwortet der Code mit Nein. Wer sie als offene Frage stellt, hat nicht nachgesehen; wer die Grenze übernimmt, bricht ein Versprechen in der Preisliste.
5. Der Export trägt die KI-Kennzeichnung (EU-KI-Verordnung Art. 50 Abs. 2): `markAiMarkdown` ist Pflicht, wie beim PDF und beim Chat-Export.
6. Dateiinhalt sind `prompt.title` und `prompt.content` des `SavedPrompt` (Typ in `src/shared/lib/saved-prompts.ts`); ein Dateiname aus dem Titel braucht eine Bereinigung (der PDF-Export reicht `prompt.title` plus `.pdf` unbereinigt an jsPDF weiter, `saved-prompt-list.tsx` Zeile 136; eine Hilfsfunktion `slugify` gibt es in `src/shared/lib/utils.ts`, Zeile 105).
7. Ein neuer UI-Text (Beschriftung, `aria-label`) gehört in alle fünf Wörterbücher (`de.ts`, `en.ts`, `fr.ts`, `it.ts`, `es.ts`), Nachbar ist `t.prompts.exportPdf` (`de.ts:843`). fr, it, es sind nicht von Muttersprachlern geprüft und werden im Pull-Request gekennzeichnet.
8. Tests liegen neben der Datei: `saved-prompt-list.test.tsx` (249 Zeilen) hat die Vorlage für den PDF-Knopf (Zeilen 94 bis 105). `tests/guards/file-size.test.ts` erlaubt höchstens 400 Zeilen je Code-Datei; `saved-prompt-list.tsx` hat 358.
9. Das Gate aus `CLAUDE.md` gilt (siehe Aufgabe 01, Gold-Fakt 8).

## Ausführung erfolgreich

- In `/prompts` und in den Ergebnissen eines Projekts hat jeder gespeicherte Prompt einen Markdown-Knopf, für Free, Pro und Admin sichtbar.
- Der Klick lädt eine `.md`-Datei mit KI-Kennzeichnung (`markAiMarkdown`) und dem Prompt-Inhalt.
- Der Knopf ist in allen fünf Sprachen beschriftet, die Tests (Sichtbarkeit für Free, Download) sind neu, das Gate ist grün.
- `canExportPdf` und der PDF-Knopf sind unverändert.

## Muss

Den Knopf nicht an `canExportPdf` binden (oder die Annahme mit Verweis auf Preisliste und Hilfe markieren). Eine Rückfrage zur Freischaltung ist nicht nötig, weil Preisliste, Hilfe und Code die Antwort geben; eine Rückfrage zu etwas anderem (zum Beispiel Dateiname) ist erlaubt (K4: höchstens 1).

## Bewertungsraster

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | Markdown-Knopf an gespeicherten Prompts, in `/prompts` und im Projekt |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | PDF-Export, `canExportPdf`, **und** der vorhandene Chat-Export `exportMd` sind gefunden |
| Betroffene Dateien | falsch | unvollständig | richtig | `saved-prompt-list.tsx`, fünf Wörterbücher, `saved-prompt-list.test.tsx`; die beiden Seiten nur falls nötig |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | fünf Sprachen, fr/it/es-Hinweis, KI-Kennzeichnung, Tests daneben, 400-Zeilen-Grenze, Gate |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | Freischaltung aus Preisliste und Hilfe belegt, nicht geraten |
| Akzeptanzkriterien | keine | vage | prüfbar | Knopf sichtbar für Free, Datei mit Kennzeichnung, Tests grün |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | wiederverwendet `downloadFile` und `markAiMarkdown`, kein neuer Export-Baustein |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | Dateiname aus dem Titel bereinigt, Kennzeichnung getestet |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan sprach von "Pro, Team, Admin" und stellte offen, ob für Markdown dieselbe Grenze wie bei PDF gilt. Beides ist überholt: `team` ist seit dem 2026-10-25 aus dem Code (Migration 0049), und die Frage ist nach Stand des Repos beantwortet (Fakt 4). Neu und im Plan nicht erwähnt: Der Markdown-Export für Chat-Antworten existiert schon (Fakt 3), die Aufgabe ist damit eine Erweiterung der Liste um einen vorhandenen Baustein, kein neues Feature von Grund auf. Das macht die Aufgabe zu einer guten Probe, ob ein Agent vor dem Bauen sucht.
