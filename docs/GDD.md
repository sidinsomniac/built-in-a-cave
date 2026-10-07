# Game Design Document: Built in a Cave

*An Iron Man–themed game that takes a front-end developer from "how does a request reach a server?" to passing senior and engineering-lead loops in **machine coding**, **front-end system design** and **backend system design**.*

> This is a personal, non-commercial fan project. Marvel characters appear as a cast; every lesson, case and line of dialogue is original. All franchise references live in `src/lore/` so they can be swapped out in one place.

---

## 1. Vision

**One sentence:** every system design and machine-coding question a senior or lead loop can ask, practised hands-on, graded visibly, from zero knowledge to a blank-canvas mock.

**The defining rules:**
1. **Hands-on, always.** No speaking aloud, and no essays or long written answers. Every answer is *built*: code, a wired architecture, a component blueprint, a schema, a number, an ordered sequence, or chips dragged into place.
2. **Visible correctness, even without a single right answer.** Every submission lands in a computed **zone**, with an itemised **audit**. You always know where you stand and why.
3. **JARVIS never gives the answer.** Before you pass, feedback is guiding questions, pseudocode, pointers to the flaw, or similar-but-different examples. After you pass, the reference design is revealed for comparison.
4. **Hand-holding that fades.** It starts with zero assumed knowledge. Every topic climbs from easy to hard, and the support level falls as you prove yourself.
5. **Immersion with a purpose.** The story is seasoning: 2–6 lines a beat. Every beat ends with a reason to build.

