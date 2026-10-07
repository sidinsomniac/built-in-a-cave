// A system design case: seven stations, played at a chosen Mark (support level).
import { useState } from "react";
import { CAST, caseById, lessonById } from "../engine/content";
import { useGame, type Mark, type StationRecord } from "../engine/store";
import { STATION_ICON, type Station } from "../engine/types";
import { minZone, passes, ZONES, type Zone } from "../engine/zones";
import { MARK_LEVELS, MENTOR } from "../lore/lore";
import type { Outcome } from "./boards";
import { Cutscene, Guide, HintLadder, Markdown, ZoneBadge } from "./common";
import { AssembleView, BriefingView, CodeView, CurveballView, DesignView, DeskView, EstimateView, InterrogateView, type StationProps } from "./stations";

const EMPTY: StationRecord = { attempts: 0, hintsUsed: 0 };

export function CaseView({ id }: { id: string }) {
  const progress = useGame((s) => s.cases[id]);
  const recordStation = useGame((s) => s.recordStation);
  const gradeStation = useGame((s) => s.gradeStation);
  const completeCase = useGame((s) => s.completeCase);
  const unlocked = progress?.unlocked ?? 1;
  const [mark, setMark] = useState<Mark>(1);
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const exerciseRecords = useGame((s) => s.exercises);
  const caseDef = caseById(id);
  if (!caseDef) return <p>Unknown case.</p>;
  // The parts briefing is Mark I only.
  const c = { ...caseDef, stations: caseDef.stations.filter((st) => st.kind !== "briefing" || mark === 1) };
  // Once every lesson that teaches the parts is passed, the briefing is a skippable recap.
  const required = c.requires ?? [];
  const partsLearned = required.length > 0 && required.every((lid) => (lessonById(lid)?.exercises ?? []).filter((e) => e.tier !== "outstanding").every((e) => passes(exerciseRecords[e.id]?.best ?? "failing")));

  const records = progress?.stations[mark] ?? {};
  const best = (st: Station): Zone | undefined => records[st.id]?.best;
  const stationOpen = (i: number) => i === 0 || c.stations.slice(0, i).every((st) => passes(best(st) ?? "failing"));
  const allPassed = c.stations.every((st) => passes(best(st) ?? "failing"));
  const overall = allPassed ? minZone(...c.stations.map((st) => best(st)!)) : null;
  const station = c.stations[Math.min(index, c.stations.length - 1)];
  const record = records[station.id] ?? EMPTY;
  const designRecord = records[c.stations.find((s) => s.kind === "design")?.id ?? ""]?.design;
  const hintCost = mark === 1 ? "free" : mark === 3 ? "−3 XP" : "−6 XP";

  const props: StationProps<Station> = {
    c,
    station,
    mark,
    record,
    save: (patch) => recordStation(c.id, mark, station.id, patch),
    grade: (zone) => {
      const xp = gradeStation(c.id, mark, station.id, zone, record.hintsUsed);
      // When the last station passes, close the case at this Mark.
      const after = c.stations.map((st) => (st.id === station.id ? (passes(zone) ? zone : best(st)) : best(st)));
      if (after.every((z) => z && passes(z))) completeCase(c.id, mark, minZone(...(after as Zone[])));
      return xp;
    },
    outcome: outcomes[`${mark}:${station.id}`] ?? null,
    setOutcome: (o) => setOutcomes((prev) => ({ ...prev, [`${mark}:${station.id}`]: o })),
    passed: passes(best(station) ?? "failing"),
    design: designRecord,
  };

  const view = (() => {
    switch (station.kind) {
      case "briefing": return <BriefingView {...(props as StationProps<typeof station>)} skippable={partsLearned} />;
      case "interrogate": return <InterrogateView {...(props as StationProps<typeof station>)} />;
      case "estimate": return <EstimateView {...(props as StationProps<typeof station>)} />;
      case "design": return <DesignView {...(props as StationProps<typeof station>)} />;
      case "desk": return <DeskView {...(props as StationProps<typeof station>)} />;
      case "code": return <CodeView {...(props as StationProps<typeof station>)} />;
      case "curveballs": return <CurveballView {...(props as StationProps<typeof station>)} />;
      case "assemble": return <AssembleView {...(props as StationProps<typeof station>)} />;
    }
  })();

  return (
    <div className="stack">
      <div className="row between">
        <div>
          <a href="#/">← Stark Industries</a>
          <h1 style={{ marginTop: 8 }}>🏗 {c.title}</h1>
          <p className="soft" style={{ margin: 0 }}>{c.tagline}</p>
        </div>
        <Cutscene id={`case:${c.id}`} lines={c.scene} title={`Case: ${c.title}`} />
      </div>

      <div className="card">
        <div className="row between">
          <div>
            <b>🕶️ Fury:</b> <i>"{c.brief}"</i>
          </div>
          <div className="row" role="radiogroup" aria-label="Support level">
            {([1, 3, 7] as Mark[]).map((m) => (
              <button
                key={m}
                className={`btn small ${mark === m ? "selected" : ""}`}
                disabled={m > unlocked}
                onClick={() => {
                  setMark(m);
                  setIndex(0);
                }}
                role="radio"
                aria-checked={mark === m}
                title={MARK_LEVELS[m].blurb}
                data-testid={`mark-${m}`}
              >
                {m > unlocked ? "🔒 " : ""}
                {MARK_LEVELS[m].name} · {MARK_LEVELS[m].label}
                {progress?.completed[m] ? ` ${ZONES[progress.completed[m]!].icon}` : ""}
              </button>
            ))}
          </div>
        </div>
        <p className="muted small" style={{ marginBottom: 0 }}>{MARK_LEVELS[mark].blurb}</p>
      </div>

      <div className="tabs" role="tablist" aria-label="Stations">
        {c.stations.map((st, i) => {
          const z = best(st);
          return (
            <button key={st.id} className="tab" role="tab" aria-selected={i === index} disabled={!stationOpen(i)} onClick={() => setIndex(i)} data-testid={`station-${st.id}`}>
              {stationOpen(i) ? STATION_ICON[st.kind] : "🔒"} {i + 1}. {st.title} {z ? ZONES[z].icon : ""}
            </button>
          );
        })}
      </div>

      <div className="row between">
        <h2 style={{ margin: 0 }}>
          {STATION_ICON[station.kind]} {station.title}
        </h2>
        {station.timebox && <span className="badge">⏱ Interview time box: {station.timebox} min</span>}
      </div>
      {mark === 1 && <Guide>{station.guide}</Guide>}
      {view}
      <HintLadder
        key={`${mark}:${station.id}`}
        hints={station.hints}
        used={record.hintsUsed}
        cost={hintCost}
        onReveal={() => recordStation(c.id, mark, station.id, { hintsUsed: record.hintsUsed + 1 })}
      />
      {props.passed && index + 1 < c.stations.length && (
        <button className="btn primary" onClick={() => setIndex(index + 1)} data-testid="next-station">
          Next station: {STATION_ICON[c.stations[index + 1].kind]} {c.stations[index + 1].title} →
        </button>
      )}

      {overall && (
        <div className="card" data-testid="case-complete">
          <h2>🏁 Case closed at {MARK_LEVELS[mark].name}</h2>
          <p>
            Overall: <ZoneBadge zone={overall} /> <span className="muted small">(your weakest station sets the overall zone, as in a real interview)</span>
          </p>
          {c.outro.map((l, i) => (
            <p key={i}>
              <b>{CAST[l.who]?.name ? `${CAST[l.who].portrait} ${CAST[l.who].name}: ` : ""}</b>
              {l.line}
            </p>
          ))}
          {mark < 7 && <Markdown text={`**${mark === 1 ? "Mark III" : "Mark VII"} unlocked.** Replay the case with less help from ${MENTOR} - that's how it sticks.`} />}
        </div>
      )}
    </div>
  );
}
