# Aufgabe 06: Migration mit Rechten

| Feld | Wert |
|---|---|
| Repo | PromptPrinter, Kopie ohne Remote (`pp-eval/promptprinter-kopie`) |
| Typ, Grösse | Migration, L |
| Repo-Stand | `main` bei `c61b51f` |
| Gold-Fakten geprüft | 2026-10-26, am Code der Kopie (der Plan hatte sie am 2026-10-25 nachgezogen, hier erneut gegen `c61b51f` gelesen) |

## Absicht (der rohe Satz)

> Gespeicherte Prompts sollen sich anheften lassen, angeheftete stehen oben

## Vorbereitung

Kopie auf `main` bei `c61b51f`, Arbeitsbaum sauber. Für jeden Lauf ein frischer Worktree dieses Commits. Nichts weiter. Im Eval wird **keine Migration auf einer echten Datenbank** angewendet (keine MCP-Server, keine Zugangsdaten in der Kopie).

## Vorspiel

Keins.

## Gold-Fakten

1. Es gibt eine neue Migration in `supabase/migrations/`. Die nächste Nummer ist `0050`: die letzte ist `0049_saved_prompts.sql`, und `tests/guards/migrations.test.ts` verlangt eine lückenlose Nummerierung ab `0001`.
2. Die Tabelle heisst **`saved_prompts`** (bis 2026-10-25 hiess sie `generations`; Migration 0049 hat sie umbenannt). Ihre Update-Policy heisst `saved_prompts_owner_update` (angelegt in 0026 als `generations_owner_update`, von 0049 umbenannt).
3. Das Update-Recht ist **spaltengenau**: `grant update (outputs) on public.generations to authenticated` aus `0026_generations_owner_update.sql`, das der Umbenennung folgt. Eine neue Spalte (etwa `pinned_at`) braucht deshalb einen eigenen Spalten-Grant, sonst scheitert das Anheften als Nutzer. Ein Tabellen-Grant wäre falsch: 0026 begründet den Spalten-Grant ausdrücklich (nie `user_id` oder `project_id` vom Client schreibbar).
4. Der Weg ohne Migration, ein Feld `pinned` in `outputs`, bricht: das Umbenennen in `src/features/prompts/components/saved-prompt-list.tsx` (Zeilen 164 bis 176) schreibt `outputs` ganz neu als `{ prompt, title }` und würde das Feld löschen. Wer ihn wählt, muss das nennen und das Umbenennen mit ändern.
5. Schreibende Abfragen tragen zusätzlich zu RLS `.eq("user_id", …)`; Vorbild sind Umbenennen und Löschen in derselben Datei (Zeilen 164 bis 176 und 196 bis 201).
6. Sortierung: beide Listen laden mit `order("created_at", { ascending: false })`, in `src/app/(app)/prompts/page.tsx` (Zeile 53) und `src/app/(app)/projects/[id]/(workspace)/results/page.tsx` (Zeile 63). "Angeheftete oben" heisst: zuerst nach der neuen Spalte, dann nach `created_at`. Der Typ `SavedPrompt` (`src/shared/lib/saved-prompts.ts`: `id`, `title`, `content`, `createdAt`) bekommt das Feld.
7. `src/server/account-export.ts` (Zeilen 155 bis 166) nennt die Spalten von `saved_prompts` einzeln (`id, project_id, outputs, created_at`). Eine neue Spalte erscheint im Datenexport nur, wenn sie dort ergänzt wird: Entscheid oder markierte Annahme.
8. Regeln aus `tests/guards/migrations.test.ts`: Policies nur nach `drop policy if exists`, Indizes und Tabellen mit `if not exists`, neue Tabellen mit RLS und Rechten, Funktionen mit festem `search_path`, jede an `authenticated` vergebene Funktion von `PUBLIC` entziehen. Der Kopf folgt dem Stil der Vorgänger ("Run AFTER 0049_saved_prompts.sql", Begründung, wiederholbar).
9. Produktion nur mit Kasums ausdrücklichem Ja, erst die Migration, dann der Code (Arbeitsregel in `CLAUDE.md`).
10. Beschriftungen (Anheften, Lösen, `aria-label`) in fünf Sprachen; fr, it, es werden im Pull Request als nicht von Muttersprachlern geprüft gekennzeichnet.
11. Tests liegen neben der Datei (`saved-prompt-list.test.tsx`); `saved-prompt-list.tsx` hat 358 Zeilen, die Grenze des Guards ist 400.
12. Das Gate (siehe `eval/README.md`).

## Ausführung erfolgreich

- Migration `0050_…` mit neuer Spalte **und** Spalten-Grant, im Stil der Vorgänger, `migrations.test.ts` grün.
- Anheften und Lösen funktionieren in beiden Listen, angeheftete stehen oben, die Abfragen tragen `user_id`.
- Neue Tests, das Gate ist grün, keine Migration auf einer echten Datenbank.

## Muss

Den Spalten-Grant nicht vergessen und den Punkt "Produktion nur mit Ja" nennen. Höchstens eine Rückfrage (K4: bei L höchstens 1).

## Bewertungsraster

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | anheften, lösen, angeheftete oben, in beiden Listen |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | Tabelle `saved_prompts`, Spalten-Grant aus 0026, nächste Nummer `0050` |
| Betroffene Dateien | falsch | unvollständig | richtig | Migration, `saved-prompt-list.tsx`, beide Seiten, `saved-prompts.ts`; `account-export.ts` bedacht |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | Migrationsregeln, `user_id`-Filter, fünf Sprachen, Produktion nur mit Ja, Gate |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | alte Namen (`generations`) nicht als gegeben genommen |
| Akzeptanzkriterien | keine | vage | prüfbar | Guard grün, Sortierung geprüft, Grant geprüft |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | keine Umbauten der Liste, kein Ordnen per Ziehen |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | Spalten-Grant, `user_id`, Bestandszeilen, Rückfall der Migration |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan (nachgezogen am 2026-10-25) stimmte in den Namen und der Nummer `0050`. Neu aufgenommen: der Weg ohne Migration und warum er das Umbenennen bricht (Fakt 4), der Datenexport (Fakt 7) und die Zeilen der Sortierung (Fakt 6).
