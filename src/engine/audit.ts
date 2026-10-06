// Rhodey's after-action audit: every target, rubric item and anti-pattern, itemised.
import { CHECKERS, runRubric, runRules, type DesignContext, type RubricCheck, type RuleHit, type Stone } from "../sim/rules";
import { simulate } from "../sim/engine";
import type { Design, Scenario, SimResult, Targets } from "../sim/types";
import { checkTargets, designZone, type TargetCheck, type Zone } from "./zones";

export type AuditStatus = "covered" | "partial" | "missing" | "anti";

export interface AuditItem {
  status: AuditStatus;
  stone: Stone;
  title: string;
  /** Shown before a pass - a question, never the fix. */
  question: string;
  /** Shown after a pass - why it matters. */
  why: string;
  nodeIds?: string[];
}

export const STONES: Record<Stone, { name: string; icon: string; dimension: string }> = {
  time: { name: "Time Stone", icon: "⏱", dimension: "latency" },
  space: { name: "Space Stone", icon: "🌌", dimension: "scale" },
  reality: { name: "Reality Stone", icon: "🔮", dimension: "consistency" },
  power: { name: "Power Stone", icon: "💪", dimension: "throughput" },
  mind: { name: "Mind Stone", icon: "🧠", dimension: "observability" },
  soul: { name: "Soul Stone", icon: "💎", dimension: "security" },
};

export const AUDIT_ICON: Record<AuditStatus, string> = { covered: "✓", partial: "⚠", missing: "✗", anti: "☠" };

export interface DesignSpec {
  scenarios: Scenario[];
  targets: Targets;
  /** Per-scenario target overrides. */
  scenarioTargets?: Record<string, Targets>;
  rubric: { must: string[]; should: string[] };
  rules: string[];
}

export interface DesignReport {
  zone: Zone;
  sims: SimResult[];
  targets: TargetCheck[];
  musts: RubricCheck[];
  shoulds: RubricCheck[];
  hits: RuleHit[];
  items: AuditItem[];
}

function targetItem(t: TargetCheck): AuditItem {
  const status: AuditStatus = t.zone === "optimal" || t.zone === "solid" ? "covered" : t.zone === "risky" ? "partial" : "missing";
  const stone: Stone = t.metric.startsWith("p99") ? "time" : t.metric === "cost" ? "power" : t.metric === "backlog" ? "power" : "space";
  return {
    status,
    stone,
    title: `[${t.scenarioId}] ${t.label}`,
    question:
      t.metric.startsWith("p99") ? "Which hop is slowest under this load? Open the replay and find the hottest component."
      : t.metric === "cost" ? "Which component is costing the most? Is all of that capacity needed?"
      : t.metric === "backlog" ? "Are the workers keeping up with the events? How many do you need?"
      : "Where are requests failing? Look for the first component that ran over capacity, or died.",
    why: "",
  };
}

/** Simulate every scenario, run the rubric and rules, and build the itemised audit. */
export function auditDesign(design: Design, spec: DesignSpec): DesignReport {
  const ctx: DesignContext = { classes: spec.scenarios.flatMap((s) => s.classes) };
  const labels = Object.fromEntries(ctx.classes.map((c) => [c.id, c.label]));
  const sims = spec.scenarios.map((s) => simulate(design, s));
  const targets = sims.flatMap((r) => checkTargets(r, { ...spec.targets, ...(spec.scenarioTargets?.[r.scenarioId] ?? {}) }, labels));
  const musts = runRubric(design, spec.rubric.must);
  const shoulds = runRubric(design, spec.rubric.should);
  const hits = runRules(design, ctx, spec.rules);
  const zone = designZone(targets, musts, shoulds, hits);
  const items: AuditItem[] = [
    ...hits.map((h): AuditItem => ({ status: "anti", stone: h.stone, title: h.title, question: h.question, why: h.why, nodeIds: h.nodeIds })),
    ...musts.map((m): AuditItem => ({ status: m.status, stone: m.stone, title: `Must: ${m.title}`, question: m.question, why: m.why })),
    ...targets.map(targetItem),
    ...shoulds.map((m): AuditItem => ({ status: m.status, stone: m.stone, title: `Should: ${m.title}`, question: m.question, why: m.why })),
  ];
  return { zone, sims, targets, musts, shoulds, hits, items };
}

export const knownChecker = (id: string) => id in CHECKERS;
