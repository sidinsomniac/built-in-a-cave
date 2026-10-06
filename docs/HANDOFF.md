# Built in a Cave: Handoff Guide

Everything needed to carry on building this game: in a new Claude session, on another machine, or with another tool.

> **Keep this guide current.** Whoever works on the project must update this file **in the same commit** as any change that affects it, and add a line to the change log in §9. That covers:
> - what's built, what's next, and counts;
> - formats, rules, commands and branch names.

## 1. What this is
An Iron Man–themed, client-only learning game. It takes a front-end developer from zero backend knowledge to passing senior and lead loops in **machine coding**, **front-end system design** and **backend system design**.

The core rules:
- **Every answer is hands-on**: code, a wired design, a blueprint, numbers, orderings, chips. No essays, no speaking aloud.
- **Every submission lands in a computed zone**: 🟢 Optimal, 🔵 Solid, 🟡 Risky or 🔴 Failing.
- **Rhodey's itemised audit** follows every submission.
- **JARVIS never hands over answers.**

**What the owner asked for, which future work must keep:**

| Request | Detail |
|---|---|
| Goal | Become a capable senior and engineering lead who passes system design and machine-coding interviews. AI engineering is **out of scope**. |
| Interaction | Immersive and hands-on: drag-and-wire canvases, real code, simulations. No speaking aloud and no long-paragraph answers. |
| Correctness | No single right answer, but a **visible zone and audit** for every answer. |
| Pace | Assume **no prior knowledge**; hand-holding first; easy to hard, as in Parseltongue Academy. |
| Scope | "Everything I need": see the coverage check in `docs/curriculum.md`. |
| Architecture | **Client-only.** MSW and mock-socket give realistic, repeatable API responses; a seeded simulation grades designs. An optional local Lab (`docker-compose`) may come later, but is never required. |
| Delivery | One Phase at a time: script it in `docs/story.md`, then build its content, then validate, test, commit and push. |

## 2. Where the code lives
| Item | Value |
|---|---|
| Local path | `~/Documents/personal_project/built-in-a-cave` |
| Branch | `main` |
| Remote | none yet. The owner will add a GitHub remote. |
| Sister project | Parseltongue Academy (`~/Documents/personal_project/python-learner`), whose patterns this copies |

