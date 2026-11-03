# CLAUDE.md, Projekt-Kontext für Claude-Code-Sessions

Wird bei jedem Session-Start geladen. Kurz: was das Projekt ist, in welchem Zustand es steckt, nach welchen Regeln hier gearbeitet wird.

## Was ist promptprinter-pp?

Der Agent Skill `/pp` (Claude Code, später Codex und VS Code Copilot) plus ein kleines lokales Skript. Er macht aus einer Absicht einen fertigen Prompt für den Coding-Agenten, mit Kontext aus Git, Struktur, Regeldateien und passenden Dateien. Er ändert nie Dateien, führt erst nach ausdrücklichem Ja etwas aus, hat keinen Server und kein Konto. Eigene Produktlinie neben der Web-App PromptPrinter (Entscheid D1 vom 25.10.2026).

## IST-Zustand (Stand 2026-11-03)

Gegenwart, keine Historie. **Gebaut, dreimal gemessen (0.1.0 bis 0.3.0), Zielwert nicht erreicht; ob wieder gemessen wird, entscheidet Kasum.** Das Repo hat README, MIT-Lizenz, `SECURITY.md`, diese Datei, den Skill `skill/pp/` (Version 0.4.0, nicht gemessen; vier Referenzdateien und das Skript `scripts/context.mjs`), `install.mjs`, Tests (`test/`, `npm test`, `npm run mutation`), die Messung `eval/` (zwölf Aufgaben, Werkzeuge ohne Abhängigkeiten, Ergebnistabellen) und eine CI (Pflichtdateien, Tests auf Ubuntu, Windows und macOS mit Node 22 und 24). Das Skript hat `pack`, `search`, `check`, `save` und `doctor`, keine Abhängigkeit, kein Netzwerk, Git nur über Argumentlisten, jede Ausgabezeile geschwärzt, Exit-Code immer 0. G1 wurde dreimal verfehlt (Recall 84, 88 und 82 von 99 bei verlangten 90; der Auftrag kostet 21 bis 73 % der Ausführung statt rund 15 %); das Skript hat den Recall nicht gehoben (Notiz im Vault: PromptPrinter 2.0 Eval Lauf C v2). Der Schritt `check` läuft nur mit Here-Document direkt hinter dem Befehl: `allowed-tools` gibt genau `node "${CLAUDE_SKILL_DIR}/scripts/context.mjs" *` frei, eine Pipe oder `cat` davor wird verweigert. **Probeläufe aus Git Bash brauchen `MSYS_NO_PATHCONV=1`**, sonst wird aus `/pp` ein Windows-Pfad und der Skill lädt nicht.

Bestätigte Entscheide (25.10.2026): eigene Produktlinie, eigenes öffentliches Repo, Lizenz MIT, Befehl `/pp` (Codex: `$pp`), Start nach dem 23.10., Skill-Datei auf Englisch, Aufträge in der Sprache der Absicht.

## Verhältnis zum Haupt-Repo (BajKasum/PromptPrinter)

Zwei Repos, kein gemeinsamer Code, keine Laufzeit-Abhängigkeit. Gemeinsam sind Regeln und Ideen. Dieses Repo übernimmt Logik als Text oder Neuschreibung, nie per Import:

| Quelle im Haupt-Repo | Wird hier | Wo |
|---|---|---|
| `src/server/system-prompt.ts` (Finns Regeln, Schutzregeln gegen Injection) | Grundregeln des Skills, für Coding geschärft | `SKILL.md` |
| `src/features/projects/lib/project-context.ts` (Rangordnung der Quellen) | verbessert, mit Session, Git und Code | `SKILL.md`, `scripts/` |
| `src/server/brain/github-select.ts` (`SIGNAL_FILES`, Treffer-Deckel) | ins Skript übertragen | `scripts/context` |
| Faktenschema des Projekt-Gedächtnisses | Gliederung des Projektprofils, ohne Modellaufruf | `scripts/context` |
| `extractPrompt`, `normalize-fences` | im Skript für `save` und `check` | `scripts/context` |

**Abgleich:** ändert jemand eine dieser Quellen im Haupt-Repo, prüft er, ob der Skill nachziehen muss (und umgekehrt, wenn hier eine Regel geschärft wird, die auch Finn gilt). Im Haupt-Repo steht dazu ein Verweis in `CLAUDE.md`.

## Arbeitsregeln (verbindlich, wie im Haupt-Repo)

- **Code in Phasen per Branch und Pull Request:** ein Branch je Phase (`feat/…`, `eval/…`), von frischem `main`, mehrere Commits, ein Pull Request, "Rebase and merge", ein PR nach dem anderen. **Kleine, risikolose Änderungen** (Doku, Sicherheitsrichtlinie, Konfiguration ohne Wirkung) gehen direkt auf `main`, ohne Branch (Kasum, 25.10.2026, wie im Haupt-Repo seit 24.10.).
- **Branches nie löschen, nie force-pushen.** Staging immer per Dateiname, nie `git add .`.
- **Gate vor Push und Merge:** `npm run check` und `npm test`, die CI wiederholt beides. `npm run mutation` läuft nur lokal und dauert lange: bei jeder Änderung an einer Schranke oder am Text von `SKILL.md`.
- **Mutationstest für jede neue Schranke:** Schranke kaputt machen, der Test muss anschlagen, danach aus der Sicherung zurücksetzen.
- **Commit-Trailer:** `Co-Authored-By: Claude <aktuelles Modell> <noreply@anthropic.com>`. Nachrichten nach Conventional Commits (`feat:`, `fix:`, `docs:`, `ci:`), deutsch, Imperativ, klein nach dem Doppelpunkt.
- **Workflows:** `permissions: contents: read` oben, jede Action an eine Commit-SHA mit Versionskommentar.
- **Eval-Läufe** nur in einer Kopie ohne Remote, mit `--strict-mcp-config`, `--disallowedTools "Bash(git push *)" "Bash(gh *)"` und `--max-budget-usd`. Gold-Fakten werden committet, bevor ein Lauf startet.
- **Keine Telemetrie, nichts an PromptPrinter senden.** Das Skript schwärzt Geheimnisse und begrenzt Menge und Zeit.
- **Kein `python` in der Shell** (Windows-Store-Verknüpfung hängt), `node` nehmen.
- **Rechtliches klein halten** (Entscheid 17.10.2026 im Haupt-Projekt): keine Verträge, kein Jurist vorschlagen.
