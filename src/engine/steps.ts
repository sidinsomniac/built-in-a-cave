// Guided build steps for the design table (Mark I): one small objective at a time,
// each one ticked by checks on the player's own design - never by matching numbers.
import { simulate } from "../sim/engine";
import { runRubric, runRules, type DesignContext } from "../sim/rules";
import type { Design, NodeKind, Scenario } from "../sim/types";

/** One thing that must be true for a step to tick. */
export type StepCheck =
  /** The player has pressed "Run the simulation" at least once. */
  | { ran: true }
  /** The design has a node of this kind (optionally wired from a node of another kind). */
  | { has: NodeKind; from?: NodeKind }
  /** This anti-pattern rule no longer fires. */
  | { clear: string }
  /** This rubric checker is fully covered. */
  | { rubric: string }
  /**
   * In this scenario, every node of these kinds (all nodes if omitted) stays
   * at or under `max` utilisation (default 1 = full).
   */
  | { survives: string; kinds?: NodeKind[]; max?: number };

/** An optional question inside a step: a choice, or a number worked out on the calculator. */
export type StepAsk =
  | { q: string; options: string[]; answer: number; why: string }
  | { q: string; number: number; unit?: string; why: string };

export interface DesignStep {
  id: string;
  title: string;
  /** One plain sentence: what to do. */
  goal: string;
  /** A short lesson (markdown) - what the player needs to know to do it. */
  teach: string;
  done: StepCheck[];
  ask?: StepAsk;
  /** A nudge for when the player is stuck. Never the answer. */
  hint: string;
}

export interface StepContext {
  scenarios: Scenario[];
  ran: boolean;
}

/** Is a numeric answer close enough? Within 25% either way, like a rounded estimate. */
export function numberClose(given: number, answer: number): boolean {
  if (!Number.isFinite(given) || given <= 0) return false;
  const ratio = given / answer;
  return ratio >= 0.8 && ratio <= 1.25;
}

export function askCorrect(ask: StepAsk, given: string | number | undefined): boolean {
  if (given === undefined || given === "") return false;
  if ("options" in ask) return Number(given) === ask.answer;
  return numberClose(Number(given), ask.number);
}

/** Which checks of a step pass on this design. Simulations run only when a check needs one. */
export function checkStep(step: DesignStep, design: Design, ctx: StepContext): boolean[] {
  const dctx: DesignContext = { classes: ctx.scenarios.flatMap((s) => s.classes) };
  const kindOf = new Map(design.nodes.map((n) => [n.id, n.kind]));
  return step.done.map((check) => {
    if ("ran" in check) return ctx.ran;
    if ("has" in check) {
      const nodes = design.nodes.filter((n) => n.kind === check.has);
      if (!check.from) return nodes.length > 0;
      return design.edges.some((e) => kindOf.get(e.from) === check.from && kindOf.get(e.to) === check.has);
    }
    if ("clear" in check) return runRules(design, dctx, [check.clear]).length === 0;
    if ("rubric" in check) return runRubric(design, [check.rubric])[0]?.status === "covered";
    const scenario = ctx.scenarios.find((s) => s.id === check.survives);
    if (!scenario) return false;
    const result = simulate(design, scenario);
    const max = check.max ?? 1;
    return design.nodes
      .filter((n) => n.kind !== "client" && (!check.kinds || check.kinds.includes(n.kind)))
      .every((n) => (result.peakUtil[n.id] ?? 0) <= max);
  });
}

/**
 * Index of the first step not yet done (steps.length when all are). Steps already
 * finished stay finished. Questions count only when `withAsks` (Mark I).
 */
export function currentStep(steps: DesignStep[], design: Design, ctx: StepContext, answers: Record<string, string>, doneBefore: string[], withAsks = true): number {
  for (const [i, step] of steps.entries()) {
    if (doneBefore.includes(step.id)) continue;
    const checksPass = checkStep(step, design, ctx).every(Boolean);
    const askPass = !withAsks || !step.ask || askCorrect(step.ask, answers[step.id]);
    if (!checksPass || !askPass) return i;
  }
  return steps.length;
}
