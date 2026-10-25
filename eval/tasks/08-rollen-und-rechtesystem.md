# Aufgabe 08: Rollen- und Rechtesystem

| Feld | Wert |
|---|---|
| Repo | PromptPrinter, Kopie ohne Remote (`pp-eval/promptprinter-kopie`) |
| Typ, Grösse | Grosse Änderung, XL |
| Repo-Stand | `main` bei `c61b51f` |
| Gold-Fakten geprüft | 2026-10-26, am Code der Kopie (der Plan hatte sie am 2026-10-25 nachgezogen, hier erneut gegen `c61b51f` gelesen) |

## Absicht (der rohe Satz)

> Implementiere ein vollständiges Rollen- und Rechtesystem

## Vorbereitung

Kopie auf `main` bei `c61b51f`, Arbeitsbaum sauber. Für jeden Lauf ein frischer Worktree dieses Commits. Nichts weiter.

## Vorspiel

Keins.

## Gold-Fakten

1. Die einzige Rolle ist heute `profiles.is_admin`. 18 Dateien ausserhalb der Tests nennen `is_admin` (22 mit der Schreibweise `isAdmin`). Migration `0013_profile_admin_role.sql` legt die Spalte an und entzieht den Nutzern das Update-Recht; `0014_profile_column_grants.sql` vergibt die Rechte auf `profiles` spaltenweise.
2. `PlanKey` kennt nur `free` und `pro` (`src/shared/lib/plans.ts`, Zeile 1). Der Plan `team` war nie kaufbar und ist mit der Migration 0049 auch aus der Datenbank weg. Einzelne Kommentare (zum Beispiel in `src/app/(app)/prompts/page.tsx` und `results/page.tsx`) sagen noch "Pro/Team": veraltet, kein Hinweis auf einen vorhandenen Plan.
3. `resolvePlan(profile)` und `effectiveLimits(plan, isAdmin)` in `plans.ts` verbinden Plan und Admin-Flag; `/admin/:path*` leitet auf `/usage` um (`next.config.ts`).
4. Es gibt keine geteilten Ressourcen: keine Tabelle für Mitglieder oder Freigaben (die Suche nach `project_members`, `shared_with`, `collaborator` in Migrationen und Code ist leer). Jede Tabelle ist per RLS auf `auth.uid() = user_id` gebaut.
5. RLS gilt auf allen Tabellen, `anon` hat keine Rechte; Billing, Gedächtnis und Anhänge schreibt nur der Server mit der Service-Role.
6. Migrationsregeln (siehe Aufgabe 06), Produktion nur mit Kasums ausdrücklichem Ja; Schichtgrenzen (`tests/guards/layer-boundaries.test.ts`); UI-Text in fünf Sprachen; User-scoped Abfragen mit zusätzlichem `.eq("user_id", …)`.
7. Pro ist abgeschaltet (`PRO_AVAILABLE = false`): bezahlte Rollen oder Pläne sind für Nutzer nicht erreichbar.
8. Eine Rückfrage ist zwingend: **Betriebsrollen** (zum Beispiel Admin und Support, nur für den Betreiber) **oder Team** mit geteilten Projekten (neue Zugriffsregeln auf jeder Tabelle); was aus `is_admin` wird (Bestandsdaten, Abwärtskompatibilität); und ob "Team" als Plan zurückkommen soll, obwohl er bewusst entfernt wurde.
9. Phasen: ein Plan zuerst, dann eine Phase je Pull Request (Arbeitsweise in `CLAUDE.md`), kein Umbau in einem Zug.

## Ausführung

Nur bis zum Plan: XL wird im Eval nicht umgesetzt. Gewertet wird die erste Antwort mit einem Plan oder einer Rückfrage, nicht, was danach geschieht. In Bedingung A hört die Wertung dort auf, auch wenn der Agent weiterbaut.

## Muss

Eine Rückfrage nach dem Umfang (Fakt 8). Der Plan nennt Phasen, verändert in dieser Antwort keine Datei und wendet nirgends eine Migration an.

## Bewertungsraster

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | welche Art von Rollen, für wen, mit welchem Ergebnis |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | `is_admin` (18 Dateien), `PlanKey`, RLS, keine geteilten Ressourcen |
| Betroffene Dateien | falsch | unvollständig | richtig | `plans.ts`, die `is_admin`-Stellen, Migrationen, RLS-Policies |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | Migrationsregeln, Produktion nur mit Ja, Schichtgrenzen, fünf Sprachen |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | `team` nicht als vorhanden genommen |
| Akzeptanzkriterien | keine | vage | prüfbar | je Phase prüfbar (Tests, Guards, RLS) |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | Phasen statt eines Wurfs, Rückfrage vor dem Bauen |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | Rechte-Ausweitung, Bestandsdaten von `is_admin`, RLS je Tabelle |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan (nachgezogen am 2026-10-25) stimmte. Neu aufgenommen: die veralteten "Pro/Team"-Kommentare (Fakt 2), die Umleitung von `/admin` (Fakt 3), die Suche nach geteilten Ressourcen (Fakt 4) und dass Pro abgeschaltet ist (Fakt 7).
