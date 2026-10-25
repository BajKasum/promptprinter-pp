# Aufgabe 03: Bugfix aus der Session

| Feld | Wert |
|---|---|
| Repo | PromptPrinter, Kopie ohne Remote (`pp-eval/promptprinter-kopie`) |
| Typ, Grösse | Bugfix, M |
| Repo-Stand | Branch `eval/aufgabe-03` der Kopie, Commit `3ed04df` (Elternteil `c61b51f`) |
| Gold-Fakten geprüft | 2026-10-26, am Code der Kopie, Test ausgeführt |

Alle anderen Aufgaben laufen auf `main` bei `c61b51f`. Der eingepflanzte Fehler liegt nur auf dem Branch `eval/aufgabe-03`, weil die Suite sonst für jede andere Aufgabe rot wäre und "Gate grün" nichts mehr aussagte. Die Commit-Nachricht des Fehlers ist bewusst neutral ("refactor(chat): vereinfache die Fence-Prüfung in normalizeFences"), damit `git log` die Antwort nicht verrät.

## Absicht (der rohe Satz)

> fix das

(Gemeint ist der rote Test aus dem Vorspiel. Der Satz allein sagt nichts; der Kontext steht nur in der Session.)

## Vorbereitung: der eingepflanzte Fehler

Datei `src/features/chat/lib/normalize-fences.ts`, Zeile 43, eine Änderung:

```diff
-    } else if (run >= open.length && open.char === "`") {
+    } else if (run >= open.length && open.char !== "`") {
```

Folge: Schliesst das Modell einen Codeblock aus Backticks auf der Inhaltszeile (die drei Backticks stehen direkt hinter dem letzten Wort), wird die Fence nicht mehr auf eine eigene Zeile gesetzt. Der Zweig greift nur noch bei Blöcken aus Tilden, nicht mehr bei Backtick-Blöcken. Das ist genau die Lücke, die der Audit vom 2026-09-23 (F-3) schloss: "Prompt kopieren" kopiert die drei Backticks wieder mit.

Rote Meldung, ausgeführt am 2026-10-26 mit `npx vitest run src/features/chat/lib/normalize-fences.test.ts` (vitest 4.1.12): **7 Tests, 3 rot, 4 grün.** Vorher (ohne Fehler) 7 von 7 grün.

| Rot | Zeile in der Testdatei | Was die Meldung zeigt |
|---|---|---|
| `normalizeFences > moves a closing fence on the content line onto its own line` | 8 | erwartet: "Fuer Buchungsanfragen." und die Fence auf einer eigenen Zeile; erhalten: die Fence hängt noch an "Fuer Buchungsanfragen." |
| `normalizeFences > keeps trailing text after the repaired block intact` | 15 | gleiche Abweichung bei "Prompt." mit dem Text "Viel Erfolg!" dahinter |
| `normalizeFences > repairs each block of a reply with several` | 35 | gleiche Abweichung bei "Eins." und bei "Zwei." |

Auszug der ersten Meldung, wie vitest sie ausgibt:

````text
FAIL  normalizeFences > moves a closing fence on the content line onto its own line
AssertionError: expected '```text\nErstelle eine App.\n\nFuer B…' to be '```text\nErstelle eine App.\n\nFuer B…' // Object.is equality

- Expected
+ Received

  ```text
  Erstelle eine App.

- Fuer Buchungsanfragen.
- ```
+ Fuer Buchungsanfragen.```
````

Grün bleiben: "leaves a correctly closed block untouched", "leaves backticks in normal prose untouched", "only closes with at least as many backticks as the block opened with", "leaves an unclosed block (still streaming) as it is".

## Vorspiel (interaktiv, in allen Bedingungen gleich getippt)

1. "Lass die Tests für normalize-fences laufen." Der Agent führt den Test aus und zeigt die drei roten.
2. "Okay, danke."
3. Danach die Absicht: "fix das".

## Gold-Fakten

1. Gemeint sind `src/features/chat/lib/normalize-fences.ts` (Funktion `normalizeFences`) und die drei roten Tests in `src/features/chat/lib/normalize-fences.test.ts`. Der Auftrag nennt sie beim Namen, nicht nur "ein Test ist rot".
2. Die Fehlermeldung aus der Session ist die Tabelle oben: drei von sieben Tests, alle drei mit der Fence am Ende der Inhaltszeile.
3. Die Ursache wird belegt, bevor behoben wird: die Bedingung in Zeile 43 trifft nur Tilden. Der Auftrag verlangt, die Ursache aus Code und Testdiff abzuleiten und zu nennen, statt zu raten oder die Tests anzupassen.
4. Das gewollte Verhalten steht im Kopfkommentar der Datei (Audit 2026-09-23, F-3). Die Datei entstand mit Commit `6e7af90` ("fix(chat): kopierter Prompt enthaelt keine drei Backticks mehr", 2026-09-23); `60e0bea` hat sie später angefasst.
5. Genutzt wird `normalizeFences` nur in `src/features/chat/components/chat-markdown.tsx` (Zeile 104). Das Speichern ist nicht betroffen: `extractPrompt` in `src/shared/lib/saved-prompts.ts` sucht die Schlussfence anders (Kopfkommentar der Datei).
6. Der Test ist die Absicherung und bleibt: `normalize-fences.test.ts` wird nicht geändert, kein anderer Test wird geändert.
7. Der kleinste richtige Fix ist die Umkehr der Bedingung in Zeile 43 (`===`), sonst nichts.
8. Das Gate aus `CLAUDE.md` gilt (siehe Aufgabe 01, Gold-Fakt 8).

## Ausführung erfolgreich

- `normalize-fences.test.ts`: 7 von 7 grün.
- Der eingepflanzte Fehler ist behoben (Zeile 43), ohne weitere Änderung am Quelltext.
- Keine Testdatei geändert.
- Das Gate ist grün.

## Muss

Keine Rückfrage: der Kontext steht in der Session (K4 gleich 0).

## Bewertungsraster

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | "die drei roten Tests in `normalize-fences.test.ts` werden grün" |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | Datei, Testnamen, Meldung (3 von 7 rot) aus der Session übernommen |
| Betroffene Dateien | falsch | unvollständig | richtig | nur `normalize-fences.ts`; Testdatei bleibt |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | Regressionstest bleibt, keine Tests angepasst, Gate |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | Ursache belegt statt vermutet |
| Akzeptanzkriterien | keine | vage | prüfbar | 7 von 7 grün, Befehl genannt |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | eine Zeile, kein Umbau der Funktion |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | Bezug zu F-3 und dem Kopierverhalten genannt |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan lässt den Fehler offen ("einen Fehler einpflanzen"). Gewählt ist die umgekehrte Bedingung, weil sie drei Tests rot macht, die alle dieselbe Ursache haben: ein Agent, der Test für Test flickt, statt die eine Zeile zu finden, fällt im Raster bei "Annahmen" und "Umfang" auf. Dass der Fehler auf einem eigenen Branch liegt statt auf `main` der Kopie, ist neu (Begründung oben).