**Constraints:**
- **Client-only web app.** Vite, React, TypeScript and zustand. No server and no accounts. Progress lives in localStorage, with automatic backups.
- **Deterministic.** Grading never depends on a network, a clock or an AI. The same answer always gets the same zone. (The simulation has no randomness at all; it's a time-stepped flow model, see `docs/HANDOFF.md` §4.)
- **Audience:** a single learner, an experienced front-end developer, with no backend or distributed-systems background assumed.

## 2. The world

You join **Stark Industries** as a new engineer. The company runs on software: the suits' heads-up display, the Stark Expo app, the S.H.I.E.L.D. briefing network, the Helicarrier's systems. Every Phase, something breaks at scale, and only well-designed systems can fix it.

| Game concept | Engineering meaning |
|---|---|
| Suits (Mark I, III, VII...) | the support level you're working at: guided, assisted, solo |
| The workshop | the code editor and test harness |
| The design table | the drag-and-wire architecture canvas |
| The blueprint table | the front-end component and data-flow canvas |
| The Arc Reactor gauge | the correctness zone of an answer |
| Rhodey's audit | the itemised review after every submission |
| Happy's pager | incident drills |
| The Brief | a timed, blank-canvas interview round |
| Infinity Stones | the six trade-off dimensions (§5) |

## 3. The cast

| Character | Role in the game | Typical line |
|---|---|---|
| **JARVIS** | The mentor. Speaks only in questions and hints. | "Sir, what happens to this cache when every key expires in the same second?" |
| **Tony Stark** | The player's boss and showman. Sets the challenge, demands elegance. | "It works. Now make it work at a million." |
| **Pepper Potts** | The product manager. Holds the hidden requirements; reveals them only when asked the right question. | "Did anyone ask me whether it needs to work offline?" |
| **Nick Fury** | The interviewer. Curveballs, scale-ups, "what breaks first?" | "Your region just went dark. Talk to me." |
| **Rhodey** | The auditor (the Snape role). Dry, exact, fair. | "Single database, no replica. Brave. Not in a good way." |
| **Happy Hogan** | Incidents and pages. Panics so you don't have to. | "It's down. Everything's down. Is it DNS? It's always DNS." |
| **Peter Parker** | Asks the junior question the learner might be too shy to ask. | "Wait, why can't we just add more servers?" |
| **Shuri** | Front-end performance and craft; the Wakandan tech lab. | "Your page paints in four seconds. In Wakanda we call that a slideshow." |
| **Ultron** | The villain: architecture that seems clever and collapses at scale. | "Every request through one brain. What could go wrong?" |

## 4. Exercise types (all hands-on)

| Type | The learner... | Graded by |
|---|---|---|
| **Code mission** | writes JS, TS or React in the editor; it runs in a sandboxed iframe | hidden tests (Testing Library, user-event, fake timers), axe accessibility checks, Rhodey's code rules |
| **Design table** | drags components onto a canvas, wires them, and sets replicas, TTLs, partitions, consistency and timeouts | a deterministic traffic and incident simulation against targets, plus the rubric and anti-pattern rules |
| **Front-end blueprint** | builds a component tree and data flow, places state (local, global or server cache), and chooses a rendering strategy per route, plus chunking, image and data-loading options | a deterministic performance lab (page-speed budgets and bundle size), plus the rubric and anti-pattern rules |
| **Sequencer** | drags steps into order (DNS resolution, a TLS handshake, the render pipeline, an incident runbook) | exact order, or accepted orderings |
| **Predict** | chooses what happens next (event-loop output, which component re-renders, which response wins a race) | exact answer |
| **Estimation bench** | fills in requests per second, storage and bandwidth on a scratch calculator with unit helpers | tolerance zones (for example, within 2× is 🟢, within 10× is 🟡) |
| **Data and API desk** | builds entities, fields, indexes, normalised client state, and endpoints (method, path, pagination, idempotency, events) in structured editors | the schema and contract rules |
| **Interrogate Pepper** | chooses clarifying questions from a pool, against a time budget | the hidden requirements uncovered; wasted questions cost minutes |
| **Trade-off board** | places options on axes, or picks an option plus its reasons from a fixed set | the choice and the reasons (a right choice for the wrong reason is 🟡) |
| **Answer assembly** | drags statement chips into the RADIO sections to build the final pitch; decoy chips hide anti-patterns | coverage of the must-haves, minus decoys used |
| **Incident drill** | the simulation is failing live: picks and orders actions against the clock | time to recover, the actions' side effects, the runbook order |
| **Spot the flaw** | reviews someone else's design and flags the problems on the canvas | flags matched against the planted flaws |

## 5. Zones and the audit

### 5.1 The Arc Reactor gauge
Every submission lands in one zone. Zones map to the familiar grades:

| Zone | Grade | Meaning |
|---|---|---|
| 🟢 **Optimal** | S | every target met with margin, every must-have covered, no anti-patterns |
| 🔵 **Solid** | A | targets met, the must-haves covered, at most minor gaps |
| 🟡 **Risky** | B | it works today but fails a curveball, or misses a must-have |
| 🔴 **Failing** | C, retry | a target missed, or a critical anti-pattern |

**How the zone is computed**, deterministically, by `src/engine/zones.ts`:
- **The simulation score:** each target (worst-case latency, error rate, availability, cost, and the LCP/INP/CLS budgets) scores 0–1 by margin.
- **The rubric score:** must-haves (weight 3), should-haves (weight 1), and bonus items.
- **Penalties:** anti-patterns are critical (they force 🔴) or major (they cap the zone at 🟡).
- **The zone** is the lower of the simulation band and the rubric band, after penalties.
- **Hints** used and time taken affect XP and the grade's ★ flourish, never the zone.

### 5.2 Rhodey's after-action audit
After every submission, a report lists each item:

- ✓ **Covered**: the requirement is met, or the target was hit with margin.
- ⚠ **Partial**: met, but thin (for example, the cache has a TTL but no stampede protection).
- ✗ **Missing**: a must-have is absent.
- ☠ **Anti-pattern**: a known failure design.

Each item is tagged with its **Infinity Stone**:

| Stone | Dimension |
|---|---|
| ⏱ Time | latency |
| 🌌 Space | scale and storage |
| 🔮 Reality | consistency and correctness |
| 💪 Power | throughput |
| 🧠 Mind | observability |
| 💎 Soul | security and privacy |

- **Before a pass**, ✗ and ☠ items appear as JARVIS's questions ("What stops two payments from charging twice?").
- **After a pass**, the audit adds the **reference design** side by side with yours, the differences highlighted, and a line on why each matters in an interview.

### 5.3 Anti-pattern detectors
These are rules over the design graph, like Parseltongue's Snape rules. Each case switches on the rules its lessons have taught. Examples:
- a single point of failure on a critical path;
- a database queried on a field with no index;
- a cache with no TTL or invalidation strategy;
- a synchronous call to a slow third party inside the request path;
- payments or orders with no idempotency key;
- offset pagination on an infinite feed;
- polling where push is required (or push where polling is enough);
- a hot shard key (timestamp, celebrity user id);
- unbounded fan-out on write for celebrity accounts;
- no backpressure between a fast producer and a slow consumer;
- secrets or personal data in client storage;
- on the front end:
  - layout shift from images without dimensions;
  - unvirtualised long lists;
  - global state for server data;
  - a render-blocking third party.

## 6. Hand-holding that fades: the Mark levels
Every case is replayable at a falling support level:

| Level | What you get |
|---|---|
| **Mark I (guided)** | JARVIS walks every station, explaining as he goes. Part of the design is pre-built, hints are free, and stations unlock one at a time. On the design table, a **guided build** breaks the design into small objectives. Each one has a short lesson, a question and a live check on the player's own design. |
| **Mark III (assisted)** | The stations are laid out, with a skeleton design and the guided build as a bare checklist; hints cost a little XP. |
| **Mark VII (solo)** | The stations only, nothing pre-built; the full hint ladder at full cost. |
| **The Brief (trial)** | A blank canvas, no hints, and **time boxes per RADIO step** (for example, Requirements 5 minutes, Estimation 5, Architecture 15, Data and API 10, Deep dives and Optimisations 10). It builds interview pacing through the same hands-on stations. |

A case's first appearance is always Mark I. Its replays, and later cases, move up the ladder.

At every level, the design table **shows its working**:
- every box gets a load bar after a run ("asked for 12,120 requests/s · can do 5,000");
- the **Field Manual** explains every component in plain words;
- after a pass, Rhodey's reference appears as *one of many* designs that pass, compared part by part with the player's.

## 7. The case mission (system design rounds)
Each classic problem is played as stations that mirror a real 45–60 minute round:

0. **The parts briefing** (Mark I only, until the matching lessons are passed). One Field Manual card per component the case uses, each with one question.
1. **Interrogate Pepper** (Requirements). Functional and non-functional requirements; the scale and latency targets are revealed.
2. **Estimation bench.** Requests per second, the read/write ratio, storage, bandwidth.
3. **Design table** (backend) or **blueprint table** (front end) (Architecture). Built, then simulated.
4. **Data and API desk** (Data model, Interface).
5. **Deep-dive workshop.** A code mission for the hardest part (an OT transform, a masonry layout, bitrate switching, a token bucket).
6. **Fury's curveballs.** Incidents injected on *your* design; patch it and re-run.
7. **Answer assembly.** Drag chips into the RADIO sections to build the pitch, then see the audit and the reference comparison. The key points become spaced-repetition cards.

## 8. Lessons (non-case)
These have the same shape as Parseltongue:
1. A story beat (2–6 lines).
2. A lecture with **interactive diagrams** (animated request flows, a step-through event loop, a scrubbable render pipeline) and inline checkpoints.
3. 🌱 Warm-up (guided), 🔥 Core (with a twist), ⭐ Outstanding (optional).
4. Revision cards for the Time Vault (spaced repetition).

Revision lessons ("Briefing Room") come every 4–5 lessons and mix earlier ideas. Every Phase ends in a **Trial**.

## 9. Retention and practice systems
- **The Time Vault:** spaced repetition (intervals of 1, 3, 7, 16 and 35 days) over cards from finished lessons and case debriefs. The card types are predict, choice, spot the flaw, and order the steps.
- **Sparring (the Avengers training room):** quick 5-minute drills against the cast. Estimation sprints, anti-pattern spotting, and naming the trade-off.
- **The case library:** every system design case, filterable by topic, zone achieved and Mark level. A **Readiness meter** per area (machine coding, front-end design, backend design, lead) is computed from the zones of your latest attempts.

## 10. Rewards and progression
- XP and levels; **suit Marks** as visible titles.
- **Stark Credits** spent in the **Stark Expo** shop. Every item must visibly do something: themes, HUD styles, editor colour schemes, extra simulation visualisers. Nothing reveals answers.
- **Infinity Stone badges:** earn a stone by reaching 🟢 on the cases that lean on that dimension.

## 11. Architecture

```
src/
  engine/
    content.ts       loads content/** (YAML) via import.meta.glob
    progress.ts      XP, levels, unlocking, Mark levels
    zones.ts         zone computation (§5.1)
    audit.ts         builds Rhodey's report from sim + rubric + rules
    store.ts         zustand save, versioned, detectSaveVersion + migrations + 3 backups
    review.ts        Time Vault spaced repetition
  sim/
    engine.ts        seeded discrete-event simulation (runs in a Web Worker)
    components.ts    component models: capacity, latency distribution, hit rate, failure modes, cost
    scenarios.ts     traffic shapes + incident injections
    rules.ts         anti-pattern detectors over the design graph
    perfLab.ts       deterministic front-end performance model (LCP/INP/CLS, bundle)
  runtime/
    sandbox/         iframe runner: Sucrase transform, import map (React), test harness
    harness.ts       test helpers (render, user-event, fake timers, axe, review rules)
    msw/             in-browser mock APIs (Mock Service Worker) scripted per exercise
    socket/          in-browser mock WebSocket server (mock-socket) for real-time exercises
  ui/                stations, canvases (@xyflow/react), gauge, audit, cutscenes, HUD
  lore/              all franchise names and flavour (swappable)
content/
  cast.yaml
  phase-N/phase.yaml
  phase-N/NN-slug/   lesson.yaml, lecture.md, <slot>.yaml, solutions, review.yaml
  cases/<case>/      case.yaml (stations, scenarios, targets, rubric), reference design
scripts/
  validate-content.mjs
```

**Mocks give realistic responses without a server.**
- **A fetch mock built into the harness** answers the learner's real `fetch` calls. Each exercise scripts latency (per call, so responses can arrive out of order), status codes (429, 500), JSON bodies, pagination cursors and aborts.
  - This replaced MSW: the sandbox iframe has an opaque origin and can't register a service worker.
- **mock-socket** (planned for Phase 2, lesson 15) gives a WebSocket server for chat, presence and live updates.
- Your code makes real requests, and the results are fully repeatable.
- **The sandbox iframe** loads the harness as a classic IIFE script (`public/sandbox/sandbox.js`, built by `npm run build:sandbox`). It's isolated from the game by `sandbox="allow-scripts"`.

**An optional Lab, later:** a local `docker-compose` (Redis, Postgres, a queue) for watching real stampedes and replication lag. It's never required.

### The look: the JARVIS HUD
- **Palette:** cyan holographic panels (`--accent #4fd8ff`) on deep blue-black, gold (`#ffc861`) for highlights, red only for alerts and the failing zone. Fonts are Rajdhani for headings and JetBrains Mono for readouts, self-hosted through `@fontsource`.
- **Panels:** corner brackets and a soft glow on an opaque base, so text stays readable over the backdrop.
- **The backdrop** (`src/ui/hud/Backdrop.tsx`): a single hand-drawn Canvas 2D layer with a perspective grid, drifting particles and a radar sweep, plus CSS scanlines. It is deterministic (no `Math.random`) and draws one still frame under reduced motion.
- **Motion:**
  - the boot sequence (`hud/Boot.tsx`, once per session, skippable);
  - story lines that type out in a "comms" window;
  - the Arc Reactor gauge spinning up and locking onto the zone;
  - audit items stamping in one by one;
  - the "suit upgrade" toast on level-up (`hud/LevelUp.tsx`);
  - packets flowing along design-table wires after a run, more and faster when the box they feed is busy, coloured by its load;
  - overloaded boxes flickering red;
  - a replay scrubber on every simulation chart.
- **Rules:** no animation library. Everything is CSS, SVG or Canvas. **Every animation respects `prefers-reduced-motion`**, and the e2e tests run with reduced motion, except one test that checks the boot and typing.

## 12. Verification
- **The content validator** (`scripts/validate-content.mjs`):
  - code: solutions pass, starters fail, hints don't leak, and no lecture code solves a core challenge;
  - designs: the reference design lands 🟢 on every scenario, and a naive design (a single server and database) lands 🔴;
  - estimation: the zone boundaries hold;
  - scenes and cards are well formed.
- **Unit tests** (Vitest): the simulation is deterministic for a given seed; zone maths; each anti-pattern rule against known good and bad graphs; audit line items; save migrations.
- **E2E tests** (Playwright): play a code mission, a lesson and a guided case end to end; a reload keeps progress.

## 13. Roadmap
1. **Design docs** (this commit). Owner review.
2. **The engine slice:**
   - the iframe runner and harness, with MSW;
   - the design table and simulation;
   - the zone gauge and the audit;
   - a sequencer and an estimation bench;
   - one Phase 1 lesson (DNS and HTTP), one Workshop mission (debounce), and one complete guided case (the URL shortener).
3. **Phase 1, The Cave**, then each Phase in turn: script it in `story.md` first, then build its content, then validate, test and commit.
4. Later: Sparring, the Readiness meter, the Stark Expo shop, the optional Lab.
