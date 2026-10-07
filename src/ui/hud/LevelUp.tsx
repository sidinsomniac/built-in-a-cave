// The "suit up" flourish when the player reaches a new level.
import { useEffect, useRef, useState } from "react";
import { titleFor } from "../../lore/lore";

export function LevelUp({ level }: { level: number }) {
  const previous = useRef(level);
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (level > previous.current) {
      setShown(level);
      const t = setTimeout(() => setShown(null), 3300);
      previous.current = level;
      return () => clearTimeout(t);
    }
    previous.current = level;
  }, [level]);
  if (shown === null) return null;
  return (
    <div className="levelup" role="status" data-testid="levelup">
      <div className="t1">Suit upgrade · Level {shown}</div>
      <div className="t2">{titleFor(shown)}</div>
    </div>
  );
}
