// JARVIS's guided build: one objective at a time on the design table.
// Mark I shows the lesson, a question and a hint for the current step; Mark III shows
// only the checklist; Mark VII hides it. Steps tick from checks on the player's own design.
import { useState } from "react";
import { calculate } from "../engine/stations";
import { askCorrect, type DesignStep, type StepAsk } from "../engine/steps";
import type { Mark } from "../engine/store";
import { MENTOR } from "../lore/lore";
import { Markdown } from "./common";

interface Props {
  steps: DesignStep[];
  /** Index of the current step (steps.length when every step is done). */
  current: number;
  /** For the current step: which of its checks pass right now. */
  checks: boolean[];
  answers: Record<string, string>;
  onAnswer: (stepId: string, value: string) => void;
  mark: Mark;
}

function Ask({ ask, value, onAnswer }: { ask: StepAsk; value: string | undefined; onAnswer: (v: string) => void }) {
  const [draft, setDraft] = useState(value ?? "");
  const right = askCorrect(ask, value);
  const tried = value !== undefined && value !== "";
  if ("options" in ask) {
    return (
      <div className="step-ask" data-testid="step-ask">
        <div>
          <b>❓</b> {ask.q}
        </div>
        <div className="options" style={{ marginTop: 6 }}>
          {ask.options.map((o, i) => (
            <button key={i} className={`btn small option ${value === String(i) ? "selected" : ""}`} onClick={() => onAnswer(String(i))} disabled={right} data-testid={`step-option-${i}`}>
              {o}
            </button>
          ))}
        </div>
        {tried && <p className={`small ${right ? "pass" : "fail"}`}>{right ? `✔ ${ask.why}` : "✘ Not quite. Re-read the lesson above and try again."}</p>}
      </div>
    );
  }
  let parsed: number | null = null;
  try {
    parsed = draft.trim() ? calculate(draft) : null;
  } catch {
    parsed = null;
  }
  return (
    <div className="step-ask" data-testid="step-ask">
      <div>
        <b>🧮</b> {ask.q}
      </div>
      <form
        className="row"
        style={{ marginTop: 6 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (parsed !== null) onAnswer(String(parsed));
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="a number, or a sum like 12000 / 800" aria-label="Your answer" disabled={right} data-testid="step-number" />
        {ask.unit && <span className="muted small">{ask.unit}</span>}
        {parsed !== null && draft.trim() !== String(parsed) && <span className="muted small">= {parsed.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>}
        <button className="btn small" disabled={parsed === null || right} data-testid="step-check">
          Check
        </button>
      </form>
      {tried && <p className={`small ${right ? "pass" : "fail"}`}>{right ? `✔ ${ask.why}` : "✘ Not quite - check the numbers in the lesson above. Round freely; close is fine."}</p>}
    </div>
  );
}

function StepStatus({ checks, hint }: { checks: boolean[]; hint: string }) {
  const [showHint, setShowHint] = useState(false);
  return (
    <div className="row small muted" data-testid="step-status">
      <span>
        {checks.filter(Boolean).length} of {checks.length} {checks.length === 1 ? "check" : "checks"} passing on your design.
      </span>
      {showHint ? <span className="soft">💡 {hint}</span> : <button className="linklike" onClick={() => setShowHint(true)} data-testid="step-hint">💡 Stuck? Show a hint</button>}
    </div>
  );
}

export function GuidedSteps({ steps, current, checks, answers, onAnswer, mark }: Props) {
  if (mark === 7 || !steps.length) return null;
  const step = steps[current];
  const askDone = !step?.ask || askCorrect(step.ask, answers[step.id]);
  return (
    <div className="guided hud-panel" data-testid="guided-steps">
      <div className="row between">
        <b>🔷 {MENTOR}'s build plan</b>
        <span className="badge" data-testid="steps-progress">
          {Math.min(current, steps.length)} / {steps.length} steps
        </span>
      </div>
      <ol className="steplist">
        {steps.map((s, i) => (
          <li key={s.id} className={i < current ? "done" : i === current ? "now" : "later"} data-testid={`step-${s.id}`} data-state={i < current ? "done" : i === current ? "now" : "later"}>
            <span className="tick" aria-hidden="true">
              {i < current ? "✓" : i === current ? "▸" : "○"}
            </span>
            {s.title}
          </li>
        ))}
      </ol>
      {step && mark === 1 && (
        <div className="step-body" data-testid="step-body">
          <h3>
            Step {current + 1}: {step.title}
          </h3>
          <p className="goal">🎯 {step.goal}</p>
          <Markdown text={step.teach} />
          {step.ask && <Ask key={step.id} ask={step.ask} value={answers[step.id]} onAnswer={(v) => onAnswer(step.id, v)} />}
          {askDone && step.done.length > 0 && <StepStatus key={`${step.id}:status`} checks={checks} hint={step.hint} />}
        </div>
      )}
      {step && mark === 3 && <p className="small muted">🎯 {step.goal}</p>}
      {!step && (
        <p className="small" data-testid="steps-complete">
          ✓ Every step done. Run the full simulation - Rhodey grades speed, errors, cost and the design itself. Aim for 🟢; his audit tells you what's left.
        </p>
      )}
    </div>
  );
}
