# Aufgabe 09: Architektur ohne Code

| Feld | Wert |
|---|---|
| Repo | PromptPrinter, Kopie ohne Remote (`pp-eval/promptprinter-kopie`) |
| Typ, Grösse | Architektur, ohne Code |
| Repo-Stand | `main` bei `c61b51f` |
| Gold-Fakten geprüft | 2026-10-26, am Code der Kopie |

## Absicht (der rohe Satz)

> Plane, wie sich eine Kommandozeile bei PromptPrinter anmelden kann

## Vorbereitung

Kopie auf `main` bei `c61b51f`, Arbeitsbaum sauber. Für jeden Lauf ein frischer Worktree dieses Commits. Nichts weiter.

## Vorspiel

Keins.

## Gold-Fakten

1. `createClient()` in `src/server/supabase/server.ts` baut den Supabase-Client aus den Cookies der Anfrage (`cookies().getAll()`, `setAll`). Es gibt im Server **keinen Bearer-Pfad**: ein `Authorization`-Header kommt nur bei GitHub, den Modellanbietern und den Webhooks vor. Ein Bearer-Pfad in `createClient()` zieht jede Route und Seite mit, die ihn nutzt (sechs Routen unter `src/app/api/` rufen `auth.getUser` direkt auf, der Chat über `src/app/api/chat/gate.ts`).
2. `src/middleware.ts` ruft `updateSession` (`src/server/supabase/middleware.ts`) auf fast jedem Pfad auf; für `/api/*` leitet sie nicht um (`pathname.startsWith("/api/")`, Zeile 30), die Routen antworten bei fehlender Sitzung selbst mit einer JSON-Problem-Antwort (Kommentar Zeilen 25 bis 30). Für einen Kommandozeilen-Client ist das die passende Form.
3. Das Ratenlimit liegt in `src/server/security/rate-limit.ts`: `rateLimit`, `rateLimitKey(req, scope, userId)` (Schlüssel `scope:u:<id>` oder `scope:ip:<ip>`), Upstash Redis; in Produktion ohne Upstash lehnt es ab, fällt Redis aus, rechnet ein Speicher-Limit mit einem Zehntel der Grenze weiter. Eine neue Anmeldeart braucht einen eigenen Bereich (`scope`).
4. Anonyme Aktionen (Anmelden, Registrieren, Reset) laufen über `/api/auth` mit serverseitiger Turnstile-Prüfung (`src/server/security/turnstile.ts`); Supabases eigenes CAPTCHA ist aus. Ein Terminal kann das Widget nicht lösen: der Plan braucht einen Weg über den Browser (Gerätecode oder lokaler Rückruf) und nicht die Eingabe von Passwort und Token im Terminal.
5. Der Chat auf dem Server-Key verlangt die Einwilligung zu Z.ai (`src/server/consent.ts`, `ZAI_CONSENT_VERSION`, `app_metadata.zai_consent`); Free chattet nur mit eigenem Schlüssel (`src/server/byok.ts`, Tabelle `user_api_keys`, verschlüsselt). Pro ist abgeschaltet. Ein Kommandozeilen-Client muss mit diesen Regeln umgehen.
6. Der Rückweg der Anmeldung existiert: `/auth/callback` (`token_hash` plus `type`, `src/features/auth/lib/recovery-session.ts`) und der OAuth-Weg mit PKCE (Cookie `sb-…-auth-token-code-verifier`).
7. Ein neuer Token-Speicher (auf dem Rechner des Nutzers oder in der Datenbank) ist ein neuer Speicherort mit Folgen für die Rechtstexte; ein Hinweis genügt, kein Rechtstext wird geändert.
8. Es wird kein Code geändert. Das Ergebnis ist ein Dokument in der Antwort mit Architektur, Reihenfolge der Schritte und Risiken.

## Ausführung erfolgreich

Das Dokument stützt sich auf die oben genannten Stellen (mit Pfaden), schlägt einen Weg ohne Passwort im Terminal vor, nennt die Folgen für `createClient()`, Ratenlimit, Einwilligung und eigenen Schlüssel, erfindet keine Datei und keine Funktion.

## Muss

**Keine Datei geändert** (`git status` in der Kopie ist nach dem Lauf sauber). Höchstens eine Rückfrage (K4).

## Bewertungsraster

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | wer meldet sich wie an, was darf die Kommandozeile danach |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | `createClient()` nur Cookies, kein Bearer-Pfad, `/api/*`-Antworten |
| Betroffene Dateien | falsch | unvollständig | richtig | `server.ts`, `middleware.ts`, `rate-limit.ts`, `consent.ts`, `/api/auth` |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | `server-only`, Schichtgrenzen, Rechtstexte nur vorschlagen |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | OAuth-Weg und Gerätecode als Vorschlag, nicht als vorhanden |
| Akzeptanzkriterien | keine | vage | prüfbar | je Schritt eine prüfbare Bedingung |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | Plan, kein Code, keine Neuschreibung des Auth-Flows |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | Token-Speicherung, Widerruf, Ratenlimit, Einwilligung |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan nannte `createClient()`, das Ratenlimit, `/api/auth` mit Turnstile und die Einwilligung zu Z.ai; das stimmt weiter. Neu aufgenommen: die JSON-Antwort der Middleware für `/api/*` (Fakt 2), die genaue Form des Ratenlimit-Schlüssels (Fakt 3) und die Zahl der Routen: sechs direkt, nicht neun (die erste Zählung hatte mehrere Treffer je Datei).
