// The sandbox iframe: receives a mission, runs it against its tests, and reports back.
// It runs with sandbox="allow-scripts" and no same-origin access, so the learner's
// code can't touch the game, its saves, or anything else.
import { runMission, type Mission } from "../harness";

window.addEventListener("message", async (event: MessageEvent<{ type: string; id: number; mission: Mission }>) => {
  if (event.data?.type !== "run") return;
  const { id, mission } = event.data;
  try {
    const result = await runMission(mission);
    parent.postMessage({ type: "result", id, result }, "*");
  } catch (err) {
    parent.postMessage({ type: "error", id, message: String(err) }, "*");
  }
});
parent.postMessage({ type: "ready" }, "*");
