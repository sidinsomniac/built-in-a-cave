// The design bench: the design table with its guided build, simulation, readouts,
// Rhodey's audit and the reference comparison. Used by case stations and lesson exercises.
import { useEffect, useMemo, useState } from "react";
import { auditDesign, type AuditItem, type DesignReport } from "../engine/audit";
import { compareDesigns } from "../engine/compare";
import { checkStep, currentStep, type DesignStep } from "../engine/steps";
import type { Mark, StationRecord } from "../engine/store";
import type { Zone } from "../engine/zones";
import { COMPONENTS, type SettingSpec } from "../sim/components";
import type { Design, NodeKind, NodeLoad, Scenario, SimResult, Targets } from "../sim/types";
import type { Outcome } from "./boards";
import { AuditList, Gauge } from "./common";
import { DesignTable, LoadBar, loadZone } from "./DesignTable";
import { GuidedSteps } from "./GuidedSteps";

export interface BenchSpec {
  palette: NodeKind[];
  scenarios: Scenario[];
  targets: Targets;
  rubric: { must: string[]; should: string[] };
  rules: string[];
  steps?: DesignStep[];
}

/** Each node's readout from the scenario where it was busiest. */
export const loadsOf = (sims: SimResult[]): Record<string, NodeLoad> => {
  const out: Record<string, NodeLoad> = {};
  for (const sim of sims) for (const [id, l] of Object.entries(sim.nodeLoad)) if (!out[id] || l.util > out[id].util) out[id] = l;
  return out;
};

export const heatOf = (sims: SimResult[]): Record<string, Zone> => Object.fromEntries(Object.entries(loadsOf(sims)).map(([id, l]) => [id, loadZone(l.util)]));

