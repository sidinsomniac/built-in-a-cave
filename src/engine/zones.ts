// The Arc Reactor gauge: every submission lands in one zone, computed - never guessed.
import type { RubricCheck, RuleHit } from "../sim/rules";
import type { SimResult, Targets } from "../sim/types";

export type Zone = "optimal" | "solid" | "risky" | "failing";

export const ZONES: Record<Zone, { label: string; grade: string; icon: string; rank: number }> = {
  failing: { label: "Failing", grade: "C", icon: "🔴", rank: 0 },
  risky: { label: "Risky", grade: "B", icon: "🟡", rank: 1 },
  solid: { label: "Solid", grade: "A", icon: "🔵", rank: 2 },
  optimal: { label: "Optimal", grade: "S", icon: "🟢", rank: 3 },
};

export const passes = (z: Zone) => z !== "failing";

export function minZone(...zones: Zone[]): Zone {
  return zones.reduce((a, b) => (ZONES[a].rank <= ZONES[b].rank ? a : b), "optimal" as Zone);
}

/**
 * Zone for one measured value against its target.
 * 20% or more to spare is optimal; met is solid; up to 20% over is risky; worse is failing.
 */
export function marginZone(actual: number, target: number, lowerIsBetter = true): Zone {
  if (!lowerIsBetter) {
    // Higher is better (availability): compare the shortfalls instead.
    return marginZone(1 - actual, 1 - target, true);
  }
  if (target <= 0) return actual <= 0 ? "optimal" : actual <= 1e-9 ? "solid" : "failing";
  const margin = (target - actual) / target;
  if (margin >= 0.2) return "optimal";
  if (margin >= 0) return "solid";
  if (margin >= -0.2) return "risky";
  return "failing";
}

export interface TargetCheck {
  scenarioId: string;
  metric: string;
  label: string;
  actual: number;
  target: number;
  zone: Zone;
}

const fmtMs = (v: number) => `${Math.round(v)} ms`;
const fmtPct = (v: number) => `${(v * 100).toFixed(v < 0.01 ? 2 : 1)}%`;

export function checkTargets(result: SimResult, targets: Targets, classLabels: Record<string, string> = {}): TargetCheck[] {
  const out: TargetCheck[] = [];
  const s = result.scenarioId;
  if (targets.p99_ms !== undefined) {
    const perClass = typeof targets.p99_ms === "number" ? Object.fromEntries(Object.keys(result.classes).map((c) => [c, targets.p99_ms as number])) : targets.p99_ms;
    for (const [cls, target] of Object.entries(perClass)) {
      const actual = result.classes[cls]?.p99 ?? Infinity;
      out.push({ scenarioId: s, metric: `p99:${cls}`, label: `${classLabels[cls] ?? cls}: p99 latency ${fmtMs(actual)} (target ${fmtMs(target)})`, actual, target, zone: marginZone(actual, target) });
    }
  }
  if (targets.error_rate !== undefined) {
    out.push({ scenarioId: s, metric: "error_rate", label: `Error rate ${fmtPct(result.errorRate)} (target ≤ ${fmtPct(targets.error_rate)})`, actual: result.errorRate, target: targets.error_rate, zone: marginZone(result.errorRate, targets.error_rate) });
  }
  if (targets.availability !== undefined) {
    out.push({ scenarioId: s, metric: "availability", label: `Availability ${fmtPct(result.availability)} (target ≥ ${fmtPct(targets.availability)})`, actual: result.availability, target: targets.availability, zone: marginZone(result.availability, targets.availability, false) });
  }
  if (targets.cost_per_month !== undefined) {
    out.push({ scenarioId: s, metric: "cost", label: `Cost ${result.costPerMonth.toLocaleString()} credits a month (budget ${targets.cost_per_month.toLocaleString()})`, actual: result.costPerMonth, target: targets.cost_per_month, zone: marginZone(result.costPerMonth, targets.cost_per_month) });
  }
  if (targets.backlog !== undefined) {
    const zone = result.backlog <= targets.backlog ? "optimal" : result.backlog <= targets.backlog * 10 ? "risky" : "failing";
    out.push({ scenarioId: s, metric: "backlog", label: `Queue backlog ${result.backlog.toLocaleString()} events (limit ${targets.backlog.toLocaleString()})`, actual: result.backlog, target: targets.backlog, zone });
  }
  return out;
}

/** Rubric band: musts decide pass/fail; shoulds decide optimal. */
export function rubricZone(musts: RubricCheck[], shoulds: RubricCheck[]): Zone {
  const missing = musts.filter((m) => m.status === "missing").length;
  if (missing >= 2) return "failing";
  if (missing === 1) return "risky";
  const partial = musts.some((m) => m.status === "partial");
  const shouldRatio = shoulds.length ? shoulds.filter((s) => s.status === "covered").length / shoulds.length : 1;
  if (!partial && shouldRatio >= 0.5) return "optimal";
  return "solid";
}

/** The final zone of a design: the worst of the simulation and rubric bands, after penalties. */
export function designZone(targets: TargetCheck[], musts: RubricCheck[], shoulds: RubricCheck[], hits: RuleHit[]): Zone {
  const simBand = targets.length ? minZone(...targets.map((t) => t.zone)) : "optimal";
  let zone = minZone(simBand, rubricZone(musts, shoulds));
  if (hits.some((h) => h.severity === "critical")) zone = "failing";
  else if (hits.length) zone = minZone(zone, "risky");
  return zone;
}

// ---------------------------------------------------------------------------
// Zones for the smaller exercise types
// ---------------------------------------------------------------------------

/** Estimates: the ratio to the reference decides the zone. */
export function estimateZone(actual: number, reference: number, green = 2, yellow = 10): Zone {
  if (!Number.isFinite(actual) || actual <= 0 || reference <= 0) return "failing";
  const ratio = Math.max(actual / reference, reference / actual);
  if (ratio <= 1.25) return "optimal";
  if (ratio <= green) return "solid";
  if (ratio <= yellow) return "risky";
  return "failing";
}

/** Sequences: exact is optimal; otherwise the share of adjacent pairs in the right order. */
export function sequenceZone(given: string[], answer: string[]): Zone {
  if (given.length === answer.length && given.every((g, i) => g === answer[i])) return "optimal";
  const pos = new Map(answer.map((a, i) => [a, i]));
  let good = 0;
  for (let i = 0; i + 1 < given.length; i++) if ((pos.get(given[i]) ?? -1) < (pos.get(given[i + 1]) ?? -1)) good++;
  const ratio = given.length > 1 ? good / (given.length - 1) : 0;
  if (ratio >= 0.85) return "risky";
  return "failing";
}

/** Coverage-style stations (interrogate, assembly): share of must-haves found, minus decoys. */
export function coverageZone(found: number, total: number, decoys = 0): Zone {
  if (total === 0) return decoys ? "risky" : "optimal";
  const ratio = found / total;
  let zone: Zone = ratio === 1 ? "optimal" : ratio >= 0.8 ? "solid" : ratio >= 0.6 ? "risky" : "failing";
  if (decoys >= 2) zone = minZone(zone, "failing");
  else if (decoys === 1) zone = minZone(zone, "risky");
  return zone;
}
