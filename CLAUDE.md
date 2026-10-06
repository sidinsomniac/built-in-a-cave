# Built in a Cave: notes for Claude

An Iron Man–themed, client-only game for **machine coding**, **front-end system design** and **backend system design**, aimed at senior and lead interview readiness. **Read `docs/HANDOFF.md` first.** The design docs are `docs/GDD.md`, `docs/curriculum.md`, `docs/exercise-design.md` and `docs/story.md`.

## Keep the handoff current (required)
Update `docs/HANDOFF.md` in the **same commit** as any change to status, counts, formats, rules, commands or setup, and add a line to its change log (§9). Update this file when a standing rule changes.

## Rules that always apply
- **Hands-on only.** Every answer is built: code, a design graph, a blueprint, numbers, orderings or chips. **No essays and no speaking aloud.**
- **Visible correctness.** Every submission gets a zone (🟢 Optimal, 🔵 Solid, 🟡 Risky, 🔴 Failing) from `zones.ts`, and an itemised audit from `audit.ts`.
- **JARVIS never gives answers.** Before a pass, feedback is questions, pseudocode, flaw pointers or analogous examples; the reference design is revealed only after a pass.
- **Zero prior knowledge.** Hand-holding first, easy to hard. Cases climb Mark I → III → VII → the Brief.
- **AI engineering is out of scope.** No AI is needed anywhere: grading is deterministic.
- **Client-only.** MSW and mock-socket for realistic API and socket responses; a seeded simulation for designs. Never use `Math.random` or `Date.now` in the simulation or the tests.
- **Build one Phase at a time.** Script it in `docs/story.md`, then build its content, then validate, test, commit and push.
- The franchise lives in `src/lore/`. This is a personal, non-commercial fan project.

## Content traps
- Quote YAML values that contain `: `.
- No lecture example may solve a core challenge. No hint may contain a solution line of 12 characters or more, or name an exact required design setting.
- Every case needs `reference.design.json` (🟢 on every scenario) and `naive.design.json` (🔴). Add `alt-*.design.json` when another architecture is equally valid, so rubric checkers don't punish good alternatives.
