// `npm run validate-content`: proves every lesson, exercise and case in content/.
//
// - Code: reference solutions pass every test; starters fail; no lecture code block
//   solves a core or outstanding mission; hints never contain a solution line.
// - Designs: the reference design lands optimal on every scenario and curveball,
//   and the naive design lands failing.
// - Every other station is solvable to optimal with its own reference answer.
// - Scenes, cards and ids are well formed.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load as loadYaml } from "js-yaml";
import { describe, expect, it } from "vitest";
import { auditDesign } from "../src/engine/audit";
import { CASES, CAST, LESSONS } from "../src/engine/content";
import { gradeAssembly, gradeDesk, gradeEstimates, gradeInterrogation } from "../src/engine/stations";
import type { CodeExercise, CodeStation, Lesson, SceneLine } from "../src/engine/types";
import { runMission } from "../src/runtime/harness";
import { CHECKERS, RULES } from "../src/sim/rules";
import type { Scenario } from "../src/sim/types";

const ROOT = join(import.meta.dirname, "..", "content");

function lessonDir(id: string): string {
  for (const phase of readdirSync(ROOT).filter((d) => d.startsWith("phase-"))) {
    for (const dir of readdirSync(join(ROOT, phase))) {
      const meta = join(ROOT, phase, dir, "lesson.yaml");
      if (existsSync(meta) && new RegExp(`^id:\\s*${id}\\s*$`, "m").test(readFileSync(meta, "utf8"))) return join(ROOT, phase, dir);
    }
  }
  throw new Error(`No folder for lesson ${id}`);
}

function caseDir(id: string): string {
  for (const dir of readdirSync(join(ROOT, "cases"))) {
    const file = join(ROOT, "cases", dir, "case.yaml");
    if (new RegExp(`^id:\\s*${id}\\s*$`, "m").test(readFileSync(file, "utf8"))) return join(ROOT, "cases", dir);
  }
  throw new Error(`No folder for case ${id}`);
}

function solutionFor(dir: string, slot: string): string {
  const file = readdirSync(dir).find((f) => f.startsWith(`${slot}.solution.`));
  if (!file) throw new Error(`Missing ${slot}.solution.* in ${dir}`);
  return readFileSync(join(dir, file), "utf8");
}

const checkScene = (lines: SceneLine[]) => {
  for (const l of lines) {
    expect(l.who && l.line, "every scene line needs who and line").toBeTruthy();
    expect(CAST[l.who], `unknown speaker "${l.who}" (add them to content/cast.yaml)`).toBeTruthy();
  }
};

const norm = (line: string) => line.trim().replace(/\s+/g, " ");

/** Hints must never contain a solution line (12+ characters) the learner can't already see. */
function expectNoLeaks(hints: object, solution: string, visible: string) {
  const seen = new Set(visible.split("\n").map(norm));
  const hintText = Object.values(hints).join("\n").replace(/\s+/g, " ");
  for (const line of solution.split("\n")) {
    const t = norm(line);
    if (t.length >= 12 && !seen.has(t)) expect(hintText.includes(t), `a hint contains the solution line: ${t}`).toBe(false);
  }
}

async function proveCode(ex: Pick<CodeExercise, "files" | "entry" | "tests" | "mocks" | "solves" | "hints">, solution: string, lectureBlocks: string[]) {
  const target = ex.solves ?? Object.keys(ex.files)[0];
  const solved = await runMission({ ...ex, files: { ...ex.files, [target]: solution } });
  const failed = solved.tests.find((t) => !t.passed);
  expect(solved.compileError, "the tests don't compile").toBeUndefined();
  expect(failed ? `${failed.name}: ${failed.message}` : "ok", "the reference solution must pass every test").toBe("ok");
  expect(solved.total, "a code mission needs at least one test").toBeGreaterThan(0);

  const starter = await runMission(ex);
  expect(starter.passed < starter.total || !!starter.compileError, "the starter code must not already pass").toBe(true);

  for (const [i, block] of lectureBlocks.entries()) {
    const r = await runMission({ ...ex, files: { ...ex.files, [target]: block } });
    expect(r.passed < r.total || !!r.compileError, `lecture code block ${i + 1} must not solve this mission`).toBe(true);
  }
  expectNoLeaks(ex.hints, solution, Object.values(ex.files).join("\n"));
}

const lectureCode = (lesson: Lesson) => [...lesson.lecture.matchAll(/^```(?:ts|tsx|js|jsx)\n([\s\S]*?)^```\s*$/gm)].map((m) => m[1]);

