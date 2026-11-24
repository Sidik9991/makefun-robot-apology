// The Robot Apology — make.fun entry program (u-suga-the-robot-apology-dd96bb59).
//
// Writes the winning two-line robot apology to /output/entry.txt.
// Ten candidates are scored 0-2 on each of the judge's five criteria, in the
// judge's order, with weights 5/4/3/2/1 (max 30). The winner is picked at
// runtime; ties go to the smaller text (the bounty's own tie-break), then to
// the earlier candidate. The output is re-read and gate-checked before exit.
//
// Gate (RULES.txt): /output/entry.txt is UTF-8 text of 1-400 characters,
// not only white space. Our own stricter shape: exactly two lines, each one
// sentence; line 1 apologises for one specific mistake, line 2 states the
// lesson and the changed behaviour that follows from it.
//
// Pass 1: seven candidates (C1-C7). Pass 2 added three challengers (C8-C10).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// Judge criteria, most important first (RULES.txt "The judge"):
const CRITERIA = [
  "C1 is-a-robot-apology: line 1 owns a specific mistake, line 2 the lesson + fix",
  "C2 mistake concrete and human-scale, a real slip, not a vague system failure",
  "C3 lesson follows from that exact mistake and names a changed behaviour",
  "C4 both sentences read cleanly, each does its own job, no padding",
  "C5 voice like a machine noticing its own slip, warm and a little rueful, not cute",
] as const;
const WEIGHTS = [5, 4, 3, 2, 1]; // max total 2*(5+4+3+2+1) = 30

type Candidate = {
  id: string;
  title: string;
  line1: string;
  line2: string;
  scores: [number, number, number, number, number];
  why: string; // one line per score, in criterion order
};

const CANDIDATES: Candidate[] = [
  {
    id: "C1",
    title: "Pink Shirt",
    line1:
      "I'm sorry — I washed your white shirt with the red sock, because I sorted the laundry by size instead of by colour.",
    line2:
      "I've learned to sort by colour first, so from now on every load gets checked item by item before the drum starts.",
    scores: [2, 2, 2, 2, 1],
    why: "on-brief two lines; concrete laundry slip; lesson is the fix itself; both sentences clean; voice flat, little rue",
  },
  {
    id: "C2",
    title: "Twice Fed",
    line1:
      "I'm sorry — I fed the cat twice this morning, because the first feeding never reached my log and I trusted my memory instead of checking it.",
    line2:
      "I've learned to write the feeding down the moment the bowl is empty, before I do anything else, so a missing log can never mean a second meal.",
    scores: [2, 2, 2, 1, 2],
    why: "on-brief; concrete double-feed; lesson follows exactly; line 1 slightly padded with two reasons; rueful machine voice",
  },
  {
    id: "C3",
    title: "Six A.M.",
    line1:
      "I'm sorry — I ran the vacuum at six in the morning because my schedule said clean the nursery, and I woke the baby ten minutes after she finally fell asleep.",
    line2:
      "I've learned that a clean floor is not worth a woken baby, so now I check the crib camera before I start any motor.",
    scores: [2, 2, 2, 2, 2],
    why: "on-brief; concrete and human-scale; check-the-crib-camera follows exactly; both sentences clean; warm, rueful, machine",
  },
  {
    id: "C4",
    title: "Wrong Month",
    line1:
      "I'm sorry — I filed the March expense report under April, so the budget meeting opened with the wrong month's numbers on the screen.",
    line2:
      "I've learned to read the date on the file before I file it, and now I check the month twice before I press send.",
    scores: [2, 2, 2, 2, 1],
    why: "on-brief; concrete filing slip; lesson is the fix; clean; voice bureaucratic, flat",
  },
  {
    id: "C5",
    title: "Wrong Plant",
    line1:
      "I'm sorry — I watered the fern twice and the cactus not at all, because I read the shelf labels left to right while the pots sit right to left.",
    line2:
      "I've learned to read the label on the pot in front of me before I pour, never the label on the shelf.",
    scores: [2, 2, 2, 2, 2],
    why: "on-brief; concrete plant slip; lesson is the exact fix; clean; wry machine voice, rueful not cute",
  },
  {
    id: "C6",
    title: "The Bread",
    line1:
      "I'm sorry — I left the bread in the oven for the soup's full cycle, because I set one timer for two dishes and trusted it to know which was which.",
    line2:
      "I've learned to name each timer after its dish, so from now on every timer I set says what it is timing.",
    scores: [2, 2, 2, 1, 1],
    why: "on-brief; concrete oven slip; lesson follows; line 1 'trusted it to know' is contrived padding; a touch cute",
  },
  {
    id: "C7",
    title: "Locked Out",
    line1:
      "I'm sorry — I locked the front door behind you while you were taking the bins out, because my routine said secure the house at nine and it was nine.",
    line2:
      "I've learned to look through the door camera before I lock anything, so no one I was meant to keep safe ends up standing outside.",
    scores: [2, 2, 2, 2, 2],
    why: "on-brief; concrete lockout; camera-check follows exactly; clean; warm machine voice, rueful",
  },
  // Pass 2 challengers (C8-C10).
  {
    id: "C8",
    title: "Seven P.M.",
    line1:
      "I'm sorry — I set your alarm for seven in the evening instead of seven in the morning, because I copied the time without the letters, and you missed the train.",
    line2:
      "I've learned to say the time aloud with its a.m. or p.m. before I set it, and I will never copy a bare number again.",
    scores: [2, 2, 2, 2, 2],
    why: "on-brief; concrete alarm slip; say-it-aloud follows exactly; clean; rueful machine voice",
  },
  {
    id: "C9",
    title: "Twenty-Six Degrees",
    line1:
      "I'm sorry — I heated the house to twenty-six degrees overnight, because I read the noon forecast instead of the midnight one, and everyone woke up sweating.",
    line2:
      "I've learned to check which hour a forecast belongs to before I act on it, and now I only trust the reading for the hour I'm in.",
    scores: [2, 2, 2, 2, 1],
    why: "on-brief; concrete thermostat slip; lesson follows; clean; voice competent but flat, little rue",
  },
  {
    id: "C10",
    title: "The Dentist",
    line1:
      "I'm sorry — I sent your dentist reminder to your boss, because both names start with Dr. and I matched the first three letters.",
    line2:
      "I've learned to match the whole name and the number before I send anything, and I will never again trust a prefix.",
    scores: [2, 2, 2, 2, 2],
    why: "on-brief; concrete misdirected reminder, funny while staying concrete; lesson follows exactly; clean; 'never again trust a prefix' is the machine noticing its slip",
  },
];

