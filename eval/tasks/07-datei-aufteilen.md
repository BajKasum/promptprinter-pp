# Aufgabe 07: Datei aufteilen

| Feld | Wert |
|---|---|
| Repo | PromptPrinter, Kopie ohne Remote (`pp-eval/promptprinter-kopie`) |
| Typ, Grösse | Refactoring, L |
| Repo-Stand | `main` bei `c61b51f` |
| Gold-Fakten geprüft | 2026-10-26, am Code der Kopie (Zeilen mit `find` und `wc -l` gezählt) |

## Absicht (der rohe Satz)

> Teile die grösste Datei unter src/features auf

## Vorbereitung

Kopie auf `main` bei `c61b51f`, Arbeitsbaum sauber. Für jeden Lauf ein frischer Worktree dieses Commits. Vor dem Lauf läuft die Test-Suite einmal grün (Ausgangslage für "Tests unverändert grün").

## Vorspiel

Keins.

## Gold-Fakten

1. Die grösste Datei unter `src/features` ist eine Testdatei: `src/features/chat/components/chat.test.tsx` mit 941 Zeilen. Als Code-Datei ist es `src/features/marketing/components/hero.tsx` mit 591 Zeilen.
2. `hero.tsx` steht auf der Nicht-anfassen-Liste (`CLAUDE.md`: Hero-Demo, Abschnitt "Nicht anfassen"; Tabelle der Landing Page) und mit der Obergrenze 610 im Guard `tests/guards/file-size.test.ts`. Sie wird **nicht** aufgeteilt.
3. Der Guard `file-size.test.ts` erlaubt höchstens 400 Zeilen je Code-Datei und nimmt Testdateien aus (`/\.test\.tsx?$/` wird gefiltert). Keine Code-Datei ausser `hero.tsx` liegt darüber: der Guard erzwingt hier nichts.
4. Die nächsten Code-Dateien sind `src/features/chat/components/voice-bar.tsx` (367 Zeilen), `src/features/chat/lib/chat-persistence.ts` (361) und `src/features/auth/components/sign-up-experience.tsx` (361). Die Zahl für `project-brain.tsx` (399 im Plan) stimmt nicht mehr: die Datei hat 300 Zeilen.
5. Der Auftrag ist mehrdeutig (Testdatei oder Code-Datei, `hero.tsx` ausgenommen). Eine Rückfrage oder eine markierte Annahme ist verlangt; die Annahme "Code-Datei ausser `hero.tsx`" ist begründbar, die Wahl von `chat.test.tsx` ebenso, wenn sie genannt wird.
6. Wer `voice-bar.tsx` wählt: Es exportiert nur `VoiceBar` (Zeile 49), hat 14 Importe, wird von `chat.tsx` genutzt, und seine Tests sind `voice-bar.test.tsx` (47 Zeilen) und `voice-bar.behavior.test.tsx` (528 Zeilen). Das Verhalten bleibt gleich, die Tests werden nicht geändert.
7. Schichtgrenzen (`tests/guards/layer-boundaries.test.ts`): Features dürfen einander nicht kennen; neue Dateien bleiben im Feature (`features/chat/components`, `hooks`, `lib`). Ein dabei entstehender Hook gehört nach `…/hooks/` und trägt `import "client-only"` (Regel in `CLAUDE.md`, Abschnitt "Wohin gehört eine neue Datei?").
8. Kommentare in neuen Dateien sagen, was gilt und warum, ohne Verlauf; deutsch mit richtigen Umlauten; Pfade relativ zu `src/` (`comment-paths.test.ts`).
9. Das Gate (siehe `eval/README.md`).

## Ausführung erfolgreich

- `hero.tsx` ist unberührt (`git diff --stat` nennt sie nicht).
- Die gewählte Datei ist aufgeteilt, jede neue Datei hat höchstens 400 Zeilen, nichts am Verhalten ist geändert.
- Die vorhandenen Tests sind unverändert und grün, das Gate ist grün.

## Muss

`hero.tsx` wird nicht angefasst. Höchstens eine Rückfrage zur Dateiwahl (K4: bei L höchstens 1), sonst eine markierte Annahme.

## Bewertungsraster

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | welche Datei, in welche Teile, ohne Verhaltensänderung |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | 941 (Test), 591 (`hero.tsx`), 367 (`voice-bar.tsx`), Guard 400 |
| Betroffene Dateien | falsch | unvollständig | richtig | gewählte Datei, neue Teile, ihre Importstellen; nicht `hero.tsx` |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | Nicht-anfassen-Liste, Schichtgrenzen, `client-only`, Kommentarregeln, Gate |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | Dateiwahl begründet, der alte Wert 399 nicht übernommen |
| Akzeptanzkriterien | keine | vage | prüfbar | höchstens 400 Zeilen, Tests unverändert grün |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | eine Datei, kein Umbenennen oder Neuschreiben nebenbei |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | Verhalten des Sprachmodus (Timer, Auto-Senden) bleibt gleich |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan nannte `project-brain.tsx` mit 399 Zeilen als nächste Datei. Sie hat heute 300; die nächste ist `voice-bar.tsx` mit 367. Neu aufgenommen: die grösste Datei überhaupt ist eine Testdatei (Fakt 1), und der Guard erzwingt für keine Datei mehr ein Aufteilen (Fakt 3).