describe("lessons", () => {
  it("has content to check", () => expect(LESSONS.length).toBeGreaterThan(0));

  for (const lesson of LESSONS) {
    describe(lesson.id, () => {
      it("is well formed", () => {
        expect(lesson.lecture.trim(), "missing lecture.md").not.toBe("");
        if (lesson.kind === "lesson") expect(lesson.notes.trim(), "missing notes.md").not.toBe("");
        checkScene(lesson.scene);
        checkScene(lesson.outro);
        if (lesson.kind === "lesson") {
          expect(lesson.review.length, "2-4 review cards").toBeGreaterThanOrEqual(2);
          expect(lesson.review.length).toBeLessThanOrEqual(4);
          expect(lesson.review.some((c) => c.type === "choice"), "at least one choice card").toBe(true);
        }
        for (const card of lesson.review) {
          if (card.type === "choice") expect(card.answer >= 0 && card.answer < card.options.length, `card ${card.id}: answer out of range`).toBe(true);
        }
        for (const block of lesson.lecture.matchAll(/^```(checkpoint|diagram)\n([\s\S]*?)^```\s*$/gm)) {
          let spec: Record<string, unknown> = {};
          expect(() => (spec = loadYaml(block[2]) as Record<string, unknown>), `a ${block[1]} block isn't valid YAML`).not.toThrow();
          if (block[1] === "checkpoint") {
            expect(Array.isArray(spec.options) && Number.isInteger(spec.answer) && (spec.answer as number) < (spec.options as unknown[]).length, "a checkpoint needs options and an answer index in range").toBe(true);
            expect(spec.q && spec.why, "a checkpoint needs q and why").toBeTruthy();
          } else {
            expect(Array.isArray(spec.steps) && (spec.steps as unknown[]).every((x) => typeof x === "string"), "a diagram needs a list of text steps").toBe(true);
          }
        }
      });

      for (const ex of lesson.exercises) {
        it(`${ex.slot} (${ex.type}) is solvable and honest`, async () => {
          for (const rung of ["nudge", "question", "pseudocode", "flaw", "analogous"]) expect(ex.hints?.[rung as keyof typeof ex.hints], `hint rung ${rung}`).toBeTruthy();
          if (ex.tier === "core") expect(ex.twist, "a core challenge needs a twist").toBeTruthy();
          if (ex.type === "code") {
            const blocks = ex.tier === "warmup" ? [] : lectureCode(lesson);
            await proveCode(ex, solutionFor(lessonDir(lesson.id), ex.slot), blocks);
          } else if (ex.type === "sequence") {
            expect(new Set(ex.items).size, "sequence items must be unique").toBe(ex.items.length);
            expect(ex.items.length).toBeGreaterThanOrEqual(3);
          } else if (ex.type === "predict") {
            expect(ex.answer >= 0 && ex.answer < ex.options.length, "answer index out of range").toBe(true);
          } else if (ex.type === "estimate") {
            expect(ex.ask.every((a) => a.answer > 0)).toBe(true);
            expect(gradeEstimates(Object.fromEntries(ex.ask.map((a) => [a.id, a.answer])), ex.ask).zone).toBe("optimal");
          }
        });
      }
    });
  }
});

describe("cases", () => {
  for (const c of CASES) {
    describe(c.id, () => {
      const dir = caseDir(c.id);
      const scenarioById = (id: string) => {
        const s = c.scenarios.find((x) => x.id === id);
        expect(s, `unknown scenario ${id}`).toBeTruthy();
        return s as Scenario;
      };

      it("is well formed", () => {
        checkScene(c.scene);
        checkScene(c.outro);
        for (const st of c.stations) for (const rung of ["nudge", "question", "pseudocode", "flaw", "analogous"]) expect(st.hints?.[rung as keyof typeof st.hints], `${st.id}: hint rung ${rung}`).toBeTruthy();
      });

      for (const st of c.stations) {
        it(`${st.id} (${st.kind}) has a reference answer that lands optimal`, async () => {
          switch (st.kind) {
            case "interrogate": {
              const all = st.pool.map((q) => q.id);
              const useful = st.pool.filter((q) => q.reveals.some((r) => st.requirements.find((x) => x.id === r)?.must)).map((q) => q.id);
              expect(useful.length, "the must-have requirements must be revealable within the budget").toBeLessThanOrEqual(st.budget);
              expect(gradeInterrogation(useful, st.pool, st.requirements).zone).toBe("optimal");
              expect(gradeInterrogation(all.slice(-3), st.pool, st.requirements).zone, "three junk questions must not pass").toBe("failing");
              break;
            }
            case "estimate":
              expect(gradeEstimates(Object.fromEntries(st.ask.map((a) => [a.id, a.answer])), st.ask).zone).toBe("optimal");
              break;
            case "design": {
              for (const id of [...st.rubric.must, ...st.rubric.should]) expect(CHECKERS[id], `unknown rubric checker ${id}`).toBeTruthy();
              for (const id of st.rules) expect(RULES[id], `unknown rule ${id}`).toBeTruthy();
              const spec = { scenarios: st.scenarios.map(scenarioById), targets: st.targets, rubric: st.rubric, rules: st.rules };
              const ref = auditDesign(c.reference, spec);
              expect(ref.zone, `the reference design must be optimal: ${ref.items.filter((i) => i.status !== "covered").map((i) => i.title).join("; ")}`).toBe("optimal");
              expect(auditDesign(c.naive, spec).zone, "the naive design must fail").toBe("failing");
              break;
            }
            case "curveballs": {
              const spec = { scenarios: st.scenarios, targets: st.targets, rubric: { must: [], should: [] }, rules: [] };
              expect(auditDesign(c.reference, spec).zone, "the reference design must survive every curveball").toBe("optimal");
              expect(auditDesign(c.naive, spec).zone, "the naive design must not survive the curveballs").toBe("failing");
              break;
            }
            case "desk":
              expect(gradeDesk(st.answer, st.checks).zone).toBe("optimal");
              break;
            case "assemble": {
              const labels = Object.fromEntries(st.sections.map((s) => [s.id, s.label]));
              for (const chip of st.chips.filter((x) => !x.decoy)) expect(labels[chip.section!], `chip ${chip.id}: unknown section`).toBeTruthy();
              const perfect = Object.fromEntries(st.chips.filter((x) => !x.decoy).map((x) => [x.id, x.section!]));
              expect(gradeAssembly(perfect, st.chips, labels).zone).toBe("optimal");
              break;
            }
            case "code":
              await proveCode(st as CodeStation, solutionFor(dir, st.id), []);
              break;
          }
        });
      }
    });
  }
});
