// Graders for the non-simulation stations. Each returns a zone plus audit items,
// so every submission - not just designs - gets a gauge reading and Rhodey's list.
import type { Stone } from "../sim/rules";
import type { AuditItem } from "./audit";
import { coverageZone, estimateZone, minZone, rubricZone, type Zone } from "./zones";

export interface Graded {
  zone: Zone;
  items: AuditItem[];
}

// ---------------------------------------------------------------------------
// Interrogate Pepper
// ---------------------------------------------------------------------------

export interface Requirement {
  id: string;
  text: string;
  must: boolean;
}
export interface Question {
  id: string;
  q: string;
  a: string;
  reveals: string[];
  cost: number;
}

export function gradeInterrogation(asked: string[], pool: Question[], requirements: Requirement[]): Graded {
  const revealed = new Set(pool.filter((q) => asked.includes(q.id)).flatMap((q) => q.reveals));
  const musts = requirements.filter((r) => r.must);
  const wasted = pool.filter((q) => asked.includes(q.id) && q.reveals.length === 0).length;
  const found = musts.filter((r) => revealed.has(r.id)).length;
  let zone = coverageZone(found, musts.length);
  if (wasted >= 2) zone = minZone(zone, "solid");
  const items: AuditItem[] = requirements.map((r) => ({
    status: revealed.has(r.id) ? "covered" : r.must ? "missing" : "partial",
    stone: "mind",
    title: r.must ? `Must uncover: ${revealed.has(r.id) ? r.text : "a hidden requirement"}` : `Nice to uncover: ${revealed.has(r.id) ? r.text : "a hidden detail"}`,
    question: "There's still a requirement that would change your design. Which kind of question haven't you asked yet - about volume, speed, features, or how long data lives?",
    why: r.text,
  }));
  if (wasted) {
    items.push({
      status: "partial",
      stone: "mind",
      title: `${wasted} question${wasted > 1 ? "s" : ""} that didn't change the design`,
      question: "Would the answer to that question have changed a single box or number?",
      why: "In an interview, every minute counts. Ask questions whose answers change the architecture.",
    });
  }
  return { zone, items };
}

// ---------------------------------------------------------------------------
// The estimation bench
// ---------------------------------------------------------------------------

export interface Ask {
  id: string;
  label: string;
  unit: string;
  answer: number;
}

export function gradeEstimates(values: Record<string, number>, asks: Ask[]): Graded {
  const zones = asks.map((a) => estimateZone(values[a.id] ?? NaN, a.answer));
  const items: AuditItem[] = asks.map((a, i) => ({
    status: zones[i] === "optimal" || zones[i] === "solid" ? "covered" : zones[i] === "risky" ? "partial" : "missing",
    stone: "space",
    title: `${a.label}: ${Number.isFinite(values[a.id]) ? values[a.id].toLocaleString() : "—"} ${a.unit}`,
    question: "Check each step's units and the order of magnitude. Did you divide where you should multiply?",
    why: `The reference is about ${a.answer.toLocaleString()} ${a.unit}. Within 2× is fine in an interview.`,
  }));
  return { zone: minZone(...zones), items };
}

/**
 * A tiny, safe calculator for the scratchpad: numbers, + - * / ( ) and e-notation,
 * plus k, M, B suffixes (thousand, million, billion). No eval.
 */
