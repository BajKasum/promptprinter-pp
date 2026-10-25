# Aufgabe 02: Hilfeartikel ergänzen

| Feld | Wert |
|---|---|
| Repo | PromptPrinter, Kopie ohne Remote (`pp-eval/promptprinter-kopie`) |
| Typ, Grösse | Doku, S |
| Repo-Stand | `main` bei `c61b51f` |
| Gold-Fakten geprüft | 2026-10-26, am Code der Kopie |

## Absicht (der rohe Satz)

> Ergänz im Hilfeartikel zu Projekten einen Satz, dass das Gedächtnis nur öffentliche GitHub-Repos liest

## Vorbereitung

Kopie auf `main` bei `c61b51f`, Arbeitsbaum sauber. Für jeden Lauf ein frischer Worktree dieses Commits. Nichts weiter.

## Vorspiel

Keins.

## Gold-Fakten

1. Der Artikel ist eine einzige Datei: `src/app/(marketing)/docs/projekte/page.tsx`, deutscher Text in JSX.
2. **Die Aussage steht schon im Artikel.** Zeilen 122 bis 126: "Ein öffentliches GitHub-Repository: … Private Repositories gehen nicht, lade dort die wichtigen Dateien hoch." Zeile 79 nennt das Repository nur als "ein GitHub-Repository", ohne "öffentlich". Richtig ist, das zu melden und höchstens dort zu präzisieren, wo "öffentlich" fehlt (Zeile 79), statt denselben Satz ein zweites Mal anzuhängen.
3. Der Fakt stimmt, aber nicht über den Datenbank-Constraint: `supabase/migrations/0037_project_brains.sql:37` prüft nur die Form der Adresse (`^https://github\.com/[^/]+/[^/]+$`), nicht ob das Repo öffentlich ist. "Nur öffentlich" folgt aus `src/server/brain/github.ts` (Zeilen 272 bis 277: private Repos sind bewusst nicht unterstützt, es gibt kein OAuth).
4. Wird der Text geändert, ist `updated` in `src/shared/lib/docs-nav.ts` nachzuziehen (Eintrag `slug: "projekte"`, Zeile 64 bis 68, heute `"2026-10-22"`; Regel in `CLAUDE.md`, Tabelle "Wenn du etwas hinzufügst"). Der Wert hat die Form `YYYY-MM-DD`. `src/shared/lib/docs-nav.test.ts` (Zeilen 33 bis 40) verlangt `updated <= heute` mit dem **UTC**-Datum (`toISOString`): wer kurz nach Mitternacht Ortszeit arbeitet, nimmt das UTC-Datum, sonst scheitert der Test.
5. Es entsteht kein Wörterbuch-Eintrag: die Hilfe ist deutscher Text in der Seite (Landing, Hilfe und Rechtstexte bleiben deutsch).
6. Rechtstexte (Impressum, AGB, Datenschutz, Cookies, Nutzungsrichtlinie) werden nicht angefasst.
7. Das Gate aus `CLAUDE.md` gilt (siehe Aufgabe 01, Gold-Fakt 8).

## Ausführung erfolgreich

- Der Artikel sagt an der Stelle, an der das Repository zuerst genannt wird, dass es ein öffentliches sein muss, und derselbe Satz steht nicht doppelt im Artikel.
- Der Auftrag oder die Antwort sagt, dass die Aussage in den Zeilen 122 bis 126 schon stand.
- Wurde der Text geändert, ist `updated` auf das Datum der Änderung (UTC) gesetzt. Wurde nichts geändert, bleibt `updated` unverändert.
- Das Gate ist grün.

## Muss

Erkennen, dass die Aussage schon im Artikel steht (sonst gilt der Ist-Zustand als falsch). Keine Rückfrage nötig (Grösse S: K4 gleich 0).

## Bewertungsraster

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | Aussage "nur öffentliche Repos" ist im Artikel auffindbar, ohne Doppelung |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | Zeilen 122 bis 126 gefunden, Zeile 79 ohne "öffentlich" erkannt |
| Betroffene Dateien | falsch | unvollständig | richtig | `docs/projekte/page.tsx` und `docs-nav.ts`; keine Rechtstexte |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | `updated` nachziehen (UTC), Hilfe bleibt deutsch, Gate |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | "stimmt der Fakt?" ist am Code belegt (`github.ts`), nicht aus dem Constraint geraten |
| Akzeptanzkriterien | keine | vage | prüfbar | Satz an der richtigen Stelle, kein Duplikat, `updated` neu, Tests grün |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | höchstens ein Satz oder ein Wort, kein Umschreiben des Artikels |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | `docs-nav.test.ts` und das UTC-Datum sind genannt |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan sagte "Artikel unter `src/app/(marketing)/docs/projekte/`" und "Constraint `^https://github\.com/`, nur öffentliche Repos". Zwei Dinge stimmten nicht oder fehlten: Die Aussage steht **bereits** im Artikel (Fakt 2), und der Constraint prüft nur die Adressform, nicht die Sichtbarkeit (Fakt 3). Die Aufgabe prüft damit auch, ob der Agent nachsieht, bevor er schreibt.
