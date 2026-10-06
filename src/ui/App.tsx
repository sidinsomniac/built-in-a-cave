import { useEffect, useState } from "react";
import { levelFor, useGame, xpForLevel } from "../engine/store";
import { GAME_NAME, titleFor } from "../lore/lore";
import { CaseView } from "./CaseView";
import { useScrollTop } from "./common";
import { Home } from "./Home";
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
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/">
          ⚙️ BUILT IN A <span>CAVE</span>
        </a>
        <nav aria-label="Main">
          <a href="#/">Stark Industries</a>
        </nav>
        <span className="badge" title={`${xp} XP`} data-testid="level">
          Level {level} · {titleFor(level)}
        </span>
        <div className="xpbar" role="progressbar" aria-label="XP to next level" aria-valuenow={into} aria-valuemax={span}>
          <i style={{ width: `${Math.round((into / span) * 100)}%` }} />
        </div>
      </header>
      <main>
        {kind === "lesson" && id ? <LessonView key={id} id={id} /> : kind === "case" && id ? <CaseView key={id} id={id} /> : <Home />}
      </main>
      <footer className="muted small" style={{ marginTop: 40 }}>
        {GAME_NAME} - a personal, non-commercial fan project. Not affiliated with Marvel or Disney.
      </footer>
    </div>
  );
}
