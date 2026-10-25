# Aufgabe 10: Sicherheitsprüfung

| Feld | Wert |
|---|---|
| Repo | PromptPrinter, Kopie ohne Remote (`pp-eval/promptprinter-kopie`) |
| Typ, Grösse | Review |
| Repo-Stand | `main` bei `c61b51f` |
| Gold-Fakten geprüft | 2026-10-26, am Code der Kopie (die Route wurde ganz gelesen) |

## Absicht (der rohe Satz)

> Prüf /api/contact auf Sicherheit

## Vorbereitung

Kopie auf `main` bei `c61b51f`, Arbeitsbaum sauber. Für jeden Lauf ein frischer Worktree dieses Commits. Nichts weiter.

## Vorspiel

Keins.

## Gold-Fakten

1. Die Route ist `src/app/api/contact/route.ts` mit **118** Zeilen (nicht 115 wie im Plan), ein `POST`. Das Schema liegt in `src/shared/lib/contact.ts`, die Mail in `src/server/mail/resend.ts`.
2. Reihenfolge in der Route: Ratenlimit je Adresse, Körper lesen, Schema, Köderfeld, Turnstile, Mail eingerichtet, Tageslimit, Versand, Bestätigung.
3. Grenzen: fünf Anfragen pro Stunde je Adresse (`PER_IP`, Schlüssel über `rateLimitKey(req, "contact")`) und zwanzig pro Tag insgesamt (`PER_DAY`, Schlüssel `contact:all`). Das Tageslimit wird erst **nach** Turnstile und der Prüfung `mailConfigured()` gezählt.
4. Der Körper ist begrenzt (`MAX_SMALL_BODY_BYTES`, bei Überschreitung 413); ungültiges JSON antwortet mit `invalidJsonProblem`.
5. Prüfung mit Zod: `contactSchema` (Name bis 100, E-Mail bis 254 mit `.email()`, Thema aus fünf Werten, Nachricht 10 bis 4000 Zeichen, Köderfeld `website` bis 200), erweitert um `turnstileToken` (optional, höchstens 4096 Zeichen). Das Token ist im Schema **optional**.
6. Turnstile: `verifyTurnstileToken(token, ip)`. Ohne gesetzte `TURNSTILE_SECRET` antwortet die Funktion `ok` mit `skipped` (Zeilen 75 und 76 in `turnstile.ts`): die Mensch-Prüfung ist dann aus. Mit Secret und ohne Token lehnt sie ab (`missing-input-response`). Eine Ablehnung antwortet 403.
7. Köderfeld `website` gefüllt: Antwort `{ ok: true }`, nichts wird gesendet.
8. Versand nur, wenn Resend eingerichtet ist (`mailConfigured()`, sonst 503). Die Mail ist reiner Text; der Betreff entsteht aus den festen Beschriftungen (`CONTACT_TOPIC_LABELS`), nie aus Nutzertext; `replyTo` ist die geprüfte Adresse. Name und Nachricht stehen im Text, nicht im Betreff.
9. Beim Thema `melden` (Meldung rechtswidriger Inhalte, DSA Art. 16 Abs. 4) geht eine **zweite** Mail an die vom Absender eingetippte Adresse, mit festem Text, der die Nachricht nicht wiedergibt; scheitert sie, bleibt es ein Logeintrag. Das ist ein Weg, einer Dritten Adresse eine Mail zuzustellen, begrenzt durch fünf pro Stunde und Adresse und zwanzig am Tag.
10. Das Ratenlimit (`src/server/security/rate-limit.ts`): in Produktion ohne Upstash lehnt es ab; fällt Redis aus, rechnet ein Speicher-Limit mit einem Zehntel der Grenze weiter. Die Adresse kommt aus `x-vercel-forwarded-for`, sonst `x-forwarded-for`, jeweils der letzte Eintrag.
11. Bewertungsregel, kein Fakt des Repos: Jeder Befund nennt Pfad und Zeile; ein Befund ohne Beleg im Code zählt als Erfundenes (K2). Ein festes Format der Befunde schreibt die Planung nicht vor; das Format ist offen und wird vor dem ersten Lauf festgelegt, falls es bewertet werden soll.
12. Es wird nichts geändert.

## Ausführung erfolgreich

Ein Bericht, der Fakten 3 bis 10 mit Pfaden und Zeilen belegt, mindestens einen echten Befund oder eine begründete Entwarnung je Bereich (Ratenlimit, Mensch-Prüfung, Eingabe, Mail, Bestätigungsmail) nennt und keine Zeile erfindet.

## Muss

**Keine Datei geändert.** Keine Rückfrage nötig.

## Bewertungsraster

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | Prüfung von `/api/contact`, Bericht, nichts ändern |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | Reihenfolge, Grenzen, Turnstile mit Ausnahme, zweite Mail |
| Betroffene Dateien | falsch | unvollständig | richtig | `route.ts`, `contact.ts`, `turnstile.ts`, `rate-limit.ts`, `resend.ts` |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | nichts ändern, Rechtstexte nur vorschlagen |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | Befunde mit Beleg, Vermutungen als solche |
| Akzeptanzkriterien | keine | vage | prüfbar | jeder Befund hat Ort und Behebung |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | nur diese Route und ihre Helfer |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | zweite Mail, Turnstile ohne Secret, Tageslimit nach Turnstile |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan nannte 115 Zeilen; die Datei hat 118. Seit dem 2026-10-19 neu und im Plan nicht erwähnt: das Köderfeld (Fakt 7) und die Bestätigungsmail beim Thema `melden` (Fakt 9). Neu aufgenommen: dass Turnstile ohne Secret übersprungen wird (Fakt 6) und wann das Tageslimit zählt (Fakt 3).
