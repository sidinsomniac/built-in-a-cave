// Shared pieces: the zone gauge, Rhodey's audit, JARVIS's hint ladder, story scenes,
// and the lecture renderer (markdown with interactive diagrams and checkpoints).
import { load as loadYaml } from "js-yaml";
import { marked } from "marked";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AUDIT_ICON, STONES, type AuditItem } from "../engine/audit";
import { CAST } from "../engine/content";
import { useGame } from "../engine/store";
import type { Hints, SceneLine } from "../engine/types";
import { ZONES, type Zone } from "../engine/zones";
import { AUDITOR, MENTOR } from "../lore/lore";

export function ZoneBadge({ zone }: { zone: Zone }) {
  const z = ZONES[zone];
  return (
    <span className={`zone ${zone}`} data-testid="zone-badge" data-zone={zone}>
      {z.icon} {z.label}
    </span>
  );
}

/** The Arc Reactor gauge: a ring split into the four zones, with the result lit up. */
export function Gauge({ zone, caption }: { zone: Zone; caption?: ReactNode }) {
  const order: Zone[] = ["failing", "risky", "solid", "optimal"];
  const r = 34;
  const c = 2 * Math.PI * r;
  const seg = c / 4;
  return (
    <div className="gauge" data-testid="gauge" data-zone={zone}>
      <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
        <g transform="rotate(-90 46 46)">
          {order.map((z, i) => (
            <circle
              key={z}
              cx="46"
              cy="46"
              r={r}
              fill="none"
              stroke={`var(--${z})`}
              strokeOpacity={z === zone ? 1 : 0.18}
              strokeWidth={z === zone ? 9 : 6}
              strokeDasharray={`${seg - 3} ${c - seg + 3}`}
              strokeDashoffset={-i * seg}
            />
          ))}
        </g>
        <circle cx="46" cy="46" r="15" fill={`var(--${zone})`} opacity="0.85" />
        <circle cx="46" cy="46" r="8" fill="#fff" opacity="0.7" />
      </svg>
      <div className="readout">
        <b>
          {ZONES[zone].icon} {ZONES[zone].label}
        </b>
        <span className="muted small">Grade {ZONES[zone].grade}</span>
        {caption && <div className="small soft">{caption}</div>}
      </div>
    </div>
  );
}

