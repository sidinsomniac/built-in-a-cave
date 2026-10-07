// A lesson: story, interactive lecture, then the 🌱 / 🔥 / ⭐ exercises.
import { useState } from "react";
import { lessonById } from "../engine/content";
import { useGame } from "../engine/store";
import { TIER_LABEL, type Exercise } from "../engine/types";
import { passes, ZONES } from "../engine/zones";
import { CodeBoard, EstimateBoard, OutcomePanel, PredictBoard, SequenceBoard, type Outcome } from "./boards";
import { Cutscene, HintLadder, Lecture, Markdown, SceneBeat } from "./common";

function ExerciseView({ ex }: { ex: Exercise }) {
  const record = useGame((s) => s.exercises[ex.id]);
  const recordExercise = useGame((s) => s.recordExercise);
  const draft = useGame((s) => s.drafts[ex.id]);
  const saveDraft = useGame((s) => s.saveDraft);
  const [hints, setHints] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [estimates, setEstimates] = useState<Record<string, string>>({});
  const report = (zone: Outcome["zone"], items: Outcome["items"]) => setOutcome({ zone, items, xp: recordExercise(ex.id, zone, hints) });

  return (
    <div className="stack">
      <div className="card">
        <div className="row between">
          <h2 style={{ margin: 0 }}>
            {TIER_LABEL[ex.tier].icon} {ex.title}
          </h2>
          {record && <span className="badge">best: {ZONES[record.best].icon} {ZONES[record.best].label}</span>}
        </div>
        {ex.twist && <p className="muted small">Twist: {ex.twist}</p>}
        <Markdown text={ex.task} />
      </div>
      {ex.type === "code" && (
        <CodeBoard
          mission={{ files: ex.files, entry: ex.entry, tests: ex.tests, mocks: ex.mocks }}
          files={draft ?? ex.files}
          onFiles={(f) => saveDraft(ex.id, f)}
          onResult={(zone, r) =>
            report(
              zone,
              r.tests.map((t) => ({ status: t.passed ? "covered" : "missing", stone: "reality", title: t.name, question: t.message ?? "", why: "" })),
            )
          }
        />
      )}
      {ex.type === "sequence" && <SequenceBoard id={ex.id} items={ex.items} onResult={report} />}
      {ex.type === "predict" && <PredictBoard options={ex.options} answer={ex.answer} why={ex.why} onResult={report} />}
      {ex.type === "estimate" && <EstimateBoard given={ex.given} ask={ex.ask} values={estimates} onValues={setEstimates} onResult={report} />}
      <OutcomePanel outcome={outcome} />
      <HintLadder hints={ex.hints} used={hints} onReveal={() => setHints(hints + 1)} cost="−3 XP" />
    </div>
  );
}

export function LessonView({ id }: { id: string }) {
  const lesson = lessonById(id);
  const records = useGame((s) => s.exercises);
  const [tab, setTab] = useState<string>("lesson");
  if (!lesson) return <p>Unknown lesson.</p>;
  const ex = lesson.exercises.find((e) => e.slot === tab);
  const required = lesson.exercises.filter((e) => e.tier !== "outstanding");
  const done = required.length > 0 && required.every((e) => passes(records[e.id]?.best ?? "failing"));
  return (
    <div className="stack">
      <div className="row between">
        <div>
          <a href="#/">← Stark Industries</a>
          <h1 style={{ marginTop: 8 }}>
            {lesson.number}
            {lesson.part ? ` (part ${lesson.part.n})` : ""}. {lesson.title}
          </h1>
          <p className="muted small" style={{ margin: 0 }}>📍 {lesson.location}</p>
        </div>
        <Cutscene id={lesson.id} lines={lesson.scene} title={lesson.title} />
      </div>
      <div className="tabs" role="tablist">
        <button className="tab" role="tab" aria-selected={tab === "lesson"} onClick={() => setTab("lesson")}>
          📖 Lesson
        </button>
        {lesson.exercises.map((e) => {
          const best = records[e.id]?.best;
          return (
            <button key={e.slot} className="tab" role="tab" aria-selected={tab === e.slot} onClick={() => setTab(e.slot)} data-testid={`tab-${e.slot}`}>
              {TIER_LABEL[e.tier].icon} {TIER_LABEL[e.tier].label} {best ? ZONES[best].icon : ""}
            </button>
          );
        })}
        <button className="tab" role="tab" aria-selected={tab === "notes"} onClick={() => setTab("notes")}>
          🗒 Notes
        </button>
      </div>
      {tab === "lesson" && (
        <div className="card">
          <Lecture markdown={lesson.lecture} />
          <button className="btn primary" onClick={() => setTab(lesson.exercises[0].slot)}>
            To the exercises →
          </button>
        </div>
      )}
      {tab === "notes" && (
        <div className="card">
          <Markdown text={lesson.notes} />
        </div>
      )}
      {ex && <ExerciseView key={ex.id} ex={ex} />}
      {done && lesson.clue && (
        <div className="card" data-testid="clue">
          🔍 <b>Clue discovered:</b> <Markdown text={lesson.clue} />
          {lesson.outro.length > 0 && <SceneBeat lines={lesson.outro} />}
        </div>
      )}
    </div>
  );
}
