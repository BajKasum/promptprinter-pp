# Aufgabe 12: Unbekanntes öffentliches Repo (Hono)

| Feld | Wert |
|---|---|
| Repo | `honojs/hono` (öffentlich, MIT), Kopie `pp-eval/hono-kopie`, ohne Remote |
| Typ, Grösse | Bugfix, M |
| Repo-Stand | `main` bei `bac5c4a` (Version 4.13.14, 2026-10-25), 583 getrackte Dateien |
| Issue | [honojs/hono#5581](https://github.com/honojs/hono/issues/5581), geöffnet 2026-10-24, am 2026-10-26 offen, kein verknüpfter Pull Request |
| Gold-Fakten festgelegt | 2026-10-26, am Code der Kopie gelesen (nichts ausgeführt, nichts installiert) |

## Warum dieses Repo

Mittelgross (583 Dateien), aktiv (Push am Vortag), mit Tests, TypeScript. Kein Repo des Autors und ihm nicht bekannt. Das Issue ist klar beschrieben (Reproduktion, erwartetes Verhalten, Verweis auf die Norm) und liegt an einer Stelle, die ein Agent erst finden muss. Es hat keine Regeldatei: der Skill muss Stil, Testbefehl und Struktur aus dem Code ableiten, `AGENTS.md` oder `CLAUDE.md` gibt es nicht.

## Prüfung nach Punkt 6 des Sicherheitsrahmens (2026-10-26)

Am Dateisystem der Kopie geprüft, nicht nur am Baum: es gibt kein `.claude/` (damit auch kein `settings.json`, kein `settings.local.json`), kein `.mcp.json`, kein `.codex/`, kein `AGENTS.md`, kein `CLAUDE.md`, kein `GEMINI.md`, kein `.cursor`, kein `.agents`, kein `.husky`, keinen `.devcontainer`. Vorhanden ist `.vscode/` (`extensions.json`, `settings.json`), das nur den Editor betrifft. Das `package.json` hat kein `preinstall`, `install`, `postinstall` oder `prepare`; das Skript `prerelease` läuft nur bei einem Release.

## Absicht (der rohe Satz: der Titel des Issues)

> Cookie prefix checks are case-sensitive, so `__host-` / `__secure-` cookies skip validation

Der Auftrag entsteht in der Sprache der Absicht, also auf Englisch.

## Vorbereitung

- Für jeden Lauf ein frischer Worktree von `bac5c4a` der Kopie.
- In allen drei Bedingungen zusätzlich `--disallowedTools "WebFetch" "WebSearch"`: das Issue verlinkt zwei Forks mit einem fertigen Fix, und kein Lauf soll ihn nachlesen können.
- `pnpm` ist auf diesem Rechner nicht installiert (`corepack` 0.34.6 ist da); das Repo verlangt `pnpm@12.6.0`. Der Entscheid, wie installiert wird (bei `pnpm install` laufen die Lifecycle-Skripte der Abhängigkeiten mit; prüfen, ob `--ignore-scripts` reicht), fällt vor dem ersten Lauf und wird in `eval/results/` notiert.
- Ausgangslage: der Testbefehl läuft einmal auf dem unveränderten Commit, das Ergebnis wird notiert. Ein Kommentar im Issue sagt, dass auf sauberem `main` fünf Tests unter `build/` fehlschlagen; das ist **ungeprüft**. Gewertet werden deshalb die gezielten Tests und der Typecheck, nicht die ganze Suite.

## Vorspiel

Keins.

## Gold-Fakten

1. **Die Prüfung sitzt in `_serialize`** in `src/utils/cookie.ts` (Zeile 173): `name.startsWith('__Secure-')` (Zeile 180) verlangt `secure`; `name.startsWith('__Host-')` (Zeile 185) verlangt `secure`, `path` gleich `/` und kein `domain` (drei Fehlermeldungen, Zeilen 188 bis 196). Beides ist gross- und kleinschreibungsabhängig: `serialize('__host-sid', 'v')` wirft nicht.
2. `serialize` (Zeile 261) und `serializeSigned` (Zeile 270) rufen beide `_serialize` auf: **eine** Änderung deckt beide.
3. `src/helper/cookie/index.ts` ruft `serialize` über `generateCookie`, `generateSignedCookie`, `setCookie`, `setSignedCookie` und `deleteCookie`. Die Option `prefix` (`'secure'` oder `'host'`) schreibt `__Secure-` und `__Host-` selbst und richtig davor; die Lücke betrifft nur Namen, die der Aufrufer selbst in anderer Schreibweise angibt (`setCookie(c, '__host-sid', …)`).
4. Das Soll nach dem Issue (rfc6265bis-22, Abschnitt 5.4): Prefixe werden ohne Rücksicht auf Gross- und Kleinschreibung erkannt, `__host-` und `__secure-` müssen dieselben Fehler wie `__Host-` und `__Secure-` auslösen. Die Fehlermeldungen selbst bleiben (`__Secure- Cookie must have Secure attributes` und die drei des `__Host-`-Zweigs).
5. **Es gibt heute keinen Test für diese Fehler.** In `src/utils/cookie.test.ts` prüft nur eine Stelle eine Meldung dieser Art (`Partitioned Cookie must have Secure attributes`, Zeilen 378 bis 383); die Prefix-Tests (Zeilen 284 bis 312) prüfen nur den Erfolgsfall. In `src/helper/cookie/index.test.ts` laufen die Prefix-Fälle (Zeilen 215 bis 290) über die Option `prefix`.
6. Neue Tests gehören in beide Dateien: `src/utils/cookie.test.ts` (460 Zeilen) und `src/helper/cookie/index.test.ts` (510 Zeilen). Fälle: kleingeschrieben `__host-` und `__secure-` ohne die geforderten Attribute werfen; gemischt geschrieben ebenso; gültige Optionen gehen durch.
7. **Typ-Ebene:** `CookieConstraint` (Zeilen 31 bis 35 in `cookie.ts`) nutzt `__Secure-${string}` und `__Host-${string}`, ebenfalls gross- und kleinschreibungsabhängig. Die Reparatur der Laufzeit-Prüfung ändert die Typen nicht; das ist offen und wird als Annahme oder Folgeaufgabe genannt.
8. **Testbefehl des Repos:** `pnpm test`, das ist `tsc -p tsconfig.spec.json && vp test --run`. Gezielt: `vp test --run src/utils/cookie.test.ts src/helper/cookie/index.test.ts`. Dazu `pnpm run lint` (`vp lint …`) und `pnpm run format` (`vp fmt --check …`).
9. **Stil des Repos** (`vite.config.ts`, Formatierung): einfache Anführungszeichen, keine Semikolons, zwei Leerzeichen. Eine `.editorconfig` gibt es; `editorconfig-checker` ist ein Skript.
10. Keine Regeldatei: der Auftrag stützt sich auf Code und `package.json`, nicht auf Regeln, die es nicht gibt.
11. Das Issue ist sicherheitsnah (der Browser verwirft das Cookie still): bestehende Tests werden nicht geändert, und die Änderung bleibt klein.

## Ausführung erfolgreich

- `serialize('__host-sid', 'v')`, `serialize('__SECURE-sid', 'v')` und `serializeSigned` mit solchen Namen werfen dieselben Fehler wie die kanonische Schreibweise; gültige Optionen gehen weiter durch.
- Neue Tests in beiden Testdateien, die ohne die Änderung rot sind.
- Die gezielten Tests und der Typecheck sind grün, kein vorher grüner Test ist rot, kein bestehender Test geändert.

## Muss

Keine Rückfrage nötig, wenn Issue, Code und Tests gelesen sind. Der Auftrag nennt die Stelle (`_serialize`), den Testbefehl und die Typ-Ebene als offenen Punkt.

## Bewertungsraster

| Kriterium | 0 | 1 | 2 | Für diese Aufgabe |
|---|---|---|---|---|
| Ziel | unklar | erkennbar | klar und prüfbar | gleiche Fehler für alle Schreibweisen der beiden Prefixe |
| Ist-Zustand | falsch oder fehlt | teilweise | korrekt mit Pfaden | `_serialize`, Zeilen 180 und 185, `serialize` und `serializeSigned` als Aufrufer |
| Betroffene Dateien | falsch | unvollständig | richtig | `src/utils/cookie.ts`, beide Testdateien; `index.ts` nur geprüft |
| Projektregeln | verletzt oder fehlen | teilweise | die passenden, korrekt | keine Regeldatei: Stil (einfache Anführungszeichen, keine Semikolons), Testbefehl |
| Annahmen | Geratenes als Fakt | teilweise markiert | alle markiert oder keine nötig | Typ-Ebene offen genannt, fünf angebliche Fehlschläge nicht als gegeben |
| Akzeptanzkriterien | keine | vage | prüfbar | konkrete Aufrufe mit erwartetem Fehler, gezielter Testbefehl |
| Umfang | aufgebläht oder zu knapp | etwas daneben | passt zur Grösse | wenige Zeilen in `cookie.ts` plus Tests, kein Umbau von `setCookie` |
| Risiko und Sicherheit | übersehen | erwähnt | konkret mit Test (oder nicht nötig) | stille Ablehnung durch den Browser, Abwärtskompatibilität bestehender Aufrufer |

Punkte: __ / 16

## Abweichung gegenüber dem Plan

Der Plan liess alles offen ("in P1 aus Issue und Code festlegen"). Gewählt ist #5581, weil es klein, klar und ohne verknüpften Pull Request ist; als zweiter Kandidat blieb #5567 (JSON-Validator und `+json`-Subtypen mit Ziffern), ebenfalls klein, aber mit der Ursache schon im Issue. Das Issue verlinkt zwei Forks mit Fix, deshalb ist das Netz im Lauf gesperrt.
