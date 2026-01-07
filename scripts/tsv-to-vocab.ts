import Papa from "papaparse";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type KengdicRow = {
  surface?: string;
  gloss?: string | null;
  level?: string | null; // may be null in many rows
};

type VocabWord = {
  id: string;
  kr: string;
  en: string[];
  level: string | null;
};

function uniqStrings(items: string[]) {
  return Array.from(new Set(items));
}

function normalizeAnswer(s: string) {
  return s.trim().toLowerCase();
}

// Conservative synonym splitting
function splitGloss(gloss: string): string[] {
  return uniqStrings(
    gloss
      .split(/;|\/|\|/g)
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

// Optional: only keep Hangul surfaces (filters out some noise)
function isMostlyHangul(s: string) {
  // Hangul syllables range: AC00–D7A3
  // allow spaces and hyphen as well
  return /^[\uAC00-\uD7A3\s-]+$/.test(s);
}

// Optional heuristic level when KEngDic has null
function heuristicLevel(kr: string): string | null {
  // Very rough (MVP): shorter/single-word => easier
  const len = kr.replace(/\s+/g, "").length;
  if (len <= 2) return "A";
  if (len <= 4) return "B";
  if (len <= 6) return "C";
  return "D";
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (key: string, fallback?: string) => {
    const i = args.indexOf(key);
    return i >= 0 ? args[i + 1] : fallback;
  };

  const input = get("--input", "src/assets/raw/kengdic.tsv")!;
  const out = get("--out", "src/assets/vocab.json")!;
  const limit = Math.max(0, Number(get("--limit", "0")) || 0);

  const hangulOnly = (get("--hangulOnly", "true") ?? "true") === "true";
  const inferLevel = (get("--inferLevel", "false") ?? "false") === "true";

  return { input, out, limit, hangulOnly, inferLevel };
}

async function main() {
  const { input, out, limit, hangulOnly, inferLevel } = parseArgs();

  const inputPath = resolve(input);
  const tsvText = await readFile(inputPath, "utf8");

  const parsed = Papa.parse<KengdicRow>(tsvText, {
    header: true,
    delimiter: "\t",
    skipEmptyLines: true,
  });

  if (parsed.errors?.length) {
    console.warn("TSV parse warnings (first 5):", parsed.errors.slice(0, 5));
  }

  const vocab: VocabWord[] = [];
  const seenKr = new Set<string>();

  for (const row of parsed.data) {
    const kr = row?.surface?.trim();
    const gloss = row?.gloss?.trim?.() ?? "";
    if (!kr || !gloss) continue;

    if (hangulOnly && !isMostlyHangul(kr)) continue;

    // avoid duplicates by Korean surface
    if (seenKr.has(kr)) continue;
    seenKr.add(kr);

    const enList = splitGloss(gloss).map(normalizeAnswer).filter(Boolean);
    if (enList.length === 0) continue;

    const levelFromData = row?.level ? String(row.level).trim() : null;
    const level = levelFromData || (inferLevel ? heuristicLevel(kr) : null);

    vocab.push({
      id: `w${String(vocab.length + 1).padStart(5, "0")}`,
      kr,
      en: enList,
      level,
    });

    console.log(`Progress :  ${vocab.length}`);

    if (limit > 0 && vocab.length >= limit) break;
  }

  const outPath = resolve(out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(vocab, null, 2), "utf8");

  console.log(`✅ Generated ${vocab.length} entries -> ${out}`);
  console.log(`Options: hangulOnly=${hangulOnly}, inferLevel=${inferLevel}`);
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});
