import { useEffect, useState } from "react";
import { levelFor, useGame, xpForLevel } from "../engine/store";
import { GAME_NAME, titleFor } from "../lore/lore";
import { CaseView } from "./CaseView";
import { useScrollTop } from "./common";
import { Home } from "./Home";
import { Backdrop } from "./hud/Backdrop";
import { Boot } from "./hud/Boot";
import { LevelUp } from "./hud/LevelUp";
import { LessonView } from "./LessonView";

function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const on = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash.replace(/^#/, "");
}

export default function App() {
  const route = useRoute();
  useScrollTop(route);
  const xp = useGame((s) => s.xp);
  const level = levelFor(xp);
  const into = xp - xpForLevel(level);
  const span = xpForLevel(level + 1) - xpForLevel(level);
  const [, kind, id] = route.split("/");
  const pct = Math.round((into / span) * 100);
  const r = 16;
  const circ = 2 * Math.PI * r;
  return (
    <>
      <Backdrop />
      <Boot title={titleFor(level)} />
      <LevelUp level={level} />
      <div className="app">
        <header className="topbar">
          <a className="brand" href="#/">
            <i className="reactor" aria-hidden="true" /> BUILT IN A <span>CAVE</span>
          </a>
          <nav aria-label="Main">
            <a href="#/">Stark Industries</a>
          </nav>
          <div className="hud-stat">
            <svg className="xpring" viewBox="0 0 40 40" role="progressbar" aria-label="XP to next level" aria-valuenow={into} aria-valuemax={span}>
              <circle className="bg" cx="20" cy="20" r={r} />
              <circle className="fg" cx="20" cy="20" r={r} strokeDasharray={`${(pct / 100) * circ} ${circ}`} transform="rotate(-90 20 20)" />
              <text x="20" y="24" textAnchor="middle">{level}</text>
            </svg>
            <span title={`${xp} XP`} data-testid="level">
              LEVEL <b>{level}</b> · {titleFor(level)}
              <br />
              <span className="muted">{xp} XP · {span - into} to next</span>
            </span>
          </div>
        </header>
        <main>
          {kind === "lesson" && id ? <LessonView key={id} id={id} /> : kind === "case" && id ? <CaseView key={id} id={id} /> : <Home />}
        </main>
        <footer className="muted small" style={{ marginTop: 40 }}>
          {GAME_NAME} - a personal, non-commercial fan project. Not affiliated with Marvel or Disney.
        </footer>
      </div>
    </>
  );
}
