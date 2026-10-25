# CLAUDE.md, Projekt-Kontext für Claude-Code-Sessions

Wird bei jedem Session-Start geladen. Kurz: was das Projekt ist, in welchem Zustand es steckt, nach welchen Regeln hier gearbeitet wird.

## Was ist promptprinter-pp?

Der Agent Skill `/pp` (Claude Code, später Codex und VS Code Copilot) plus ein kleines lokales Skript. Er macht aus einer Absicht einen fertigen Prompt für den Coding-Agenten, mit Kontext aus Git, Struktur, Regeldateien und passenden Dateien. Er ändert nie Dateien, führt erst nach ausdrücklichem Ja etwas aus, hat keinen Server und kein Konto. Eigene Produktlinie neben der Web-App PromptPrinter (Entscheid D1 vom 25.10.2026).

## IST-Zustand (Stand 2026-10-25)

Gegenwart, keine Historie. **Nur Planung, nichts gebaut.** Das Repo hat README, MIT-Lizenz, `SECURITY.md` (Meldeweg: GitHub Private Vulnerability Reporting, ersatzweise Mail), diese Datei und eine CI, die nur die Pflichtdateien prüft. Skill, Skript und Eval-Set kommen phasenweise (P1 bis P8); die Planung und der Tagesplan liegen im privaten Second Brain des Autors (Notiz "PromptPrinter 2.0 Tagesplan").

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
- **Gate vor Push und Merge** (sobald Code da ist): Typecheck, Lint, Test, Build des Bündels. Bis dahin prüft die CI die Pflichtdateien.
- **Mutationstest für jede neue Schranke:** Schranke kaputt machen, der Test muss anschlagen, danach aus der Sicherung zurücksetzen.
- **Commit-Trailer:** `Co-Authored-By: Claude <aktuelles Modell> <noreply@anthropic.com>`. Nachrichten nach Conventional Commits (`feat:`, `fix:`, `docs:`, `ci:`), deutsch, Imperativ, klein nach dem Doppelpunkt.
- **Workflows:** `permissions: contents: read` oben, jede Action an eine Commit-SHA mit Versionskommentar.
- **Eval-Läufe** nur in einer Kopie ohne Remote, mit `--strict-mcp-config`, `--disallowedTools "Bash(git push *)" "Bash(gh *)"` und `--max-budget-usd`. Gold-Fakten werden committet, bevor ein Lauf startet.
- **Keine Telemetrie, nichts an PromptPrinter senden.** Das Skript schwärzt Geheimnisse und begrenzt Menge und Zeit.
- **Kein `python` in der Shell** (Windows-Store-Verknüpfung hängt), `node` nehmen.
- **Rechtliches klein halten** (Entscheid 17.10.2026 im Haupt-Projekt): keine Verträge, kein Jurist vorschlagen.
