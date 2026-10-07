// Content model: phases, lessons, exercises and cases, as loaded from content/.
import type { MockRoute } from "../runtime/harness";
import type { SettingSpec } from "../sim/components";
import type { Design, NodeKind, Scenario, Targets } from "../sim/types";
import type { Ask, Chip, DeskCheck, Endpoint, Question, Requirement } from "./stations";
import type { DesignStep } from "./steps";

export interface Hints {
  nudge: string;
  question: string;
  pseudocode: string;
  flaw: string;
  analogous: string;
}

export interface SceneLine {
  who: string;
  line: string;
}

/** A Field Manual page for one design-table component. */
export interface ManualEntry {
  what: string;
  analogy: string;
  when: string;
  capacity: string;
  cost?: string;
  fails: string;
  /** Setting key → what it does. */
  settings: Record<string, string>;
}

export interface CastMember {
  name: string;
  portrait: string;
}

export type Tier = "warmup" | "core" | "outstanding" | "review" | "stage";

interface ExerciseBase {
  /** `${lessonId}.${slot}` */
  id: string;
  lessonId: string;
  slot: string;
  tier: Tier;
  title: string;
  twist?: string;
  task: string;
  hints: Hints;
  /** Which of the lesson's concepts this exercise practises (the validator checks every concept is covered). */
  covers?: string[];
}

export interface CodeExercise extends ExerciseBase {
  type: "code";
  files: Record<string, string>;
  entry?: string;
  tests: string;
  mocks?: MockRoute[];
  /** The starter file a `<slot>.solution.*` file replaces (validator only). */
  solves?: string;
}

export interface SequenceExercise extends ExerciseBase {
  type: "sequence";
  /** In the correct order; the UI shuffles them deterministically. */
  items: string[];
}

export interface PredictExercise extends ExerciseBase {
  type: "predict";
  options: string[];
  answer: number;
  why: string;
}

export interface EstimateExercise extends ExerciseBase {
  type: "estimate";
  given: string[];
  ask: Ask[];
}

/** Several quick scenario questions, e.g. "which machine does the work?" five times. */
export interface QuizExercise extends ExerciseBase {
  type: "quiz";
  questions: { q: string; options: string[]; answer: number; why: string }[];
}

/** Pick an option AND the reasons that justify it. A right pick for wrong reasons isn't optimal. */
export interface TradeoffExercise extends ExerciseBase {
  type: "tradeoff";
  options: string[];
  answer: number;
  reasons: { text: string; right: boolean }[];
  why: string;
}

/** A small design-table simulation inside a lesson, usually with a guided build. */
export interface DesignExercise extends ExerciseBase {
  type: "design";
  palette: NodeKind[];
  prebuilt: Design;
  scenarios: Scenario[];
  targets: Targets;
  rubric: { must: string[]; should: string[] };
  rules: string[];
  steps?: DesignStep[];
  /** Shown after a pass, as one of many designs that pass. */
  reference: Design;
  /** A design that must fail (the validator checks). Defaults to the prebuilt one. */
  naive?: Design;
  settings?: Partial<Record<NodeKind, SettingSpec[]>>;
}

export type Exercise = CodeExercise | SequenceExercise | PredictExercise | EstimateExercise | QuizExercise | TradeoffExercise | DesignExercise;

export type ReviewCard =
  | { id: string; type: "choice"; q: string; options: string[]; answer: number; why: string; covers?: string[] }
  | { id: string; type: "order"; items: string[]; why: string; covers?: string[] };

export interface Lesson {
  id: string;
  phase: number;
  order: number;
  number: string;
  part?: { n: number; of: number };
  kind: "lesson" | "revision" | "trial";
  title: string;
  location: string;
  concepts: string[];
  scene: SceneLine[];
  outro: SceneLine[];
  clue?: string;
  lecture: string;
  notes: string;
  exercises: Exercise[];
  review: ReviewCard[];
}

export interface Phase {
  phase: number;
  title: string;
  arc: string;
  summary: string;
  theme: { accent: string; accent2: string; glow: string };
  intro: SceneLine[];
  lessons: Lesson[];
  cases: Case[];
}

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

interface StationBase {
  id: string;
  title: string;
  timebox?: number;
  /** JARVIS's walkthrough, shown at Mark I only. */
  guide: string;
  hints: Hints;
}

/** A pre-case tour of the parts the case uses (Mark I only): one Field Manual card and one question each. */
export interface BriefingCard {
  kind: NodeKind;
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface BriefingStation extends StationBase {
  kind: "briefing";
  cards: BriefingCard[];
}

export interface InterrogateStation extends StationBase {
  kind: "interrogate";
  budget: number;
  requirements: Requirement[];
  pool: Question[];
}

export interface EstimateStation extends StationBase {
  kind: "estimate";
  given: string[];
  ask: Ask[];
}

export interface DesignStation extends StationBase {
  kind: "design";
  palette: NodeKind[];
  prebuilt: Design;
  /** Ids of the case's scenarios this station runs. */
  scenarios: string[];
  targets: Targets;
  rubric: { must: string[]; should: string[] };
  rules: string[];
  /** The guided build: shown in full at Mark I, as a checklist at Mark III, hidden at Mark VII. */
  steps?: DesignStep[];
}

export interface DeskStation extends StationBase {
  kind: "desk";
  answer: Endpoint[];
  purposes: { value: string; label: string }[];
  checks: DeskCheck[];
}

export interface CodeStation extends StationBase {
  kind: "code";
  files: Record<string, string>;
  entry?: string;
  tests: string;
  mocks?: MockRoute[];
  solves?: string;
}

export interface CurveballStation extends StationBase {
  kind: "curveballs";
  scenarios: Scenario[];
  targets: Targets;
}

export interface AssembleStation extends StationBase {
  kind: "assemble";
  sections: { id: string; label: string }[];
  chips: Chip[];
}

export type Station = BriefingStation | InterrogateStation | EstimateStation | DesignStation | DeskStation | CodeStation | CurveballStation | AssembleStation;

export interface Case {
  id: string;
  phase: number;
  order: number;
  title: string;
  tagline: string;
  brief: string;
  scene: SceneLine[];
  outro: SceneLine[];
  settings: Partial<Record<NodeKind, SettingSpec[]>>;
  scenarios: Scenario[];
  stations: Station[];
  reference: Design;
  naive: Design;
  /** Lessons that teach this case's parts. Once all are passed, the briefing becomes a skippable recap. */
  requires?: string[];
}

export const TIER_LABEL: Record<Tier, { label: string; icon: string }> = {
  warmup: { label: "Warm-up", icon: "🌱" },
  core: { label: "Core", icon: "🔥" },
  outstanding: { label: "Outstanding", icon: "⭐" },
  review: { label: "Briefing", icon: "📋" },
  stage: { label: "Trial stage", icon: "🏁" },
};

export const STATION_ICON: Record<Station["kind"], string> = {
  briefing: "📘",
  interrogate: "❓",
  estimate: "🧮",
  design: "🗺",
  desk: "📐",
  code: "💻",
  curveballs: "🚨",
  assemble: "🧷",
};
