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
| `npm test` | Vitest unit tests. **42** pass at the moment: the simulation, rules, zones, the station graders, the URL shortener calibration, the guided build (a beginner's step-by-step progression), load balancer health checks, load readouts, the reference comparison and the glossary linker, and the briefing, quiz and trade-off graders. |
| `npm run validate-content` | Proves every lesson, exercise and case in jsdom, using the real harness. **72** checks pass at the moment: 12 lessons and 36 exercises (Phase 1 lessons 1–5 and Briefing Room I, the Phase 2 debounce lesson, and the five Phase 3 basics), 1 case with 8 stations (a parts briefing, then the 7 interview stations, including the guided build), 3 Phase intros, and a Field Manual page for each of the 10 components. The validator also enforces the writing rules (line length, glossary jargon, an outro on every lesson), scaffold comments by tier, the difficulty ramp and concept coverage. |
| `npm run build` | Sandbox, then typecheck (`tsc -b`), then the production build. |
| `npm run e2e` | Playwright: builds, then serves on port 4174. On a Mac with Chrome, set `CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`. **7** pass at the moment: the boot sequence and typed story (with motion), the home screen, a lesson, a code mission, the new formats (a quiz, a guided design table in a lesson, a trade-off), the skippable briefing once the Phase 3 basics are passed (from a seeded save), and the URL shortener case played end to end through JARVIS's guided build, with sizes that differ from the reference. Tests run with `reducedMotion: "reduce"` by default (`playwright.config.ts`). |

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
- **The look (the JARVIS HUD):** see GDD §11, *The look*. It covers the palette and fonts (`@fontsource`, self-hosted), the Canvas backdrop (`src/ui/hud/`), the boot sequence, typed comms-window scenes, the spinning gauge, stamped audits, the level-up toast, packet-flow wires and the replay scrubber. Everything honours `prefers-reduced-motion`. Lesson outros show under the clue once the required exercises pass.
- **The design table:**
  - `@xyflow/react`, with button controls for every action (add, connect, configure, remove), so it works from the keyboard and in e2e tests.
  - Page scroll isn't hijacked: zoom with the controls or a pinch. The canvas re-frames itself when a box is added, and new boxes land in free space.
  - **Load readouts:** after a run, every box shows a load bar ("asked for / can do"), and the inspector explains the sizing (`1 partition × 2 copies × 10,000 reads/s`, hot keys, writes, cache hit rate). The report lists the hottest parts. The numbers come from `SimResult.nodeLoad`.
  - **The Field Manual** (`content/manual.yaml`, opened from ⓘ in the palette or the inspector): one plain-words page per component, covering what it is, an analogy, when to use it, capacity, cost, how it fails, and its settings. The validator checks that every page quotes the simulation's real capacities.
  - **The guided build** (`steps:` on a design station; `src/engine/steps.ts`; `src/ui/GuidedSteps.tsx`). One objective at a time, each with a short lesson and an optional question (a choice, or a number the calculator accepts as a sum). Steps tick from checks on the player's own design: `ran`, `has`, `clear` (a rule), `rubric` (a checker), `survives` (a scenario with every part under `max` load). The full lesson shows at Mark I, a checklist at Mark III, and nothing at Mark VII.
  - **The glossary** (`content/glossary.yaml`, `src/engine/glossary.ts`): the first use of each term in a lecture, guide, step or task gets a dotted underline and a plain definition on hover or tap. Lectures may hold ` ```scene ` blocks, which are mid-lesson story beats.
  - **The parts briefing** (a `briefing` station, Mark I only): one card per component the case uses, made from its Field Manual page, with one question each. Getting every card right first time is 🟢. A case's `requires:` lists the lessons that teach its parts; once they're all passed, the briefing becomes a skippable recap. B1's `requires` is empty until the Phase 3 basics exist.
  - **Lesson exercise formats:**
    - `sequence`, `predict` and `estimate`;
    - `code`;
    - **`quiz`:** several quick scenario questions. All right is 🟢, 80% is 🔵, 60% is 🟡.
    - **`tradeoff`:** make the call, then tick the reasons. A wrong call is 🔴. The right call with a wrong reason ticked is 🟡, and with a right reason missed it's 🔵.
    - **`design`:** a design table in a lesson, with its own scenarios and guided `steps:`. The player's work is saved under `benches` in the save, a new optional field with a default, so no version bump.
    - The shared `src/ui/DesignBench.tsx` runs both lesson design exercises and case design stations.
  - **After a pass,** Rhodey's reference opens as "one of many designs that pass", with a part-by-part comparison (`src/engine/compare.ts`).
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
  - **Phase 1, lessons 1–5 and Briefing Room I:**
    - Clients and Servers: a sequence, a "who does the work?" quiz, and a guided design table ⭐ that must survive opening hour.
    - IP, Packets and Ports: a sequence, an edge-case quiz, and a packet estimate.
    - DNS: a sequence, a prediction, and an estimate.
    - TCP and UDP: a sequence, a transport quiz, and a round-trip estimate.
    - TLS and HTTPS: a sequence, a certificate-chain quiz, and a TLS-termination trade-off ⭐.
    - Briefing Room I: the full timeline, a "what breaks" quiz, and a latency budget.
    - The story runs from the blackout to "Hammer's contractor".
  - **Phase 3, the basics B1 relies on** (*Extremis*, with Aldrich Killian joining the cast):
    - 1, One Server and Its Limits: push one server until it breaks (design); the 90% trap (quiz); size the tower for its worst night (estimate).
    - 3, Load Balancers: where requests go (quiz); a dead copy with no health checks (design); layer 4 vs layer 7 for WebSockets (trade-off).
    - 4, Caching part 1: put a cache in front of the database (design); how long can it be stale? (quiz); memory for the hot links (estimate).
    - 6, Databases part 1, choosing a store: a home for every kind of data (quiz); model the Expo in SQL (quiz); key-value or SQL for the links (trade-off).
    - 9, Queues and Workers: stop waiting on email (design); the alert storm (design); queue or log (trade-off).
    - The story ends on the first whisper of Ultron: a worker named "U".
    - B1's `requires:` lists these five lessons.
  - Phase 2, lesson 3, part 1 (debounce and throttle): three code missions (a debounce, a throttle that never drops the last call, and a race-safe debounced search).
  - **Case B1, the URL shortener:** a parts briefing (Mark I), then all seven stations, at Mark I, III and VII.
- The validator proves all of it (reference designs land 🟢, naive ones 🔴, solutions pass, starters fail, no hint leaks, diagram and checkpoint YAML parses).

**Not built yet:**
- **The Brief:** a timed, blank-canvas trial mode.
- **The front-end blueprint and performance lab**, needed by Phase 4.
- **Incident drills and spot-the-flaw.**
- **Rhodey's code-review rules** for code missions.
- **Mock WebSockets** (mock-socket), for Phase 2, lesson 15.
- **The Time Vault** (spaced repetition) and **Sparring.**
- **The Readiness meter, the Stark Expo shop, unlocking rules** (everything is open for now), and the remaining lessons and cases.

**Playtest feedback (2026-10-08), being worked through in order:**
1. ✅ **Teach the design table:** the guided build, load readouts, the Field Manual, and the reference shown as one answer among many.
2. ✅ **Plain words and a richer story:** a glossary with term tooltips, writing rules (enforced), re-voiced scenes, mid-lesson beats and outros. **Scaffold comments and the difficulty ramp:** enforced by tier. The debounce ⭐ is now a race-safe search box (code), replacing the timeline prediction, which became a review card.
3. ✅ **The JARVIS HUD look:** cyan holographic panels, a Canvas backdrop, the boot sequence, typed scenes, gauge and audit motion, the level-up toast, packets flowing through the design table, and a replay scrubber.
4. ✅ **A parts briefing** before B1 (Mark I), which becomes a skippable recap once the Phase 3 basics are passed.
5. ✅ **Phase 1, lessons 1–5 and Briefing Room I** (beats scripted in `story.md` first).
6. ✅ **The Phase 3 basics** that B1 relies on (one server, load balancers, caching part 1, choosing a store, queues), with B1's `requires:` set.

**After that, in order:**
1. **Owner playtest** of the reworked slice: Phase 1 from the start, then Phase 3, then the URL shortener at Mark I.
2. **Phase 1, The Cave:** the rest of the lessons (6–13), R2–R3 and the Trial.
3. **Phase 2, The Workshop.** Add mock-socket and Rhodey's code-review rules first.
4. **The rest of Phase 3** (2, 4 part 2, 5, 6 parts 2–3, 7, 8, 10–16, R1–R3, the Trial): add the component models it needs (CDN edge logic is there; add read replicas for SQL and an SSE/WebSocket gateway).
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
| 2026-10-08 | Claude Code desktop session | **The Phase 3 basics:** lessons 1, 3, 4 part 1, 6 part 1 and 9, with the beats scripted in `story.md` first, and Killian added to the cast. The simulation now models load balancer health checks (with the `no_health_checks` rule), and the cache readout explains short TTLs. Added a `healthy` step check (error rate and backlog), and set B1's `requires:`. Counts: 42 unit, 72 content checks, 7 e2e (§3, §4, §6, §10). |
| 2026-10-08 | Claude Code desktop session | **Phase 1, batch 1:** lessons 1, 2, 4 and 5, and Briefing Room I, with the beats scripted in `story.md` first. **New formats:** `quiz`, `tradeoff`, and `design` inside lessons (the shared `DesignBench`, and `benches` in the save). Added networking glossary terms. The Notes tab hides when a lesson has none. Counts: 41 unit, 51 content checks, 6 e2e (§3, §4, §6). |
| 2026-10-08 | Claude Code desktop session | **The parts briefing.** Added a new `briefing` station kind (Mark I only), with Field Manual cards and one question per part, graded by first-try answers. Added a case-level `requires:` that turns the briefing into a skippable recap once those lessons are passed. B1 now opens with six parts. Counts: 39 unit, 31 content checks (§3, §4, §6). |
| 2026-10-08 | Claude Code desktop session | **The JARVIS HUD.** A new stylesheet (cyan holographic panels, Rajdhani and JetBrains Mono via `@fontsource`), a Canvas backdrop, the boot sequence, comms-window scenes that type out, gauge spin-up, stamped audits, a level-up toast and an XP ring. Packet-flow edges on the design table, a replay scrubber, and lesson outros under the clue. The e2e tests default to reduced motion; one new test covers the boot and typing. Counts: 5 e2e (§3, §4, §6). |
| 2026-10-08 | Claude Code desktop session | **Plain words, richer story, scaffolds and the ramp.** Added the glossary with term tooltips; ` ```scene ` beats in lectures; writing rules in `story.md`, enforced by the validator (25 words a line, glossary jargon, an outro on every lesson); scaffold comments by tier; the ramp (tier order, test counts); concept coverage (`covers:`). Re-voiced the Phase 1 and 2 intros, the DNS and debounce lessons, and B1's scene. The debounce ⭐ is now a race-safe search box. Removed Parseltongue leftovers ("lumos", "spell"). Counts: 37 unit, 30 content checks (§3, §4, §6). |
| 2026-10-08 | Claude Code desktop session | **Teach the design table** (from the owner's playtest: "how would the player know what to do?"). Added JARVIS's guided build to B1 (8 steps, each with a lesson, a question and checks on the player's own design); load readouts on every box (`nodeLoad`); the hottest-parts list; the Field Manual (`content/manual.yaml`); the reference shown as one of many passing designs, with a comparison. Workers now show their load. New boxes land in free space, and the canvas re-frames as it grows. Counts: 31 unit, 27 content checks, 4 e2e (§3, §4, §6, §10). |
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
7. **Two siblings with the same React `key` leave stale elements on screen.** The guided steps once rendered the question and the status line both keyed by the step id, and old questions piled up. Give every sibling its own key.
8. **Calibrate guided steps against the simulation's real numbers.** Link creation adds 40 requests/s, so "4,000 ÷ 1,000 = 4 copies" lands at 101%. Numeric questions accept answers within 25% either way (`numberClose`), and the `survives` check uses the real load, so the readout teaches the last step. `src/engine/steps.test.ts` replays a beginner's build step by step; extend it for every new guided build.
9. **Simultaneous fake timers fire in the order they were scheduled.** A stale-response test once had the old answer and the new request both due at 500 ms, so the "old" answer landed first and was legitimately shown. Leave clear gaps between racing events.
10. **Translucent panels over an animated backdrop look like noise behind text.** Give every panel an opaque base (`rgba(3, 10, 17, 0.92)`) under its glow gradient.
11. **A YAML value that starts with `*` is an alias, so quote it.** A `clue: **99% of reads...**` line broke the whole content load. The same applies to `&`, `!`, `%`, `@` and a leading backtick.