export function calculate(expr: string): number {
  const src = expr.replace(/,/g, "").replace(/\s+/g, "");
  let i = 0;
  const peek = () => src[i];
  const number = (): number => {
    const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?([kmb])?/i.exec(src.slice(i));
    if (!m) throw new Error("Expected a number");
    i += m[0].length;
    const mult = { k: 1e3, m: 1e6, b: 1e9 }[(m[3] ?? "").toLowerCase()] ?? 1;
    return parseFloat(m[1] + (m[2] ?? "")) * mult;
  };
  const factor = (): number => {
    if (peek() === "-") {
      i++;
      return -factor();
    }
    if (peek() === "(") {
      i++;
      const v = expression();
      if (peek() !== ")") throw new Error("Missing )");
      i++;
      return v;
    }
    return number();
  };
  const term = (): number => {
    let v = factor();
    while (peek() === "*" || peek() === "/") {
      const op = src[i++];
      const r = factor();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  };
  const expression = (): number => {
    let v = term();
    while (peek() === "+" || peek() === "-") {
      const op = src[i++];
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  };
  const v = expression();
  if (i !== src.length) throw new Error(`Unexpected "${src[i]}"`);
  return v;
}

// ---------------------------------------------------------------------------
// The API desk
// ---------------------------------------------------------------------------

export interface Endpoint {
  method: string;
  path: string;
  purpose: string;
  status: number;
  options: string[];
}

export interface DeskExpect {
  method?: string[];
  status?: number[];
  pathParam?: boolean;
  options?: string[];
}

export interface DeskCheck {
  id: string;
  purpose: string;
  must: boolean;
  expect: DeskExpect;
  partial?: DeskExpect;
  stone: Stone;
  title: string;
  question: string;
  why: string;
}

const hasPathParam = (path: string) => /[:{][a-z_]+/i.test(path);

function matches(e: Endpoint, x: DeskExpect): boolean {
  if (x.method && !x.method.includes(e.method.toUpperCase())) return false;
  if (x.status && !x.status.includes(e.status)) return false;
  if (x.pathParam !== undefined && hasPathParam(e.path) !== x.pathParam) return false;
  if (x.options && !x.options.every((o) => e.options.includes(o))) return false;
  return true;
}

const UNSAFE_FOR_GET = ["create", "delete", "update"];

export function gradeDesk(endpoints: Endpoint[], checks: DeskCheck[]): Graded {
  const results = checks.map((c) => {
    const candidates = endpoints.filter((e) => e.purpose === c.purpose);
    const status: AuditItem["status"] = candidates.some((e) => matches(e, c.expect)) ? "covered" : c.partial && candidates.some((e) => matches(e, c.partial!)) ? "partial" : "missing";
    return { c, status };
  });
  const anti = endpoints.filter((e) => e.method.toUpperCase() === "GET" && UNSAFE_FOR_GET.includes(e.purpose));
  const asRubric = (must: boolean) =>
    results.filter((r) => r.c.must === must).map((r) => ({ id: r.c.id, status: r.status as "covered" | "partial" | "missing", stone: r.c.stone, title: r.c.title, question: r.c.question, why: r.c.why }));
  let zone = rubricZone(asRubric(true), asRubric(false));
  if (anti.length) zone = minZone(zone, "risky");
  const items: AuditItem[] = [
    ...anti.map((e): AuditItem => ({
      status: "anti",
      stone: "reality",
      title: `GET ${e.path} changes data`,
      question: "Browsers, crawlers and caches replay GET requests freely. What happens if one changes data?",
      why: "GET must be safe: it should only read. Creating or deleting belongs to POST or DELETE.",
    })),
    ...results.map((r): AuditItem => ({ status: r.status, stone: r.c.stone, title: `${r.c.must ? "Must" : "Should"}: ${r.c.title}`, question: r.c.question, why: r.c.why })),
  ];
  return { zone, items };
}

// ---------------------------------------------------------------------------
// Answer assembly (the RADIO pitch)
// ---------------------------------------------------------------------------

export interface Chip {
  id: string;
  text: string;
  section?: string;
  decoy?: boolean;
}

export function gradeAssembly(placements: Record<string, string>, chips: Chip[], sectionLabels: Record<string, string>): Graded {
  const real = chips.filter((c) => !c.decoy);
  const correct = real.filter((c) => placements[c.id] === c.section);
  const decoysUsed = chips.filter((c) => c.decoy && placements[c.id]);
  const zone = coverageZone(correct.length, real.length, decoysUsed.length);
  const items: AuditItem[] = [
    ...decoysUsed.map((c): AuditItem => ({
      status: "anti",
      stone: "reality",
      title: `Decoy in your pitch: "${c.text}"`,
      question: "Would an interviewer accept this? What happens to it at scale, on a collision, or to your data?",
      why: "This statement sounds reasonable but describes a known failure. Leave it out, or say why it's wrong.",
    })),
    ...real.map((c): AuditItem => {
      const placed = placements[c.id];
      return {
        status: placed === c.section ? "covered" : placed ? "partial" : "missing",
        stone: "mind",
        title: placed === c.section ? `${sectionLabels[c.section!]}: ${c.text}` : placed ? `In the wrong section: "${c.text}"` : `Left out: "${c.text}"`,
        question: "Which RADIO question does this statement answer - what, how it's built, what's stored, how it's called, or how it's improved?",
        why: `This belongs in ${sectionLabels[c.section!]}.`,
      };
    }),
  ];
  return { zone, items };
}

/**
 * The parts briefing: every card must be answered right to finish. Getting them
 * right first time is optimal; a few second tries is solid; many is risky.
 */
export function gradeBriefing(picks: Record<number, number[]>, cards: { answer: number; q: string; why: string }[]): Graded {
  const done = cards.every((c, i) => (picks[i] ?? []).includes(c.answer));
  const firstTry = cards.filter((c, i) => (picks[i] ?? [])[0] === c.answer).length;
  const zone = !done ? "failing" : firstTry === cards.length ? "optimal" : firstTry >= cards.length * 0.6 ? "solid" : "risky";
  const items: AuditItem[] = cards.map((c, i) => {
    const p = picks[i] ?? [];
    return {
      status: p[0] === c.answer ? "covered" : p.includes(c.answer) ? "partial" : "missing",
      stone: "mind",
      title: c.q,
      question: "Open this part's Field Manual card above and read how it behaves.",
      why: c.why,
    };
  });
  return { zone, items };
}

/** A quiz: every question right is optimal; 80% solid; 60% risky; less fails. */
export function gradeQuiz(picks: (number | undefined)[], questions: { q: string; answer: number; why: string }[]): Graded {
  const right = questions.filter((q, i) => picks[i] === q.answer).length;
  const share = questions.length ? right / questions.length : 0;
  const zone = share === 1 ? "optimal" : share >= 0.8 ? "solid" : share >= 0.6 ? "risky" : "failing";
  const items: AuditItem[] = questions.map((q, i) => ({
    status: picks[i] === q.answer ? "covered" : "missing",
    stone: "mind",
    title: q.q,
    question: "Picture the scenario step by step. Which part is doing the work at that moment?",
    why: q.why,
  }));
  return { zone, items };
}

/**
 * A trade-off: the wrong option fails. The right option with exactly the right
 * reasons is optimal; with some right reasons missing, solid; with any wrong
 * reason ticked, risky - a right call for the wrong reason.
 */
export function gradeTradeoff(choice: number | null, reasons: number[], ex: { answer: number; reasons: { text: string; right: boolean }[]; why: string }): Graded {
  const rightReasons = ex.reasons.map((r, i) => (r.right ? i : -1)).filter((i) => i >= 0);
  const wrongPicked = reasons.filter((i) => !ex.reasons[i]?.right);
  const missed = rightReasons.filter((i) => !reasons.includes(i));
  const zone = choice !== ex.answer ? "failing" : wrongPicked.length ? "risky" : missed.length ? "solid" : "optimal";
  const items: AuditItem[] = [
    {
      status: choice === ex.answer ? "covered" : "missing",
      stone: "reality",
      title: choice === ex.answer ? "The right call" : "Not the call that fits this situation",
      question: "Which constraint in the situation matters most? Which option serves it?",
      why: ex.why,
    },
    ...ex.reasons.map((r, i): AuditItem => ({
      status: r.right ? (reasons.includes(i) ? "covered" : "partial") : reasons.includes(i) ? "anti" : "covered",
      stone: "mind",
      title: r.right ? (reasons.includes(i) ? `Reason: ${r.text}` : `A reason you missed: ${r.text}`) : reasons.includes(i) ? `Not a real reason: ${r.text}` : `Rightly left out: ${r.text}`,
      question: r.right ? "Is there another reason this option wins here?" : "Is this statement actually true - and does it decide anything here?",
      why: "",
    })),
  ];
  return { zone, items };
}
