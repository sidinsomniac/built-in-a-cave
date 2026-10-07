// The boot sequence: JARVIS comes online. Shown once per browser session, skippable,
// and never with reduced motion.
import { useEffect, useState } from "react";
import { MENTOR } from "../../lore/lore";

const KEY = "built-in-a-cave-booted";

function alreadyBooted(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1" || (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  } catch {
    return true;
  }
}

export function Boot({ title }: { title: string }) {
  const [show, setShow] = useState(() => !alreadyBooted());
  useEffect(() => {
    if (!show) return;
    const done = () => {
      setShow(false);
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        // private mode: the boot just shows again next time
      }
    };
    const t = setTimeout(done, 3100);
    const key = () => done();
    window.addEventListener("keydown", key);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", key);
    };
  }, [show]);
  if (!show) return null;
  return (
    <div
      className="boot"
      role="status"
      aria-label={`${MENTOR} online`}
      data-testid="boot"
      onClick={() => {
        setShow(false);
        try {
          sessionStorage.setItem(KEY, "1");
        } catch {
          // ignore
        }
      }}
    >
      <div className="boot-inner">
        <div className="big-reactor" />
        <ul className="boot-lines">
          <li>{MENTOR.split("").join(".")}. online</li>
          <li>Arc reactor output: 97%</li>
          <li>Loading Stark Industries systems...</li>
          <li>Welcome back. Suit: {title}</li>
        </ul>
        <span className="skip">Click or press any key to skip</span>
      </div>
    </div>
  );
}
