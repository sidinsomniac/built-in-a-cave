// Exercise boards, shared by lessons and case stations.
import { javascript } from "@codemirror/lang-javascript";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo, useState } from "react";
import type { AuditItem } from "../engine/audit";
import { calculate, gradeEstimates, type Ask } from "../engine/stations";
import { sequenceZone, type Zone } from "../engine/zones";
import type { Mission, RunResult } from "../runtime/harness";
import { runInSandbox } from "../runtime/sandboxClient";
import { AuditList, Gauge } from "./common";

const extensions = [javascript({ typescript: true, jsx: true })];

export interface Outcome {
  zone: Zone;
  items: AuditItem[];
  xp?: number;
}

export function OutcomePanel({ outcome, children }: { outcome: Outcome | null; children?: React.ReactNode }) {
  if (!outcome) return null;
  const passed = outcome.zone !== "failing";
  return (
    <div className="card" data-testid="outcome">
      <div className="row between">
        <Gauge zone={outcome.zone} caption={passed ? (outcome.xp ? `+${outcome.xp} XP` : "Passed") : "Not yet - read the audit, then try again."} />
      </div>
      <AuditList items={outcome.items} passed={passed} />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code missions
// ---------------------------------------------------------------------------

export function CodeBoard({ mission, files, onFiles, onResult }: { mission: Mission; files: Record<string, string>; onFiles: (f: Record<string, string>) => void; onResult: (zone: Zone, result: RunResult) => void }) {
  const names = Object.keys(mission.files);
  const [active, setActive] = useState(names[0]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await runInSandbox({ ...mission, files });
      setResult(r);
      const zone: Zone = !r.compileError && r.total > 0 && r.passed === r.total ? "optimal" : "failing";
      onResult(zone, r);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="row between">
        <div className="tabs" role="tablist">
          {names.map((n) => (
            <button key={n} className="tab" role="tab" aria-selected={n === active} onClick={() => setActive(n)}>
              {n}
            </button>
          ))}
        </div>
        <button
          className="btn ghost small"
          onClick={() => {
            if (confirm("Reset this file to the starting code?")) onFiles({ ...files, [active]: mission.files[active] });
          }}
        >
          Reset file
        </button>
      </div>
      <div className="editor" data-testid="editor">
        <CodeMirror value={files[active] ?? ""} theme="dark" extensions={extensions} minHeight="260px" onChange={(v) => onFiles({ ...files, [active]: v })} aria-label="Code editor" />
      </div>
      <div className="row">
        <button className="btn primary" onClick={run} disabled={busy} data-testid="run-tests">
          {busy ? "Running in the sandbox..." : "▶ Run the hidden tests"}
        </button>
      </div>
      {error && <p className="fail small">The sandbox couldn't start: {error}</p>}
      {result && (
        <div className="card results" data-testid="test-results">
          {result.compileError ? (
            <p className="fail">Your code doesn't compile: {result.compileError}</p>
          ) : (
            <>
              <b>
                {result.passed} of {result.total} tests passed
              </b>
              <ul>
                {result.tests.map((t) => (
                  <li key={t.name} className={t.passed ? "pass" : "fail"}>
                    {t.passed ? "✔" : "✘"} {t.name}
                    {!t.passed && t.message && <div className="soft small">🔷 {t.message}</div>}
                  </li>
                ))}
              </ul>
              {result.tests.length < result.total && <p className="muted small">The remaining tests run once this one passes - one idea at a time.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sequencer
// ---------------------------------------------------------------------------

/** A deterministic shuffle (seeded by the exercise id), never the right order. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  if (out.every((x, i) => x === items[i]) && out.length > 1) [out[0], out[1]] = [out[1], out[0]];
  return out;
}

export function SequenceBoard({ id, items, onResult }: { id: string; items: string[]; onResult: (zone: Zone, items: AuditItem[]) => void }) {
  const [order, setOrder] = useState(() => seededShuffle(items, id));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };
  const check = () => {
    const zone = sequenceZone(order, items);
    const wrong = order.map((x, i) => (x === items[i] ? null : i)).filter((x) => x !== null).length;
    onResult(zone, [
      {
        status: zone === "optimal" ? "covered" : zone === "risky" ? "partial" : "missing",
        stone: "mind",
        title: zone === "optimal" ? "Every step in the right order" : `${wrong} step${wrong === 1 ? "" : "s"} out of place`,
        question: "For each step, ask: what must already have happened for this one to be possible?",
        why: "",
      },
    ]);
  };
  return (
    <div className="stack">
      <ol className="seq" data-testid="sequence">
        {order.map((item, i) => (
          <li key={item}>
            <b className="muted">{i + 1}</b>
            <span>{item}</span>
            <button className="btn small" aria-label={`Move "${item}" up`} onClick={() => move(i, -1)} disabled={i === 0}>
              ▲
            </button>
            <button className="btn small" aria-label={`Move "${item}" down`} onClick={() => move(i, 1)} disabled={i === order.length - 1}>
              ▼
            </button>
          </li>
        ))}
      </ol>
      <button className="btn primary" onClick={check} data-testid="check">
        Check the order
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Predict
// ---------------------------------------------------------------------------

export function PredictBoard({ options, answer, why, onResult }: { options: string[]; answer: number; why: string; onResult: (zone: Zone, items: AuditItem[]) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="stack">
      <div className="options">
        {options.map((o, i) => (
          <button key={i} className={`btn option ${picked === i ? "selected" : ""}`} onClick={() => setPicked(i)} data-testid={`option-${i}`}>
            {o}
          </button>
        ))}
      </div>
      <button
        className="btn primary"
        disabled={picked === null}
        data-testid="check"
        onClick={() =>
          onResult(picked === answer ? "optimal" : "failing", [
            {
              status: picked === answer ? "covered" : "missing",
              stone: "mind",
              title: picked === answer ? "Correct prediction" : "Not what happens",
              question: "Walk through it one step at a time. What does each part know, and when?",
              why,
            },
          ])
        }
      >
        Lock in my prediction
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estimation bench
// ---------------------------------------------------------------------------

export function EstimateBoard({ given, ask, values, onValues, onResult }: { given: string[]; ask: Ask[]; values: Record<string, string>; onValues: (v: Record<string, string>) => void; onResult: (zone: Zone, items: AuditItem[]) => void }) {
  const [scratch, setScratch] = useState("100M / (30 * 86400)");
  const scratchResult = useMemo(() => {
    try {
      return calculate(scratch).toLocaleString(undefined, { maximumFractionDigits: 3 });
    } catch (e) {
      return (e as Error).message;
    }
  }, [scratch]);
  const parsed = (v: string | undefined) => {
    try {
      return v && v.trim() ? calculate(v) : NaN;
    } catch {
      return NaN;
    }
  };
  return (
    <div className="grid2">
      <div className="stack">
        <div className="card">
          <b>What you know</b>
          <ul>
            {given.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
        {ask.map((a) => (
          <label key={a.id}>
            <div>{a.label}</div>
            <div className="row">
              <input
                value={values[a.id] ?? ""}
                onChange={(e) => onValues({ ...values, [a.id]: e.target.value })}
                placeholder="a number, or a sum like 100M / 2.6M"
                aria-label={a.label}
                data-testid={`estimate-${a.id}`}
                style={{ width: 260 }}
              />
              <span className="muted small">
                {a.unit}
                {values[a.id] && Number.isFinite(parsed(values[a.id])) ? ` = ${parsed(values[a.id]).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ""}
              </span>
            </div>
          </label>
        ))}
        <button className="btn primary" data-testid="check" onClick={() => {
          const g = gradeEstimates(Object.fromEntries(ask.map((a) => [a.id, parsed(values[a.id])])), ask);
          onResult(g.zone, g.items);
        }}>
          Check my estimates
        </button>
      </div>
      <div className="card">
        <b>🧮 Scratch calculator</b>
        <p className="muted small">Numbers, + − × ÷, brackets, and k / M / B for thousand, million, billion. A day is 86,400 seconds; a month is about 2.6M.</p>
        <input value={scratch} onChange={(e) => setScratch(e.target.value)} style={{ width: "100%" }} aria-label="Scratch calculator" />
        <p>
          = <b>{scratchResult}</b>
        </p>
      </div>
    </div>
  );
}
