// lib/sentenceSplit.ts

export function splitIntoSentences(input: string): string[] {
  if (!input) return [];

  // Normalize newlines
  let s = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // If something sent literal "\n" characters, convert them
  s = s.replace(/\\n/g, "\n");

  // Trim outer whitespace
  s = s.trim();

  // 1) Prefer splitting by newlines if present
  const byLines = s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  if (byLines.length > 1) {
    return byLines.map(ensureTerminalPunctuation);
  }

  // 2) Fallback: split by punctuation boundaries
  const byPunct = s
    .split(/(?<=[.!?])(?:\s+|$)/g)
    .map((x) => x.trim())
    .filter(Boolean);

  return byPunct.map(ensureTerminalPunctuation);
}

function ensureTerminalPunctuation(x: string): string {
  if (/[.!?]$/.test(x)) return x;
  return x + ".";
}
