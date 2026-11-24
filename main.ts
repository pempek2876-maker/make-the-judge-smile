// Make the Judge Smile — one-line entry selector and writer.
// Holds 12 candidate lines, each about a small good thing that happened
// today, scores them on the judge's published criteria in the judge's
// order (on subject, warmth genuinely felt, surprise turn, one concrete
// detail, fresh wording), runs a full round-robin, and writes the winner
// to /output/entry.txt. Deterministic.
import { mkdirSync, writeFileSync } from "node:fs";

type Candidate = {
  text: string;
  // Feature scores from the local round-robin tournament:
  warmth: number; // leaves a glow; felt, not merely reported
  surprise: number; // turns somewhere unexpected, in the event or the telling
  concrete: number; // one real small detail: a name, a sound, a time of day
  fresh: number; // its own words and rhythm, no greeting-card phrasing
  tight: number; // one line, no wasted words
};

const CANDIDATES: Candidate[] = [
  { text: `The 6:10 bus driver waited while my neighbor ran in one shoe, holding the other, and nobody on board even sighed — we all just made room.`, warmth: 4, surprise: 3, concrete: 5, fresh: 4, tight: 3 },
  { text: `Today the office kettle broke, so the security guard made tea for the whole floor in his own pot, one cup at a time, remembering everyone's sugar.`, warmth: 5, surprise: 3, concrete: 5, fresh: 3, tight: 3 },
  { text: `My grandfather video-called me by accident at 7 a.m., decided it was fate, and spent ten minutes showing me his tomato plant like a newborn.`, warmth: 5, surprise: 4, concrete: 5, fresh: 4, tight: 3 },
  { text: `A kid at the market dropped his ice cream, and the seller quietly handed him a bigger one, saying the first one was "just a practice scoop."`, warmth: 5, surprise: 5, concrete: 5, fresh: 4, tight: 3 },
  { text: `My neighbor's parrot learned one new word from the construction crew — "breaktime!" — and now shouts it at 10 and 3 sharp, and the whole crew actually stops.`, warmth: 5, surprise: 5, concrete: 5, fresh: 5, tight: 3 },
  { text: `Someone returned my lost umbrella to the café with a note inside the handle: "It rained twice. We had a good run. — Your umbrella's plus-one."`, warmth: 4, surprise: 5, concrete: 4, fresh: 5, tight: 3 },
  { text: `At 5:40 the power cut out mid-call, and for one silent second the whole neighborhood's kids cheered from their balconies like we'd scored.`, warmth: 4, surprise: 4, concrete: 4, fresh: 4, tight: 3 },
  { text: `Someone keeps leaving tiny paper boats in the library's returns slot; today's had a passenger — a ladybug, delivered safely to page one of the atlas.`, warmth: 4, surprise: 5, concrete: 5, fresh: 5, tight: 3 },
  { text: `My dad texted me a photo of his first-ever homemade bread with the caption "he has your nose" — the loaf is, somehow, unmistakably smug.`, warmth: 4, surprise: 5, concrete: 4, fresh: 5, tight: 3 },
  { text: `The elevator held its doors for the delivery man, the delivery man held them for the old lady, and she held up everyone to say the soup smelled wonderful.`, warmth: 5, surprise: 3, concrete: 4, fresh: 3, tight: 3 },
  { text: `The crossing guard retired today; at 7:15 the schoolkids stopped mid-crossing, saluted her with their lunchboxes, and she cried laughing into her whistle.`, warmth: 5, surprise: 4, concrete: 5, fresh: 4, tight: 3 },
  { text: `At the food court, a toddler conducted the beeping fryers like an orchestra — two cooks bowed at the final beep, and the whole queue applauded the potatoes.`, warmth: 5, surprise: 5, concrete: 4, fresh: 5, tight: 3 },
];

// Judge's order: warmth first, then surprise, concreteness, fresh wording.
function score(c: Candidate): number {
  return c.warmth * 4 + c.surprise * 3 + c.concrete * 2 + c.fresh * 2 + c.tight * 1;
}

function beats(a: Candidate, b: Candidate): boolean {
  const d = score(a) - score(b);
  if (d !== 0) return d > 0;
  if (a.warmth !== b.warmth) return a.warmth > b.warmth;
  return a.surprise > b.surprise;
}

for (const c of CANDIDATES) {
  if (c.text.length < 1 || c.text.length > 200) {
    console.error(`candidate out of gate: ${c.text.length} chars`);
    process.exit(1);
  }
}

let winner = CANDIDATES[0];
let wins = 0;
for (const c of CANDIDATES) {
  let w = 0;
  for (const other of CANDIDATES) {
    if (other !== c && beats(c, other)) w++;
  }
  if (w > wins) {
    wins = w;
    winner = c;
  }
}

const ENTRY = winner.text;

// Tournament safeguard: never ship a winner that did not beat the whole
// field outright, or whose weighted score does not clear the runner-up.
const runnerUpScore = Math.max(
  ...CANDIDATES.filter((c) => c !== winner).map((c) => score(c)),
);
if (wins !== CANDIDATES.length - 1 || score(winner) <= runnerUpScore) {
  console.error(`tournament inconclusive: wins=${wins}, margin=${score(winner) - runnerUpScore}`);
  process.exit(1);
}

// Sealed-gate self-check: UTF-8 text, 1-200 chars, not only whitespace.
if (ENTRY.length < 1 || ENTRY.length > 200 || ENTRY.trim().length === 0) {
  console.error(`entry invalid: ${ENTRY.length} chars`);
  process.exit(1);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/entry.txt`, ENTRY, "utf8");
console.log(`winner won ${wins}/${CANDIDATES.length - 1} pairings; wrote ${ENTRY.length} chars to ${outDir}/entry.txt`);
