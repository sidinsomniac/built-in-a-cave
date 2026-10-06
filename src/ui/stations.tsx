// The seven case stations. Each one is hands-on, and each submission is graded
// into a zone with Rhodey's audit.
import { useMemo, useState } from "react";
import { auditDesign, type DesignReport } from "../engine/audit";
import { gradeAssembly, gradeDesk, gradeInterrogation, type Endpoint } from "../engine/stations";
import type { Mark, StationRecord } from "../engine/store";
import type { AssembleStation, Case, CodeStation, CurveballStation, DesignStation, DeskStation, EstimateStation, InterrogateStation, Station } from "../engine/types";
import type { Zone } from "../engine/zones";
import type { Design, SimResult } from "../sim/types";
import { CodeBoard, EstimateBoard, OutcomePanel, type Outcome } from "./boards";
import { AuditList, Gauge } from "./common";
import { DesignTable } from "./DesignTable";

export interface StationProps<S extends Station> {
  c: Case;
  station: S;
  mark: Mark;
  record: StationRecord;
  save: (patch: Partial<StationRecord>) => void;
  /** Report a graded submission; returns XP gained. */
  grade: (zone: Zone) => number;
  outcome: Outcome | null;
  setOutcome: (o: Outcome) => void;
  /** Whether the learner has passed this station (shows the reference answer). */
  passed: boolean;
  /** The learner's design from the design station (for curveballs). */
  design?: Design;
}

// ---------------------------------------------------------------------------
// ❓ Interrogate Pepper
// ---------------------------------------------------------------------------

