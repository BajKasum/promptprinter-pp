// Wegwerf-Skript des Spikes (PromptPrinter 2.0). Gibt nur Prozessdaten aus: kein Netzwerk, keine Datei.
console.log(
  JSON.stringify({
    argv: process.argv.slice(2),
    cwd: process.cwd(),
    platform: process.platform,
    version: process.version,
  }),
);
process.exit(0);