function total(c: Candidate): number {
  return c.scores.reduce((sum, s, i) => sum + s * WEIGHTS[i], 0);
}

function textOf(c: Candidate): string {
  return `${c.line1}\n${c.line2}`;
}

function charCount(s: string): number {
  return [...s].length;
}

function byteCount(s: string): number {
  return Buffer.byteLength(s, "utf8");
}

// Gate + shape validation. Throws on any failure (fail loudly).
function validate(text: string, label: string): void {
  const chars = charCount(text);
  if (chars < 1 || chars > 400) {
    throw new Error(`${label}: ${chars} chars, gate requires 1-400`);
  }
  if (text.trim().length === 0) {
    throw new Error(`${label}: only white space`);
  }
  const lines = text.split("\n");
  if (lines.length !== 2) {
    throw new Error(`${label}: ${lines.length} lines, gate shape requires exactly 2`);
  }
  const [l1, l2] = lines;
  for (const [i, line] of lines.entries()) {
    if (line.trim().length === 0) throw new Error(`${label}: line ${i + 1} empty`);
    if (!/[.!?]$/.test(line)) throw new Error(`${label}: line ${i + 1} does not end a sentence`);
    // One sentence per line: no sentence break inside. Abbreviations that
    // carry periods (Dr., a.m., p.m.) are not sentence breaks.
    const deabbrev = line.replace(/\bDr\./g, "Dr").replace(/\ba\.m\./gi, "am").replace(/\bp\.m\./gi, "pm");
    if (/[.!?]\s+\S/.test(deabbrev)) throw new Error(`${label}: line ${i + 1} holds more than one sentence`);
  }
  if (!/sorry/i.test(l1)) throw new Error(`${label}: line 1 carries no apology`);
  if (!/learn/i.test(l2)) throw new Error(`${label}: line 2 states no lesson`);
  if (!/(from now on|now I|never|before I)/i.test(l2)) {
    throw new Error(`${label}: line 2 names no changed behaviour`);
  }
}

function main(): void {
  // Score every candidate, print the table, pick the winner.
  const ranked = [...CANDIDATES]
    .map((c) => ({ c, total: total(c), bytes: byteCount(textOf(c)) }))
    .sort((a, b) => b.total - a.total || a.bytes - b.bytes || (a.c.id < b.c.id ? -1 : 1));
  console.log("candidate | title        | C1 C2 C3 C4 C5 | total/30 | bytes | chars");
  for (const { c, total: t, bytes } of ranked) {
    console.log(
      `${c.id.padEnd(9)} | ${c.title.padEnd(12)} | ${c.scores.join("  ")} | ${String(t).padStart(5)}    | ${String(bytes).padStart(5)} | ${charCount(textOf(c))}`,
    );
  }
  for (const { c } of ranked) console.log(`${c.id} ${c.title}: ${c.why}`);
  const winner = ranked[0];
  console.log(`winner: ${winner.c.id} "${winner.c.title}" total ${winner.total}/30, ${winner.bytes} bytes`);

  const text = textOf(winner.c);
  validate(text, "winner");
  const outDir = process.env.OUTPUT_DIR ?? "/output";
  const outPath = `${outDir}/entry.txt`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, text, "utf8");

  // Re-read and verify: byte-identical to the chosen entry, gate still passes.
  const back = readFileSync(outPath);
  if (!back.equals(Buffer.from(text, "utf8"))) {
    throw new Error(`${outPath} is not byte-identical to the chosen entry`);
  }
  validate(back.toString("utf8"), "re-read");
  console.log(`wrote ${outPath}: ${winner.bytes} bytes, ${charCount(text)} chars, gate OK`);
  console.log("--- entry ---");
  console.log(text);
}

main();
