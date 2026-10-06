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
None yet: the engine isn't scaffolded. The planned commands are:

| Command | What it will do |
|---|---|
| `npm run dev` | Vite development server |
| `npm test` | Vitest: the simulation's determinism, zone maths, anti-pattern rules, the audit, saves |
| `npm run validate-content` | Proves every exercise and case: solutions pass, starters fail, hints don't leak, reference designs land 🟢 and naive ones 🔴 |
| `npm run build` | typecheck and production build |
| `npm run e2e` | Playwright; set `CHROMIUM_PATH` to use an installed Chrome |

## 4. Technology (planned)
- **The app:** Vite, React, TypeScript; zustand (persisted, versioned saves).
- **The editor and sandbox:**
  - CodeMirror; a sandboxed iframe; Sucrase for TS and JSX; React from a local bundle via an import map;
  - testing: @testing-library/dom, user-event, `@sinonjs/fake-timers` and axe-core;
  - mocks: MSW for `fetch` and mock-socket for WebSockets.
- **The canvas and simulation:**
  - `@xyflow/react` for the canvas;
  - a seeded discrete-event simulation in a Web Worker (`src/sim/`);
  - a deterministic front-end performance lab (`src/sim/perfLab.ts`).

## 5. Design documents
| Document | Contents |
|---|---|
| `docs/GDD.md` | Vision, world, cast, exercise types, zones and the audit, Mark levels, case stations, architecture, roadmap |
| `docs/curriculum.md` | All six Phases, lesson by lesson; every case with its hidden requirements, targets, rubric, deep dive and curveballs; the coverage check |
| `docs/exercise-design.md` | The authoring contract: lesson anatomy, the twist catalogue, file layout, every exercise format, `case.yaml`, zone maths, test helpers, traps |
| `docs/story.md` | The story bible: Phase 1 scripted scene by scene; Phases 2–6 in outline |

## 6. Status and what's next
**Built:** the design docs (Step 1).

**Next, in order:**
1. **Owner review** of the docs. Adjust the curriculum and story before any code.
2. **The engine slice:**
   - Scaffold Vite, React, TS and zustand.
   - The iframe runner and harness, with MSW.
   - The design table and the seeded simulation.
   - `zones.ts` and `audit.ts`.
   - The sequencer and the estimation bench.
   - The content loader and validator.
   - Content: one Phase 1 lesson (DNS and HTTP), one Workshop mission (debounce), and **the URL shortener case (B1)** at Mark I through every station.
   - Tests: Vitest and Playwright.
3. **Phase 1, The Cave**, built in batches; then Phases 2–6, one at a time.

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
| 2026-10-06 | Claude Code desktop session (planned from the Parseltongue session) | Repository created. Design docs written: GDD, curriculum (6 Phases, 11 front-end and 15 backend cases, coverage check), exercise-design, story (Phase 1 scripted), HANDOFF, CLAUDE.md, README. No code yet. |
