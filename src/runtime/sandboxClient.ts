// Runs a mission in a fresh, sandboxed iframe, with a hard timeout.
// A runaway loop can't freeze the game: the iframe is simply thrown away.
import type { Mission, RunResult } from "./harness";

export const RUN_TIMEOUT_MS = 15_000;

let nextId = 1;

export function runInSandbox(mission: Mission, timeoutMs = RUN_TIMEOUT_MS): Promise<RunResult & { timedOut?: boolean }> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.title = "Workshop sandbox";
    frame.style.cssText = "position:absolute;width:800px;height:600px;left:-10000px;top:0;border:0";
    frame.src = `${import.meta.env.BASE_URL}sandbox.html`;
    const id = nextId++;
    const done = () => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      frame.remove();
    };
    const timer = setTimeout(() => {
      done();
      resolve({ passed: 0, total: 0, tests: [{ name: "timeout", passed: false, kind: "timeout", message: "Your code ran for too long. Is there a loop that never ends, or a promise that never settles?" }], timedOut: true });
    }, timeoutMs);
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow) return;
      const data = event.data as { type: string; id?: number; result?: RunResult; message?: string };
      if (data.type === "ready") frame.contentWindow!.postMessage({ type: "run", id, mission }, "*");
      else if (data.type === "result" && data.id === id) {
        done();
        resolve(data.result!);
      } else if (data.type === "error" && data.id === id) {
        done();
        reject(new Error(data.message));
      }
    };
    window.addEventListener("message", onMessage);
    document.body.appendChild(frame);
  });
}
