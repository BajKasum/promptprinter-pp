# Aufgabe 05: Neuer Browser-Speicher

| Feld | Wert |
|---|---|
| Repo | PromptPrinter, Kopie ohne Remote (`pp-eval/promptprinter-kopie`) |
| Typ, Grösse | Feature, M |
| Repo-Stand | `main` bei `c61b51f` |
| Gold-Fakten geprüft | 2026-10-26, am Code der Kopie |

## Absicht (der rohe Satz)

> Merk dir im Browser, welches Projekt zuletzt offen war, und öffne es beim nächsten Mal

## Vorbereitung

Kopie auf `main` bei `c61b51f`, Arbeitsbaum sauber. Für jeden Lauf ein frischer Worktree dieses Commits. Nichts weiter.

## Vorspiel

Keins.

## Gold-Fakten

1. Jeder neue Cookie oder `localStorage`-Schlüssel braucht einen Eintrag in `src/features/marketing/lib/cookie-inventory.ts` (Liste `FIRST_PARTY_STORAGE`, Typ `StorageEntry` mit `name`, `kind`, `setBy`, `purpose`, `when`, `duration`). Heute sind es sieben Einträge: `sb-…-auth-token`, `sb-…-auth-token-code-verifier`, `pp-sidebar`, `pp-sidebar-width`, `pp-locale`, `pp-voice-consent`, `theme`. Fehlt der Eintrag, scheitert `tests/guards/cookie-inventory.test.ts`; der Guard liest den Quelltext (`document.cookie =` mit festem Namen oder einer Konstante, `localStorage.setItem` und `sessionStorage.setItem` mit festem Schlüssel).
2. Die Seite `/cookies` (`src/app/(marketing)/(legal)/cookies/page.tsx`) liest dieses Inventar, mit dem Eintrag stimmt sie also wieder. Sie ist ein Rechtstext: der Eintrag ist Pflicht (Tabelle in `CLAUDE.md`), seine Wirkung auf `/cookies` gehört in die Beschreibung des Pull Requests.
3. Die Datenschutzerklärung (`src/app/(marketing)/(legal)/datenschutz/page.tsx`, Zeilen 137 und 188 bis 189) nennt einzelne Schlüssel. Ob dort etwas zu ergänzen ist, ist ein Vorschlag an Kasum, keine ungefragte Änderung (Arbeitsregel "Rechtstexte" in `CLAUDE.md`).
4. Heute landet man nach dem Login auf `/chats/new`: `safeNextPath(raw, fallback = "/chats/new")` in `src/shared/lib/site-url.ts` (Zeile 29), und `src/server/supabase/middleware.ts` (Zeile 122) leitet eingeloggte Nutzer von `/login` und `/signup` dorthin. "Beim nächsten Mal öffnen" setzt an einer dieser Stellen an. Die Projekt-Seiten liegen unter `src/app/(app)/projects/[id]/`.
5. Ein Cookie ist im Server und in der Middleware lesbar (Weiterleitung vor dem Rendern), `localStorage` nur im Browser. Die Wahl ist eine Annahme und wird als solche markiert.
6. Randfall: Existiert das gemerkte Projekt nicht mehr (gelöscht) oder gehört es nicht dem Nutzer, darf das nicht in einem Fehler enden; der Rückfall ist `/chats/new`.
7. `CLAUDE.md` nennt Weiterleitungen von `/chat` und `/dashboard`. Im Code der Kopie habe ich keine gefunden (`next.config.ts` leitet nur `/features`, `/admin/:path*` und Vergleichsseiten um, `src/shell/lib/nav.ts` Zeile 30 hat nur einen Kommentar). Darauf wird nicht gebaut, und eine Annahme dazu wird markiert.
8. UI-Text in fünf Sprachen nur, falls welcher entsteht (für das reine Merken ist keiner nötig).
9. Das Gate (siehe `eval/README.md`, "Festlegung zum Gate").

## Ausführung erfolgreich

- Das zuletzt geöffnete Projekt wird gemerkt, und der nächste Einstieg öffnet es; bei einem gelöschten Projekt landet man auf `/chats/new`.
- Der neue Schlüssel steht in `cookie-inventory.ts`, `tests/guards/cookie-inventory.test.ts` ist grün.
- Neue Tests neben der geänderten Datei, das Gate ist grün.

## Muss

Den Eintrag im Cookie-Inventar anlegen. Höchstens eine Rückfrage (K4), zum Beispiel ob ein ausdrücklicher Klick auf "Chats" trotzdem Chats zeigen soll.

## Bewertungsraster

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | gemerkt, beim nächsten Einstieg geöffnet, Rückfall bei gelöschtem Projekt |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | Login-Ziel `/chats/new` (`site-url.ts`, `middleware.ts`), Projekt-Routen |
| Betroffene Dateien | falsch | unvollständig | richtig | `cookie-inventory.ts`, die Stelle der Weiterleitung, die schreibende Stelle im Projekt |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | Inventar-Eintrag, Rechtstext nur vorschlagen, Gate |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | Cookie oder `localStorage`, `/chat` und `/dashboard` nicht als gegeben genommen |
| Akzeptanzkriterien | keine | vage | prüfbar | Verhalten, Rückfall, Guard grün |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | kein neues UI, keine Einstellung |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | fremde oder gelöschte Projekt-ID, `/cookies` als Rechtstext |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan nannte das Inventar, den Guard und das Login-Ziel und blieb dabei. Neu aufgenommen: die Wirkung auf `/cookies` und die Datenschutzerklärung als Rechtstexte (Fakten 2 und 3), der Randfall (6) und der Fund, dass die in `CLAUDE.md` genannten Weiterleitungen von `/chat` und `/dashboard` im Code nicht zu finden sind (7).