/** Rhodey's after-action audit. Before a pass it asks; after a pass it explains. */
export function AuditList({ items, passed }: { items: AuditItem[]; passed: boolean }) {
  if (!items.length) return null;
  return (
    <div>
      <h3>🛡️ {AUDITOR}'s audit</h3>
      <ul className="audit" data-testid="audit">
        {items.map((item, i) => (
          <li key={i} className={item.status}>
            <span className="mark" aria-label={item.status}>
              {AUDIT_ICON[item.status]}
            </span>
            <div>
              <div>
                {item.title}
                <span className="stone">
                  {STONES[item.stone].icon} {STONES[item.stone].dimension}
                </span>
              </div>
              {item.status !== "covered" && !passed && <div className="q">🔷 {item.question}</div>}
              {passed && item.why && <div className="q">{item.why}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const RUNGS: (keyof Hints)[] = ["nudge", "question", "pseudocode", "flaw", "analogous"];
const RUNG_LABEL: Record<keyof Hints, string> = { nudge: "Nudge", question: "A question", pseudocode: "Pseudocode", flaw: "The flaw", analogous: "A similar example" };

/** JARVIS's hint ladder: one rung at a time. */
export function HintLadder({ hints, used, onReveal, cost }: { hints: Hints; used: number; onReveal: () => void; cost?: string }) {
  return (
    <div className="hints card">
      <div className="row between">
        <b>🔷 Ask {MENTOR}</b>
        {used < RUNGS.length && (
          <button className="btn small" onClick={onReveal} data-testid="hint-next">
            {used === 0 ? "I'd like a hint" : "Another hint"} {cost ? `(${cost})` : ""}
          </button>
        )}
      </div>
      {RUNGS.slice(0, used).map((r) => (
        <div key={r} className="rung">
          <div className="muted small">{RUNG_LABEL[r]}</div>
          {r === "analogous" || r === "pseudocode" ? <pre>{hints[r]}</pre> : hints[r]}
        </div>
      ))}
    </div>
  );
}

/** A click-through story scene. Opens by itself the first time; replay any time. */
export function Cutscene({ id, lines, title, autoOpen = true }: { id: string; lines: SceneLine[]; title?: string; autoOpen?: boolean }) {
  const seen = useGame((s) => !!s.scenesSeen[id]);
  const seeScene = useGame((s) => s.seeScene);
  const [open, setOpen] = useState(autoOpen && !seen && lines.length > 0);
  const [i, setI] = useState(0);
  if (!lines.length) return null;
  const close = () => {
    setOpen(false);
    setI(0);
    seeScene(id);
  };
  const line = lines[i];
  const who = CAST[line.who] ?? { name: line.who, portrait: "🎞️" };
  return (
    <>
      <button className="btn small ghost" onClick={() => setOpen(true)} data-testid="story-replay">
        📜 Story
      </button>
      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title ?? "Story"} data-testid="cutscene">
          <div className="modal">
            {title && <div className="muted small">{title}</div>}
            <div className="scene-line" style={{ marginTop: 8 }}>
              <div className="portrait" aria-hidden="true">
                {who.portrait}
              </div>
              <div>
                {who.name && <div className="who">{who.name}</div>}
                <div>{line.line}</div>
              </div>
            </div>
            <div className="row between" style={{ marginTop: 16 }}>
              <span className="muted small">
                {i + 1} / {lines.length}
              </span>
              <div className="row">
                <button className="btn small ghost" onClick={close} data-testid="scene-skip">
                  Skip
                </button>
                <button className="btn primary small" onClick={() => (i + 1 < lines.length ? setI(i + 1) : close())} autoFocus>
                  {i + 1 < lines.length ? "Next ▸" : "Let's build"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Guide({ children }: { children: string }) {
  return (
    <div className="guide" data-testid="guide">
      <div className="who">🔷 {MENTOR}</div>
      <Markdown text={children} />
    </div>
  );
}

export function Markdown({ text }: { text: string }) {
  const html = useMemo(() => marked.parse(text, { async: false }) as string, [text]);
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---------------------------------------------------------------------------
// Lectures: markdown, plus ```diagram and ```checkpoint blocks.
// ---------------------------------------------------------------------------

type Segment = { kind: "md"; text: string } | { kind: "diagram"; title?: string; steps: string[] } | { kind: "checkpoint"; q: string; options: string[]; answer: number; why: string };

export function splitLecture(markdown: string): Segment[] {
  const out: Segment[] = [];
  const re = /^```(diagram|checkpoint)\n([\s\S]*?)^```\s*$/gm;
  let last = 0;
  for (const m of markdown.matchAll(re)) {
    out.push({ kind: "md", text: markdown.slice(last, m.index) });
    let spec: Record<string, unknown>;
    try {
      spec = loadYaml(m[2]) as Record<string, unknown>;
    } catch (err) {
      out.push({ kind: "md", text: `> ⚠️ This ${m[1]} couldn't be read: ${(err as Error).message.split("\n")[0]}` });
      last = (m.index ?? 0) + m[0].length;
      continue;
    }
    if (m[1] === "diagram") out.push({ kind: "diagram", title: spec.title as string | undefined, steps: (spec.steps as string[]) ?? [] });
    else out.push({ kind: "checkpoint", q: spec.q as string, options: spec.options as string[], answer: spec.answer as number, why: spec.why as string });
    last = (m.index ?? 0) + m[0].length;
  }
  out.push({ kind: "md", text: markdown.slice(last) });
  return out;
}

function Diagram({ title, steps }: { title?: string; steps: string[] }) {
  const [step, setStep] = useState(0);
  return (
    <div className="diagram" data-testid="diagram">
      {title && <b>{title}</b>}
      <ol>
        {steps.map((s, i) => (
          <li key={i} className={i < step ? "" : i === step ? "now" : "future"}>
            {s}
          </li>
        ))}
      </ol>
      <div className="row">
        <button className="btn small" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          ◂ Back
        </button>
        <button className="btn small" onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step >= steps.length - 1}>
          Next step ▸
        </button>
        <button className="btn small ghost" onClick={() => setStep(steps.length - 1)}>
          Show all
        </button>
      </div>
    </div>
  );
}

function Checkpoint({ q, options, answer, why }: { q: string; options: string[]; answer: number; why: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const right = picked === answer;
  return (
    <div className="checkpoint" data-testid="checkpoint">
      <div>
        <b>❓</b> <span dangerouslySetInnerHTML={{ __html: marked.parseInline(q, { async: false }) as string }} />
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        {options.map((o, i) => (
          <button key={i} className={`btn small ${picked === i ? "selected" : ""}`} onClick={() => setPicked(i)} disabled={right} dangerouslySetInnerHTML={{ __html: marked.parseInline(o, { async: false }) as string }} />
        ))}
      </div>
      {picked !== null && <p className={`small ${right ? "pass" : "fail"}`}>{right ? `✔ ${why}` : "✘ Not quite. Think about it once more."}</p>}
    </div>
  );
}

export function Lecture({ markdown }: { markdown: string }) {
  const segments = useMemo(() => splitLecture(markdown), [markdown]);
  return (
    <div className="lecture">
      {segments.map((s, i) =>
        s.kind === "md" ? <Markdown key={i} text={s.text} /> : s.kind === "diagram" ? <Diagram key={i} title={s.title} steps={s.steps} /> : <Checkpoint key={i} {...s} />,
      )}
    </div>
  );
}

/** Scrolls to the top when a route changes. */
export function useScrollTop(key: string) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);
}
