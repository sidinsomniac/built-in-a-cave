// Loads content/** at build time. Solutions (`*.solution.*`) are never bundled.
import { load as loadYaml } from "js-yaml";
import castRaw from "/content/cast.yaml?raw";
import type { Case, CastMember, Exercise, Lesson, Phase, ReviewCard, SceneLine } from "./types";

const phaseFiles = import.meta.glob("/content/phase-*/phase.yaml", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const lessonFiles = import.meta.glob("/content/phase-*/*/lesson.yaml", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const exerciseFiles = import.meta.glob(["/content/phase-*/*/*.yaml", "!**/lesson.yaml", "!**/review.yaml"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const lectures = import.meta.glob("/content/phase-*/*/lecture.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const notesFiles = import.meta.glob("/content/phase-*/*/notes.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const reviewFiles = import.meta.glob("/content/phase-*/*/review.yaml", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const caseFiles = import.meta.glob("/content/cases/*/case.yaml", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export const CAST = loadYaml(castRaw) as Record<string, CastMember>;

const dirOf = (path: string) => path.slice(0, path.lastIndexOf("/") + 1);

interface LessonMeta {
  id: string;
  phase: number;
  order: number;
  number: string | number;
  part?: { n: number; of: number };
  kind?: Lesson["kind"];
  title: string;
  location: string;
  concepts: string[];
  scene?: SceneLine[];
  outro?: SceneLine[];
  clue?: string;
  exercises: string[];
}

function buildExercise(lessonId: string, dir: string, slot: string): Exercise {
  const raw = exerciseFiles[`${dir}${slot}.yaml`];
  if (!raw) throw new Error(`Missing exercise ${dir}${slot}.yaml`);
  const meta = loadYaml(raw) as Omit<Exercise, "id" | "lessonId" | "slot">;
  return { ...meta, id: `${lessonId}.${slot}`, lessonId, slot } as Exercise;
}

export function buildLessons(): Lesson[] {
  return Object.entries(lessonFiles).map(([path, raw]) => {
    const dir = dirOf(path);
    const meta = loadYaml(raw) as LessonMeta;
    return {
      id: meta.id,
      phase: meta.phase,
      order: meta.order,
      number: String(meta.number),
      part: meta.part,
      kind: meta.kind ?? "lesson",
      title: meta.title,
      location: meta.location,
      concepts: meta.concepts,
      scene: meta.scene ?? [],
      outro: meta.outro ?? [],
      clue: meta.clue,
      lecture: lectures[`${dir}lecture.md`] ?? "",
      notes: notesFiles[`${dir}notes.md`] ?? "",
      exercises: meta.exercises.map((slot) => buildExercise(meta.id, dir, slot)),
      review: (loadYaml(reviewFiles[`${dir}review.yaml`] ?? "[]") ?? []) as ReviewCard[],
    };
  });
}

export function buildCases(): Case[] {
  return Object.values(caseFiles).map((raw) => {
    const c = loadYaml(raw) as Case;
    return { ...c, scene: c.scene ?? [], outro: c.outro ?? [], settings: c.settings ?? {} };
  });
}

function buildPhases(): Phase[] {
  const lessons = buildLessons();
  const cases = buildCases();
  return Object.values(phaseFiles)
    .map((raw) => {
      const meta = loadYaml(raw) as Omit<Phase, "lessons" | "cases">;
      return {
        ...meta,
        intro: meta.intro ?? [],
        lessons: lessons.filter((l) => l.phase === meta.phase).sort((a, b) => a.order - b.order),
        cases: cases.filter((c) => c.phase === meta.phase).sort((a, b) => a.order - b.order),
      };
    })
    .sort((a, b) => a.phase - b.phase);
}

export const PHASES: Phase[] = buildPhases();
export const LESSONS: Lesson[] = PHASES.flatMap((p) => p.lessons);
export const CASES: Case[] = PHASES.flatMap((p) => p.cases);
export const EXERCISES: Exercise[] = LESSONS.flatMap((l) => l.exercises);

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const caseById = (id: string) => CASES.find((c) => c.id === id);
