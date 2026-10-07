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
- **The lesson comes first; the story seasons it.** Rich scenes with subtext, a mid-lesson beat and an outro, but at most 25 words a line (40 for the narrator), everyday words, and every all-caps term in `content/glossary.yaml`. Rules: `docs/story.md`.
- **Teach before you test.** Assume zero prior knowledge: a plain explanation, a worked example and a checkpoint before any exercise needs an idea. Design tables get a guided build (`steps:`) at Mark I, and every component has a Field Manual page.
- **Scaffold comments fade, difficulty climbs.** Warm-up starters get guiding-question comments, cores an outline plus the twist, and outstandings only the goal. The ⭐ must be harder than the 🔥, and every lesson concept must be practised (`covers:`). Rules: `docs/exercise-design.md` §2.
- **Build one Phase at a time.** Script it in `docs/story.md`, then build its content, then validate, test, commit and push.
- **The look is the JARVIS HUD** (GDD §11): cyan holographic panels, gold highlights, and red only for alerts. Motion is hand-made in CSS, SVG or Canvas, with no animation library, and **every animation honours `prefers-reduced-motion`**.
- The franchise lives in `src/lore/`. This is a personal, non-commercial fan project.

## Before every push
```bash
npm run validate-content && npm test && npm run build && CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run e2e
```

## Content traps
- Quote YAML values that contain `: `, or that start with `*`, `&`, `!`, `%` or `@` (for example a `clue:` that opens with Markdown bold).
- No lecture example may solve a core challenge. No hint may contain a solution line of 12 characters or more, or name an exact required design setting.
- Every case needs a `reference` design (🟢 on every scenario and curveball) and a `naive` one (🔴). **Calibrate by running it**, never by guessing numbers. When another architecture is equally valid, make sure the rubric checkers accept it too.
- Diagram, checkpoint and scene blocks are YAML: never start a step with a quoted word.
- Two timers due at the same simulated millisecond fire in the order they were scheduled. When a test races a slow response against a newer request, leave a clear gap between them.
- The sandbox loads a classic IIFE script (`npm run build:sandbox`), never a module script, because of CORS from an opaque origin.
