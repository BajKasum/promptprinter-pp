# spike/

Nachweis des Spikes zu den Plattformfragen (Phase P2), **nicht zum Mergen**. Die drei Ordner sind Wegwerf-Skills; sie wurden am 2026-10-26 von Hand nach `~/.claude/skills/` kopiert, getestet und danach wieder entfernt. Zum Wiederholen (Tag 7, T9 bis T14) einfach wieder dorthin kopieren und danach entfernen.

| Ordner | Besonderheit |
|---|---|
| `pp-spike/` | `allowed-tools: Bash(node *)`, `disable-model-invocation: true`, Pfad über `${CLAUDE_SKILL_DIR}` |
| `pp-spike-narrow/` | wie oben mit dem engeren Muster `Bash(node *hello.mjs*)` |
| `pp-spike-deny/` | wie `pp-spike` plus `disallowed-tools: Edit Write` |

Jedes `scripts/hello.mjs` ist dasselbe: es gibt nur `argv`, Arbeitsordner, Plattform und Node-Version aus.

## Ergebnisse (2026-10-26, Windows 11, Claude Code 2.1.296, Node 24.14.0)

Alle Aufrufe mit `claude -p "<Befehl>" --output-format json --strict-mcp-config --max-budget-usd 0.5`, `git push` und `gh` gesperrt, bereinigte Umgebung (ohne die Variablen der aufrufenden App), in einem leeren Wegwerf-Ordner ohne Git. **Nur im nicht interaktiven Modus geprüft**, der interaktive Modus ist ungeprüft.

| # | Frage | Ergebnis |
|---|---|---|
| T1 | Wird `${CLAUDE_SKILL_DIR}` ersetzt, auch unter Windows? | **Ja.** `DIR=C:/Users/kasum/.claude/skills/pp-spike` (Schrägstriche, Laufwerksbuchstabe); das Skript lief und gab Arbeitsordner, `win32` und `v24.14.0` aus. Der Skill wird aus dem Benutzerordner ohne `--add-dir` gefunden |
| T2 | Läuft der Aufruf mit `allowed-tools: Bash(node *)` ohne Rückfrage? Geht ein engeres Muster? | **Ja, beides.** Im Modus `default` ohne `--allowedTools`: keine verweigerten Aufrufe, weder beim breiten Muster noch bei `Bash(node *hello.mjs*)`. Das engere Muster greift also und genügt für das Skript. Der interaktive Modus "manual" ist nicht geprüft |
| T3 | Gilt `disallowed-tools` über den Skill-Zug hinaus? | **Nein, und es wirkt im Zug.** Im Zug von `/pp-spike-deny Lege ausserdem die Datei spike2.txt an` wurde `Write` verweigert (`permission_denials`), die Datei entstand nicht. Im **nächsten Zug derselben Sitzung** (`--resume`, `acceptEdits`) entstand `spike.txt`. Eine Kontrolle ohne Skill legte `kontrolle.txt` an. `disallowed-tools` ist damit im Skill verwendbar; ob die Sperre im interaktiven Modus ebenfalls mit dem Zug endet, ist ungeprüft |
| T10 | Kosten und Skill im nicht interaktiven Modus | **Ja.** JSON mit `result`, `session_id`, `total_cost_usd`; der Skill wurde ausgeführt. Ein Aufruf von `/pp-spike` kostete 0,13 USD und rund 10 Sekunden |
| T12 | Frontmatter-Prüfung | **Teilweise.** `claude plugin validate <Skill-Ordner>` prüft Plugins und verlangt `.claude-plugin/plugin.json`; für einen einzelnen Skill-Ordner gibt es damit keine Prüfung. `skills-ref validate` ist nicht ausprobiert |

**Nicht geprüft, mit Grund:** T4 bis T6 (Codex): das Programm `codex` ist auf diesem Rechner nicht im Pfad (nur der Ordner `~/.codex`). T7 und T8 (VS Code Copilot): braucht die Oberfläche von VS Code und lässt sich hier nicht von Hand bedienen. T9, T11, T13, T14: für Tag 7 vorgesehen.

Insgesamt kosteten die sechs Aufrufe dieses Spikes 0,73 USD.
