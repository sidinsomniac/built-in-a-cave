// The living HUD backdrop: a faint perspective grid, drifting particles and a slow
// radar sweep, hand-drawn on one canvas. Static (one frame) with reduced motion.
import { useEffect, useRef } from "react";

export function Backdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // Deterministic particles (no Math.random): a simple LCG.
    let seed = 42;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const dots = Array.from({ length: 70 }, () => ({ x: rand(), y: rand(), r: 0.4 + rand() * 1.4, v: 0.00004 + rand() * 0.00012, a: 0.15 + rand() * 0.45 }));
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    let raf = 0;
    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      // Perspective floor grid at the bottom of the screen.
      const horizon = h * 0.62;
      ctx.strokeStyle = "rgba(79, 216, 255, 0.07)";
      ctx.lineWidth = 1;
      for (let i = -14; i <= 14; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2 + i * 18, horizon);
        ctx.lineTo(w / 2 + i * w * 0.12, h);
        ctx.stroke();
      }
      const scroll = still ? 0 : (time / 4000) % 1;
      for (let k = 0; k < 12; k++) {
        const t = (k + scroll) / 12;
        const y = horizon + (h - horizon) * t * t;
        ctx.globalAlpha = t;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Drifting particles.
      for (const d of dots) {
        const y = ((d.y - (still ? 0 : time * d.v)) % 1 + 1) % 1;
        ctx.fillStyle = `rgba(155, 233, 255, ${d.a})`;
        ctx.beginPath();
        ctx.arc(d.x * w, y * h, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // A slow radar sweep in the top-right corner.
      const cx = w - 90;
      const cy = 110;
      ctx.strokeStyle = "rgba(79, 216, 255, 0.12)";
      for (const r of [30, 55, 80]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      const angle = still ? -0.6 : (time / 2600) % (Math.PI * 2);
      const grad = ctx.createConicGradient ? ctx.createConicGradient(angle, cx, cy) : null;
      if (grad) {
        grad.addColorStop(0, "rgba(79, 216, 255, 0.22)");
        grad.addColorStop(0.12, "rgba(79, 216, 255, 0)");
        grad.addColorStop(1, "rgba(79, 216, 255, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <>
      <canvas ref={ref} className="backdrop" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
    </>
  );
}