## 3. Commands
| Command | What it does |
|---|---|
| `npm install` | Install dependencies (Node 20+). |
| `npm run dev` | Builds the sandbox runtime (`predev`), then starts Vite. |
| `npm run build:sandbox` | Builds `public/sandbox/sandbox.js`, the classic-script test harness the sandbox iframe loads. It runs automatically before `dev` and `build`. The file is git-ignored. |
| `npm test` | Vitest unit tests. **24** pass at the moment: the simulation, rules, zones, the station graders, the URL shortener calibration. |
| `npm run validate-content` | Proves every lesson, exercise and case in jsdom, using the real harness. **17** checks pass at the moment: 2 lessons, 6 exercises, 1 case with 7 stations. |
| `npm run build` | Sandbox, then typecheck (`tsc -b`), then the production build. |
| `npm run e2e` | Playwright: builds, then serves on port 4174. On a Mac with Chrome, set `CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. **4** pass at the moment, including the URL shortener case played end to end. |

Before every push, run all four: `npm run validate-content && npm test && npm run build && npm run e2e`.

## 4. Technology (as built)
- **The app:** Vite 8, React 19, TypeScript 7, zustand 5 (a persisted, versioned save: `built-in-a-cave-save`, `SAVE_VERSION = 1`, `detectSaveVersion`, 3 rolling backups in `built-in-a-cave-backups`).
- **Code missions** (`src/runtime/`):
  - `harness.ts` compiles the learner's TS/TSX with **Sucrase** into CommonJS, evaluates it with a tiny module system (React comes from the bundle), and runs the hidden tests.
  - **The test helpers:**
    - `test`, `check(cond, question)`, `load(file)`, `spy()`;
    - `useFakeTimers()` (from `@sinonjs/fake-timers`), `user()` (user-event), `render()`, `screen`, `within` and `waitFor`;
    - `api.calls()`, and `axe()`.
  - Tests stop at the first failure.
  - **The fetch mock is built in.** An exercise's `mocks:` routes (method, path, query, status, delay, json) replace `window.fetch` inside the harness. **This replaces MSW**, because a sandboxed iframe can't register a service worker. Other mocks (abort support, per-call delays) work the same way.
  - **The sandbox** is `public/sandbox.html` with `sandbox="allow-scripts"` (an opaque origin, so it can't reach the game or its saves). It loads a **classic IIFE script** (`public/sandbox/sandbox.js`): **module scripts would need CORS headers from every host**, which is why the original multi-page module build was dropped.
  - `sandboxClient.ts` runs each mission in a fresh iframe with a 15-second timeout.
- **The design table:**
  - `@xyflow/react`, with button controls for every action (add, connect, configure, remove), so it works from the keyboard and in e2e tests.
  - Page scroll isn't hijacked: zoom with the controls or a pinch.
- **The simulation** (`src/sim/engine.ts`):
  - A **deterministic, time-stepped flow model**, with no randomness at all.
  - Each simulated second, every traffic class flows through the wired graph:
    - load past capacity becomes errors;
    - load near capacity becomes queueing latency (`p99 = base × (1.5 + 3ρ/(1−ρ))`);
    - cache hit ratios come from memory ÷ working set;
    - a hot key lands on one partition;
    - failures are `kill` or `restart` (a cold cache, then a stampede);
    - queues and workers carry side-effect events, with backlog tracking.
  - It runs on the main thread (it's fast); a Web Worker is unnecessary for now.
- **Grading:**
  - `src/engine/zones.ts` (target margins, rubric bands, penalties, estimate ratios, sequence order, coverage);
  - `src/sim/rules.ts` (anti-pattern rules and rubric checkers over the design graph);
  - `src/engine/audit.ts` (Rhodey's itemised report);
  - `src/engine/stations.ts` (the interrogate, estimate, desk and assembly graders, plus the scratch calculator).

## 5. Design documents
| Document | Contents |
|---|---|
| `docs/GDD.md` | Vision, world, cast, exercise types, zones and the audit, Mark levels, case stations, architecture, roadmap |
| `docs/curriculum.md` | All six Phases, lesson by lesson; every case with its hidden requirements, targets, rubric, deep dive and curveballs; the coverage check |
| `docs/exercise-design.md` | The authoring contract: lesson anatomy, the twist catalogue, file layout, every exercise format, `case.yaml`, zone maths, test helpers, traps |
| `docs/story.md` | The story bible: Phase 1 scripted scene by scene; Phases 2–6 in outline |

## 6. Status and what's next
**Built (the engine slice):**
- The code runner and sandbox, the fetch mock, fake timers, axe.
- The design table, the simulation, the anti-pattern rules and rubric checkers.
- Zones and Rhodey's audit for **every** exercise type.
- Saves with backups; story pop-ups; JARVIS's hint ladder; XP and suit-Mark titles.
- **Content:**
  - Phase 1, lesson 3 (DNS): a sequencer, a prediction, an estimate.
  - Phase 2, lesson 3, part 1 (debounce and throttle): two code missions and a prediction.
  - **Case B1, the URL shortener:** all seven stations, at Mark I, III and VII.
- The validator proves all of it (reference designs land 🟢, naive ones 🔴, solutions pass, starters fail, no hint leaks, diagram and checkpoint YAML parses).

**Not built yet:**
- **The Brief:** a timed, blank-canvas trial mode.
- **The front-end blueprint and performance lab**, needed by Phase 4.
- **Incident drills and spot-the-flaw.**
- **Rhodey's code-review rules** for code missions.
- **Mock WebSockets** (mock-socket), for Phase 2, lesson 15.
- **The Time Vault** (spaced repetition) and **Sparring.**
- **The Readiness meter, the Stark Expo shop, unlocking rules** (everything is open for now), and the remaining lessons and cases.

**Next, in order:**
1. **Owner playtest** of the slice: the DNS lesson, the debounce mission, and the URL shortener at Mark I.
2. **Phase 1, The Cave, in batches.** Script the remaining scenes in `story.md` (already scripted), then build lessons 1–13, R1–R3 and the Trial.
3. **Phase 2, The Workshop.** Add mock-socket and Rhodey's code-review rules first.
4. **Phase 3:** add the component models it needs (CDN edge logic is there; add read replicas for SQL and an SSE/WebSocket gateway).
5. **Phase 4:** build the blueprint and performance lab first.
6. Then **Phases 5 and 6**, with the Brief, incident drills and spot-the-flaw.

## 7. Rules that always apply
- The mentor never gives answers; feedback is questions, pseudocode, flaw pointers or analogous examples.
- Every exercise is hands-on, deterministic and graded into a zone, with an audit.
- No lecture example may solve a core challenge; no hint may leak a solution line or a required setting.
- The simulation and tests are seeded: no `Math.random` and no `Date.now`.
- The franchise lives in `src/lore/`.

## 8. Commit conventions
- Clear messages that describe what changed for the player.
- Before every push (once the engine exists): `npm run validate-content && npm test && npm run build && npm run e2e`.

## 9. Change log
Newest first. One line per session or meaningful change: the date, where, and what changed.

| Date | Where | What changed |
|---|---|---|
| 2026-10-06 | Claude Code desktop session | **The engine slice.** Scaffolded Vite, React, TS, zustand, Vitest, Playwright. Built the harness (Sucrase, the fetch mock, fake timers, axe) and a sandbox iframe loading a classic IIFE script (module scripts fail CORS from an opaque origin). Built the deterministic flow simulation, the anti-pattern rules and rubric checkers, zones, the audit and the station graders, plus saves with backups, the design table (`@xyflow/react`), lessons and the case view. Content: the DNS lesson, the debounce and throttle lesson, case B1 (URL shortener) through 7 stations. Counts: 24 unit, 17 content checks, 4 e2e (§3, §4, §6, §10). |
| 2026-10-06 | Claude Code desktop session (planned from the Parseltongue session) | Repository created. Design docs written: GDD, curriculum (6 Phases, 11 front-end and 15 backend cases, coverage check), exercise-design, story (Phase 1 scripted), HANDOFF, CLAUDE.md, README. No code yet. |

## 10. Traps learned the hard way
1. **Diagram and checkpoint blocks are YAML.** A step that starts with a quoted word (`- "l" at 0 ms`) is invalid. Rephrase it so it doesn't start with a quote (`- Typed "l" at 0 ms`). The validator now parses every block, and the lecture renderer shows a broken block as a warning instead of crashing.
2. **Hints leak through analogous examples.** A shared line like `while (n > 0) {` counts as a solution line. Write the analogy differently (recursion, `for (;;)`, other variable names).
3. **The sandbox must load a classic script.** A `sandbox="allow-scripts"` iframe has origin `null`, so `<script type="module">` from the same host is blocked by CORS.
4. **`useEffect(() => window.scrollTo(...))` returns a value** in some embedded browsers. Always put braces around effect bodies.
5. **Calibrate every case by running it.**
   - The reference design must land 🟢 with margin.
   - The naive design must land 🔴.
   - A design that is "almost there" (no cache, no headroom) should land 🔵 or 🟡.
   - When most requests fail, the simulation reports p99 as "never answers" (10,000 ms), so a broken design can't look fast.
6. **A mixture's p99 is set by its slowest branch above 1%.** A cache with a 3% miss rate doesn't improve p99 at light load. That's realistic and worth teaching. A cache wins when the store is under pressure.