export function InterrogateView({ station, record, save, grade, outcome, setOutcome }: StationProps<InterrogateStation>) {
  const asked = record.asked ?? [];
  const spent = station.pool.filter((q) => asked.includes(q.id)).reduce((s, q) => s + q.cost, 0);
  const revealed = new Set(station.pool.filter((q) => asked.includes(q.id)).flatMap((q) => q.reveals));
  const ask = (id: string) => save({ asked: [...asked, id] });
  return (
    <div className="grid2">
      <div className="stack">
        <div className="row between">
          <b>📋 Ask Pepper</b>
          <span className="badge" data-testid="budget">
            ⏱ {spent} / {station.budget} min
          </span>
        </div>
        {station.pool.map((q) => {
          const isAsked = asked.includes(q.id);
          return (
            <div key={q.id} className={`qcard ${isAsked ? "asked" : ""}`}>
              <div className="row between">
                <span>{q.q}</span>
                {!isAsked && (
                  <button className="btn small" disabled={spent + q.cost > station.budget} onClick={() => ask(q.id)} data-testid={`ask-${q.id}`}>
                    Ask ({q.cost} min)
                  </button>
                )}
              </div>
              {isAsked && <div className="answer">Pepper: "{q.a}"</div>}
            </div>
          );
        })}
      </div>
      <div className="stack">
        <div className="card">
          <b>Requirements uncovered</b>
          <ul className="reqs" data-testid="requirements">
            {station.requirements.filter((r) => revealed.has(r.id)).map((r) => (
              <li key={r.id}>✓ {r.text}</li>
            ))}
            {revealed.size === 0 && <li className="muted">Nothing yet. Ask your first question.</li>}
          </ul>
        </div>
        <button
          className="btn primary"
          data-testid="submit-station"
          onClick={() => {
            const g = gradeInterrogation(asked, station.pool, station.requirements);
            const xp = grade(g.zone);
            setOutcome({ ...g, xp });
          }}
        >
          I've got what I need
        </button>
        <button className="btn ghost small" onClick={() => save({ asked: [] })}>
          Start the conversation again
        </button>
        <OutcomePanel outcome={outcome} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 🧮 Estimation bench
// ---------------------------------------------------------------------------

export function EstimateView({ station, record, save, grade, outcome, setOutcome }: StationProps<EstimateStation>) {
  return (
    <div className="stack">
      <EstimateBoard
        given={station.given}
        ask={station.ask}
        values={record.estimates ?? {}}
        onValues={(v) => save({ estimates: v })}
        onResult={(zone, items) => setOutcome({ zone, items, xp: grade(zone) })}
      />
      <OutcomePanel outcome={outcome} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 🗺 Design table (and 🚨 curveballs)
// ---------------------------------------------------------------------------

const heatOf = (sims: SimResult[]): Record<string, Zone> => {
  const out: Record<string, Zone> = {};
  for (const sim of sims) {
    for (const [id, u] of Object.entries(sim.peakUtil)) {
      const z: Zone = u > 1 ? "failing" : u > 0.85 ? "risky" : u > 0.6 ? "solid" : "optimal";
      const prev = out[id];
      if (!prev || ["failing", "risky", "solid", "optimal"].indexOf(z) < ["failing", "risky", "solid", "optimal"].indexOf(prev)) out[id] = z;
    }
  }
  return out;
};

function Sparkline({ sim, target }: { sim: SimResult; target?: number }) {
  const w = 300;
  const h = 70;
  const maxP = Math.max(target ?? 0, ...sim.timeline.map((t) => Math.min(t.p99, 1000)), 1);
  const x = (i: number) => (i / Math.max(1, sim.timeline.length - 1)) * w;
  const y = (v: number) => h - 4 - (Math.min(v, 1000) / maxP) * (h - 10);
  const p99 = sim.timeline.map((t, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(t.p99).toFixed(1)}`).join(" ");
  const errs = sim.timeline.map((t, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${(h - 4 - Math.min(1, t.errorRate) * (h - 10)).toFixed(1)}`).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`Replay of ${sim.scenarioId}: latency and errors over time`}>
      {target !== undefined && <line x1="0" x2={w} y1={y(target)} y2={y(target)} stroke="var(--risky)" strokeDasharray="4 4" strokeWidth="1" />}
      <path d={p99} fill="none" stroke="var(--solid)" strokeWidth="2" />
      <path d={errs} fill="none" stroke="var(--failing)" strokeWidth="2" />
    </svg>
  );
}

function SimReport({ report, labels }: { report: DesignReport; labels: Record<string, string> }) {
  return (
    <div className="stack" data-testid="sim-report">
      {report.sims.map((sim) => (
        <div key={sim.scenarioId} className="card">
          <div className="row between">
            <b>{labels[sim.scenarioId] ?? sim.scenarioId}</b>
            <span className="muted small">
              <span style={{ color: "var(--solid)" }}>━ p99 latency</span> · <span style={{ color: "var(--failing)" }}>━ errors</span>
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

export function DesignView({ c, station, record, save, grade, outcome, setOutcome, passed, mark }: StationProps<DesignStation>) {
  const start = useMemo<Design>(() => {
    if (mark === 1) return station.prebuilt;
    const clients = station.prebuilt.nodes.filter((n) => n.kind === "client");
    if (mark === 3) {
      const lb = station.prebuilt.nodes.filter((n) => n.kind === "lb");
      return { nodes: [...clients, ...lb], edges: station.prebuilt.edges.filter((e) => [...clients, ...lb].some((n) => n.id === e.to)) };
    }
    return { nodes: clients, edges: [] };
  }, [mark, station.prebuilt]);
  const design = record.design ?? start;
  const [report, setReport] = useState<DesignReport | null>(null);
  const [showRef, setShowRef] = useState(false);
  const scenarios = station.scenarios.map((id) => c.scenarios.find((s) => s.id === id)!);
  const labels = Object.fromEntries(c.scenarios.map((s) => [s.id, s.label]));

  const run = () => {
    const r = auditDesign(design, { scenarios, targets: station.targets, rubric: station.rubric, rules: station.rules });
    setReport(r);
    setOutcome({ zone: r.zone, items: r.items, xp: grade(r.zone) });
  };

  return (
    <div className="stack">
      <DesignTable design={design} onChange={(d) => save({ design: d })} palette={station.palette} extraSettings={c.settings} heat={report ? heatOf(report.sims) : {}} />
      <div className="row">
        <button className="btn primary" onClick={run} data-testid="run-sim">
          ▶ Run the simulation
        </button>
        <button className="btn ghost small" onClick={() => confirm("Start the design again?") && save({ design: start })}>
          Start again
        </button>
        <span className="muted small">Scenarios: {scenarios.map((s) => s.label).join(" · ")}</span>
      </div>
      {outcome && (
        <div className="grid2">
          <div className="card" data-testid="outcome">
            <Gauge zone={outcome.zone} caption={outcome.zone !== "failing" ? `+${outcome.xp ?? 0} XP` : "Not yet - check the audit and the replay."} />
            <AuditList items={outcome.items} passed={outcome.zone !== "failing"} />
          </div>
          {report && <SimReport report={report} labels={labels} />}
        </div>
      )}
      {passed && (
        <div className="card">
          <button className="btn small" onClick={() => setShowRef(!showRef)} data-testid="show-reference">
            {showRef ? "Hide" : "Compare with"} Rhodey's reference design
          </button>
          {showRef && (
            <div style={{ marginTop: 10 }}>
              <DesignTable design={c.reference} palette={[]} extraSettings={c.settings} readOnly height={360} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CurveballView({ c, station, record, save, grade, outcome, setOutcome, design: fromDesign }: StationProps<CurveballStation>) {
  const design = record.design ?? fromDesign ?? { nodes: [], edges: [] };
  const [report, setReport] = useState<DesignReport | null>(null);
  const labels = Object.fromEntries(station.scenarios.map((s) => [s.id, s.label]));
  const run = () => {
    const r = auditDesign(design, { scenarios: station.scenarios, targets: station.targets, rubric: { must: [], should: [] }, rules: [] });
    setReport(r);
    setOutcome({ zone: r.zone, items: r.items, xp: grade(r.zone) });
  };
  return (
    <div className="stack">
      <div className="card">
        <b>🚨 Fury's curveballs</b>
        <ul>
          {station.scenarios.map((s) => (
            <li key={s.id}>{s.label}</li>
          ))}
        </ul>
        <p className="muted small">These run on your design from the Design Table. If something breaks, patch it here and throw them again.</p>
      </div>
      <DesignTable design={design} onChange={(d) => save({ design: d })} palette={(c.stations.find((s) => s.kind === "design") as DesignStation | undefined)?.palette ?? []} extraSettings={c.settings} heat={report ? heatOf(report.sims) : {}} />
      <button className="btn primary" onClick={run} data-testid="run-sim">
        ▶ Throw the curveballs
      </button>
      {outcome && (
        <div className="grid2">
          <div className="card" data-testid="outcome">
            <Gauge zone={outcome.zone} caption={outcome.zone !== "failing" ? `+${outcome.xp ?? 0} XP` : "Something broke - find it in the replay."} />
            <AuditList items={outcome.items} passed={outcome.zone !== "failing"} />
          </div>
          {report && <SimReport report={report} labels={labels} />}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 📐 API desk
// ---------------------------------------------------------------------------

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const STATUSES = [200, 201, 202, 204, 301, 302, 400, 401, 404, 409, 429];
const OPTIONS: { value: string; label: string }[] = [
  { value: "auth", label: "Requires authentication" },
  { value: "rate_limited", label: "Rate limited (429)" },
  { value: "idempotency_key", label: "Idempotency key" },
  { value: "paginated", label: "Cursor pagination" },
];

export function DeskView({ station, record, save, grade, outcome, setOutcome, passed }: StationProps<DeskStation>) {
  const endpoints = record.endpoints ?? [];
  const setEndpoint = (i: number, patch: Partial<Endpoint>) => save({ endpoints: endpoints.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  return (
    <div className="stack">
      <div className="card">
        <div className="row between">
          <b>📐 Endpoints</b>
          <button className="btn small" onClick={() => save({ endpoints: [...endpoints, { method: "GET", path: "/", purpose: station.purposes[0].value, status: 200, options: [] }] })} data-testid="add-endpoint">
            + Add an endpoint
          </button>
        </div>
        {endpoints.length === 0 && <p className="muted small">No endpoints yet. Add one for each thing a client needs to do.</p>}
        {endpoints.map((e, i) => (
          <div key={i} className="row" style={{ marginTop: 10, borderTop: "1px solid var(--line)", paddingTop: 10 }} data-testid={`endpoint-${i}`}>
            <select value={e.purpose} onChange={(ev) => setEndpoint(i, { purpose: ev.target.value })} aria-label="Purpose">
              {station.purposes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select value={e.method} onChange={(ev) => setEndpoint(i, { method: ev.target.value })} aria-label="Method">
              {METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <input value={e.path} onChange={(ev) => setEndpoint(i, { path: ev.target.value })} aria-label="Path" placeholder="/links/:code" style={{ width: 170 }} />
            <span className="muted small">→</span>
            <select value={e.status} onChange={(ev) => setEndpoint(i, { status: Number(ev.target.value) })} aria-label="Response status">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {OPTIONS.map((o) => (
              <label key={o.value} className="small row" style={{ gap: 4 }}>
                <input type="checkbox" checked={e.options.includes(o.value)} onChange={(ev) => setEndpoint(i, { options: ev.target.checked ? [...e.options, o.value] : e.options.filter((x) => x !== o.value) })} />
                {o.label}
              </label>
            ))}
            <button className="btn small ghost" onClick={() => save({ endpoints: endpoints.filter((_, j) => j !== i) })} aria-label="Remove endpoint">
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        className="btn primary"
        data-testid="submit-station"
        onClick={() => {
          const g = gradeDesk(endpoints, station.checks);
          setOutcome({ ...g, xp: grade(g.zone) });
        }}
      >
        Submit the interface
      </button>
      <OutcomePanel outcome={outcome}>
        {passed && (
          <div>
            <h3>Rhodey's version</h3>
            <ul className="small">
              {station.answer.map((e) => (
                <li key={e.path + e.method}>
                  <code>
                    {e.method} {e.path}
                  </code>{" "}
                  → {e.status} {e.options.length ? `(${e.options.join(", ")})` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </OutcomePanel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 💻 Deep dive
// ---------------------------------------------------------------------------

export function CodeView({ station, record, save, grade, outcome, setOutcome }: StationProps<CodeStation>) {
  const files = record.code ?? station.files;
  return (
    <div className="stack">
      <CodeBoard
        mission={{ files: station.files, entry: station.entry, tests: station.tests, mocks: station.mocks }}
        files={files}
        onFiles={(f) => save({ code: f })}
        onResult={(zone, r) =>
          setOutcome({
            zone,
            xp: grade(zone),
            items: r.tests.map((t) => ({ status: t.passed ? "covered" : "missing", stone: "reality", title: t.name, question: t.message ?? "", why: "" })),
          })
        }
      />
      <OutcomePanel outcome={outcome} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 🧷 Answer assembly
// ---------------------------------------------------------------------------

export function AssembleView({ station, record, save, grade, outcome, setOutcome }: StationProps<AssembleStation>) {
  const placements = record.placements ?? {};
  const [picked, setPicked] = useState<string | null>(null);
  const labels = Object.fromEntries(station.sections.map((s) => [s.id, s.label]));
  const order = useMemo(() => [...station.chips].sort((a, b) => a.text.localeCompare(b.text)), [station.chips]);
  const place = (section: string | null) => {
    if (!picked) return;
    const next = { ...placements };
    if (section) next[picked] = section;
    else delete next[picked];
    save({ placements: next });
    setPicked(null);
  };
  const unplaced = order.filter((c) => !placements[c.id]);
  return (
    <div className="stack">
      <div className="card">
        <b>Statements</b> <span className="muted small">- pick one, then click the section it belongs in. Leave decoys out.</span>
        <div data-testid="chip-pool" onClick={(e) => e.target === e.currentTarget && place(null)}>
          {unplaced.map((c) => (
            <button key={c.id} className={`chip ${picked === c.id ? "picked" : ""}`} onClick={() => setPicked(picked === c.id ? null : c.id)} data-testid={`chip-${c.id}`}>
              {c.text}
            </button>
          ))}
          {unplaced.length === 0 && <span className="muted small">Every statement is placed.</span>}
        </div>
        {picked && placements[picked] && (
          <button className="btn small ghost" onClick={() => place(null)}>
            Take it out of the pitch
          </button>
        )}
      </div>
      <div className="grid2">
        {station.sections.map((s) => (
          <div key={s.id} className="section-box" onClick={() => place(s.id)} data-testid={`section-${s.id}`} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && place(s.id)} aria-label={`Place in ${s.label}`}>
            <h4>{s.label}</h4>
            {order
              .filter((c) => placements[c.id] === s.id)
              .map((c) => (
                <button
                  key={c.id}
                  className={`chip ${picked === c.id ? "picked" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Holding another statement? Drop it in this section. Otherwise pick this one up.
                    if (picked && picked !== c.id) place(s.id);
                    else setPicked(picked === c.id ? null : c.id);
                  }}
                >
                  {c.text}
                </button>
              ))}
          </div>
        ))}
      </div>
      <button
        className="btn primary"
        data-testid="submit-station"
        onClick={() => {
          const g = gradeAssembly(placements, station.chips, labels);
          setOutcome({ ...g, xp: grade(g.zone) });
        }}
      >
        Deliver the pitch
      </button>
      <OutcomePanel outcome={outcome} />
    </div>
  );
}