/** The parts that ran hottest, worst first, with the numbers to size them. */
function Bottlenecks({ sims, labels }: { sims: SimResult[]; labels: Record<string, string> }) {
  const loads = loadsOf(sims);
  const hot = Object.entries(loads)
    .filter(([, l]) => l.util > 0.8)
    .sort((a, b) => b[1].util - a[1].util)
    .slice(0, 4);
  if (!hot.length) return <p className="small pass" data-testid="bottlenecks">✓ Every part stayed under 80% busy at its worst moment.</p>;
  return (
    <div className="card" data-testid="bottlenecks">
      <b>🔥 Hottest parts</b> <span className="muted small">(at their busiest moment)</span>
      <ul className="bottlenecks">
        {hot.map(([id, l]) => (
          <li key={id}>
            <div>
              <b>{labels[id] ?? id}</b>
            </div>
            <LoadBar load={l} />
            <div className="small soft">
              Asked for {l.demand.toLocaleString()} {l.unit}; can do {l.capacity.toLocaleString()} {l.unit}
              {l.sizing && <span className="muted"> ({l.sizing})</span>}.
            </div>
            {l.note && <div className="small muted">{l.note}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Rhodey's reference, framed as one answer among many, with a diff against the player's. */
function ReferenceCompare({ reference, design, extraSettings }: { reference: Design; design: Design; extraSettings?: Partial<Record<NodeKind, SettingSpec[]>> }) {
  const [show, setShow] = useState(false);
  const diff = compareDesigns(design, reference);
  return (
    <div className="card">
      <button className="btn small" onClick={() => setShow(!show)} data-testid="show-reference">
        {show ? "Hide" : "Compare with"} Rhodey's reference design
      </button>
      {show && (
        <div className="stack" style={{ marginTop: 10 }} data-testid="reference">
          <p className="small soft">This is <b>one</b> of many designs that pass. Different sizes that meet the targets are just as right - here's how yours compares, part by part.</p>
          <table className="metrics">
            <thead>
              <tr>
                <th>Part</th>
                <th>Yours</th>
                <th>Rhodey's</th>
              </tr>
            </thead>
            <tbody>
              {diff.map((d) => (
                <tr key={d.kind} className={d.same ? "" : "differs"}>
                  <td>
                    {COMPONENTS[d.kind].icon} {d.name}
                  </td>
                  <td>{d.yours}</td>
                  <td>{d.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <DesignTable design={reference} palette={[]} extraSettings={extraSettings} readOnly height={360} />
        </div>
      )}
    </div>
  );
}

/** The replay: worst-case latency and errors over the run. Hover or drag to scrub through it. */
function Sparkline({ sim, target }: { sim: SimResult; target?: number }) {
  const [at, setAt] = useState<number | null>(null);
  const w = 300;
  const h = 70;
  const maxP = Math.max(target ?? 0, ...sim.timeline.map((t) => Math.min(t.p99, 1000)), 1);
  const x = (i: number) => (i / Math.max(1, sim.timeline.length - 1)) * w;
  const y = (v: number) => h - 4 - (Math.min(v, 1000) / maxP) * (h - 10);
  const p99 = sim.timeline.map((t, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(t.p99).toFixed(1)}`).join(" ");
  const errs = sim.timeline.map((t, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${(h - 4 - Math.min(1, t.errorRate) * (h - 10)).toFixed(1)}`).join(" ");
  const scrub = (clientX: number, rect: DOMRect) => setAt(Math.max(0, Math.min(sim.timeline.length - 1, Math.round(((clientX - rect.left) / rect.width) * (sim.timeline.length - 1)))));
  const point = at === null ? null : sim.timeline[at];
  return (
    <div>
      <svg
        className="spark"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Replay of ${sim.scenarioId}: latency and errors over time`}
        onPointerMove={(e) => scrub(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setAt(null)}
      >
        {target !== undefined && <line x1="0" x2={w} y1={y(target)} y2={y(target)} stroke="var(--risky)" strokeDasharray="4 4" strokeWidth="1" />}
        <path d={p99} fill="none" stroke="var(--accent)" strokeWidth="2" />
        <path d={errs} fill="none" stroke="var(--failing)" strokeWidth="2" />
        {at !== null && <line x1={x(at)} x2={x(at)} y1="0" y2={h} stroke="var(--accent2)" strokeWidth="1" />}
      </svg>
      <div className="scrub">
        {point
          ? `t=${point.t}s · p99 ${point.p99 >= 10_000 ? "never answers" : `${Math.round(point.p99)} ms`} · errors ${(point.errorRate * 100).toFixed(1)}%${point.hottest ? ` · busiest: ${point.hottest} (${Math.round(point.utilisation * 100)}%)` : ""}`
          : "Hover the replay to scrub through the run."}
      </div>
    </div>
  );
}

export function SimReport({ report, labels, nodeLabels }: { report: DesignReport; labels: Record<string, string>; nodeLabels: Record<string, string> }) {
  return (
    <div className="stack" data-testid="sim-report">
      <Bottlenecks sims={report.sims} labels={nodeLabels} />
      {report.sims.map((sim) => (
        <div key={sim.scenarioId} className="card">
          <div className="row between">
            <b>{labels[sim.scenarioId] ?? sim.scenarioId}</b>
            <span className="muted small">
              <span style={{ color: "var(--accent)" }}>━ p99 latency</span> · <span style={{ color: "var(--failing)" }}>━ errors</span>
            </span>
          </div>
          <Sparkline sim={sim} />
          <table className="metrics">
            <tbody>
              {Object.entries(sim.classes).map(([cls, r]) => (
                <tr key={cls}>
                  <td>{cls}</td>
                  <td>p99 {r.p99 >= 10_000 ? "never answers" : `${Math.round(r.p99)} ms`}</td>
                  <td>errors {(r.errorRate * 100).toFixed(2)}%</td>
                </tr>
              ))}
              <tr>
                <td>overall</td>
                <td>available {(sim.availability * 100).toFixed(1)}% of the time</td>
                <td>{sim.costPerMonth.toLocaleString()} credits/month</td>
              </tr>
            </tbody>
          </table>
          {sim.notes.length > 0 && (
            <ul className="small soft">
              {sim.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export function DesignBench({
  spec,
  start,
  extraSettings,
  reference,
  state,
  save,
  mark,
  passed,
  outcome,
  onGraded,
}: {
  spec: BenchSpec;
  start: Design;
  extraSettings?: Partial<Record<NodeKind, SettingSpec[]>>;
  reference: Design;
  state: Partial<StationRecord>;
  save: (patch: Partial<StationRecord>) => void;
  mark: Mark;
  passed: boolean;
  outcome: Outcome | null;
  onGraded: (zone: Zone, items: AuditItem[]) => void;
}) {
  const design = state.design ?? start;
  const [report, setReport] = useState<DesignReport | null>(null);
  const { scenarios } = spec;
  const labels = Object.fromEntries(scenarios.map((s) => [s.id, s.label]));
  const nodeLabels = Object.fromEntries(design.nodes.map((n) => [n.id, `${COMPONENTS[n.kind].icon} ${n.label ?? n.id}`]));

  // The guided build (Mark I and III).
  const steps = mark === 7 ? [] : (spec.steps ?? []);
  const answers = state.stepAnswers ?? {};
  const stepsDone = state.stepsDone ?? [];
  const ctx = { scenarios, ran: !!state.ran };
  const current = useMemo(() => currentStep(steps, design, ctx, answers, stepsDone, mark === 1), [steps, design, state.ran, answers, stepsDone, mark]); // eslint-disable-line react-hooks/exhaustive-deps
  const checks = useMemo(() => (steps[current] ? checkStep(steps[current], design, ctx) : []), [steps, current, design, state.ran]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const finished = steps.slice(0, current).map((s) => s.id);
    if (finished.some((id) => !stepsDone.includes(id))) save({ stepsDone: [...new Set([...stepsDone, ...finished])] });
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    const r = auditDesign(design, { scenarios, targets: spec.targets, rubric: spec.rubric, rules: spec.rules });
    setReport(r);
    if (!state.ran) save({ ran: true });
    onGraded(r.zone, r.items);
  };

  return (
    <div className="stack">
      <GuidedSteps steps={steps} current={current} checks={checks} answers={answers} onAnswer={(id, v) => save({ stepAnswers: { ...answers, [id]: v } })} mark={mark} />
      <DesignTable
        design={design}
        onChange={(d) => save({ design: d })}
        palette={spec.palette}
        extraSettings={extraSettings}
        heat={report ? heatOf(report.sims) : {}}
        loads={report ? loadsOf(report.sims) : undefined}
      />
      <div className="row">
        <button className="btn primary" onClick={run} data-testid="run-sim">
          ▶ Run the simulation
        </button>
        <button className="btn ghost small" onClick={() => confirm("Start the design again?") && save({ design: start, stepsDone: [], stepAnswers: {} })}>
          Start again
        </button>
        <span className="muted small">Scenarios: {scenarios.map((s) => s.label).join(" · ")}</span>
      </div>
      {outcome && (
        <div className="grid2">
          <div className="card" data-testid="outcome">
            <Gauge zone={outcome.zone} caption={outcome.zone !== "failing" ? `+${outcome.xp ?? 0} XP` : "Not yet - check the audit and the hottest parts."} />
            <AuditList items={outcome.items} passed={outcome.zone !== "failing"} />
          </div>
          {report && <SimReport report={report} labels={labels} nodeLabels={nodeLabels} />}
        </div>
      )}
      {passed && <ReferenceCompare reference={reference} design={design} extraSettings={extraSettings} />}
    </div>
  );
}
