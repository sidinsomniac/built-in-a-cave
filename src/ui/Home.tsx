// Stark Industries: every Phase, its lessons and its cases.
import { PHASES } from "../engine/content";
import { useGame } from "../engine/store";
import { STATION_ICON } from "../engine/types";
import { ZONES, passes } from "../engine/zones";
import { GAME_NAME } from "../lore/lore";
import { Cutscene } from "./common";

export function Home() {
  const exercises = useGame((s) => s.exercises);
  const cases = useGame((s) => s.cases);
  const scenesSeen = useGame((s) => s.scenesSeen);
  // Only one story pops up at a time: the first Phase whose opening you haven't seen.
  const firstUnseen = PHASES.find((p) => !scenesSeen[`phase:${p.phase}`])?.phase;
  return (
    <div>
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(255,90,60,.16), rgba(255,200,97,.05))" }}>
        <h1>⚙️ {GAME_NAME}</h1>
        <p className="soft" style={{ maxWidth: "70ch" }}>
          From "what happens when I type a URL?" to leading senior system design and machine-coding rounds. Every answer is <b>built</b> - code,
          designs, numbers - and lands in a zone: 🟢 Optimal, 🔵 Solid, 🟡 Risky or 🔴 Failing. JARVIS only ever asks questions.
        </p>
      </div>
      {PHASES.map((p) => (
        <section key={p.phase} className="phase" aria-labelledby={`phase-${p.phase}`}>
          <div className="phase-head">
            <span className="num">PHASE {p.phase}</span>
            <h2 id={`phase-${p.phase}`}>{p.title}</h2>
            <span className="muted small">· {p.arc}</span>
            <Cutscene id={`phase:${p.phase}`} lines={p.intro} title={`Phase ${p.phase}: ${p.title}`} autoOpen={p.phase === firstUnseen} />
          </div>
          <p className="muted" style={{ marginTop: 0 }}>{p.summary}</p>
          <div className="tiles">
            {p.lessons.map((l) => {
              const required = l.exercises.filter((e) => e.tier !== "outstanding");
              const done = required.filter((e) => passes(exercises[e.id]?.best ?? "failing")).length;
              return (
                <a key={l.id} className="tile" href={`#/lesson/${l.id}`} data-testid={`lesson-${l.id}`}>
                  <div className="kind">Lesson {l.number}{l.part ? ` · part ${l.part.n}` : ""}</div>
                  <h3>{l.title}</h3>
                  <div className="muted small">
                    {l.exercises.map((e) => (exercises[e.id] ? ZONES[exercises[e.id].best].icon : "○")).join(" ")} · {done}/{required.length} required done
                  </div>
                </a>
              );
            })}
            {p.cases.map((c) => {
              const prog = cases[c.id];
              const completed = prog ? Object.entries(prog.completed) : [];
              return (
                <a key={c.id} className="tile" href={`#/case/${c.id}`} data-testid={`case-${c.id}`}>
                  <div className="kind">Case {c.id.toUpperCase()}</div>
                  <h3>🏗 {c.title}</h3>
                  <div className="muted small">{c.tagline}</div>
                  <div className="small" style={{ marginTop: 6 }}>
                    {c.stations.map((s) => STATION_ICON[s.kind]).join(" ")}
                  </div>
                  {completed.length > 0 && <div className="small">{completed.map(([m, z]) => `Mark ${m === "1" ? "I" : m === "3" ? "III" : "VII"} ${ZONES[z!].icon}`).join(" · ")}</div>}
                </a>
              );
            })}
          </div>
        </section>
      ))}
      <p className="muted small">Phases 3, 4 and 6, and the rest of each Phase, are on the way - see the curriculum in docs/curriculum.md.</p>
    </div>
  );
}
