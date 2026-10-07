# Exercise Design: How Lessons, Missions and Cases Are Built

This is the authoring contract. The content validator (`scripts/validate-content.mjs`) enforces every **must** below.

## 1. Lesson anatomy
Every ordinary lesson has:
1. **A scene:** 2–6 lines, ending with a reason to build.
2. **A lecture** (`lecture.md`), with:
   - **interactive diagrams** (`diagram` fences: a request flow, the event loop, the render pipeline, a component tree), which play step by step;
   - **checkpoints** (`checkpoint` fences: `q`, `options`, `answer`, `why`);
   - **"Try it"** sandboxes (`tsx` and `ts` fences run in the sandbox; `sim` fences open a mini design table).
3. **Three exercises:**
   - 🌱 **Warm-up**: guided, and close to the lecture.
   - 🔥 **Core**: always has a **twist** (§3) and hidden edge cases.
   - ⭐ **Outstanding**: optional, a stretch.
4. **Revision cards** (`review.yaml`): 2–4 cards for the Time Vault. At least one must be `choice` (the Sparring room uses them).
5. **A spellbook-style recap** (`notes.md`): the page the player unlocks for reference.

Revision lessons ("Briefing Room") have three exercises, `r1`–`r3`, mixing earlier ideas. Trials have stages (`stage1`…`stageN`).

**Hard rules:**
- **No lecture example may solve a core or ⭐ challenge.** The validator runs every lecture code block, and every lecture `sim`, against each core's checks, and they must fail.
- **No hint may contain a solution line** of 12 characters or more. For designs, no hint may name the exact component setting the rubric requires; describe it as a question instead.

## 2. Tiers and support levels
| Tier | Support |
|---|---|
| 🌱 Warm-up | the lecture's idea, one step further; hints free |
| 🔥 Core | a twist; full hint ladder (nudge → question → pseudocode → flaw → analogous) |
| ⭐ Outstanding | combines ideas or adds scale; full ladder |

**Cases** are played at **Mark levels** (GDD §6):
- **Mark I:** guided, partly pre-built, hints free.
- **Mark III:** a skeleton, cheap hints.
- **Mark VII:** blank stations, the full hint cost.
- **The Brief:** a blank canvas, no hints, time boxes.

## 3. The twist catalogue
- **edge case**: empty input, a single item, maximum size, a network failure;
- **race**: out-of-order responses, double clicks, a reconnect mid-send;
- **scale**: 10× or 100× load or data size; must stay within budget;
- **failure**: a node dies, a region goes dark, a dependency slows;
- **trap**: the obvious answer is wrong (offset pagination, caching personal data at the CDN);
- **spec reading**: a requirement hides in one clause;
- **debug**: start from a broken version;
- **trade-off**: two good answers; the reasons decide the zone;
- **budget**: meet LCP, INP, CLS, latency or cost targets;
- **accessibility**: keyboard and screen-reader requirements;
- **security**: a sink, a leak or a misplaced token.

## 4. File layout
```
content/
  cast.yaml                     speakers: id -> { name, portrait }
  rules.yaml                    anti-pattern / review rule -> lesson id where it switches on
  phase-N/phase.yaml            phase, title, arc, theme {…}, intro scene
  phase-N/NN-slug/
    lesson.yaml                 id, phase, order, number, kind (lesson|revision|trial), title,
                                location, concepts, exercises [warmup, core, outstanding],
                                scene, outro, clue
    lecture.md                  markdown + ```diagram, ```checkpoint, ```tsx, ```sim fences
    notes.md                    the recap page
    <slot>.yaml                 one exercise (formats in §5)
    <slot>.solution.*           reference solution for code missions; `solves:` names the starter file it replaces - never bundled
    review.yaml                 Time Vault cards
  cases/<id>/
    case.yaml                   the case: scenes, scenarios, every station inline, `reference` and `naive` designs (§6)
    <stationId>.solution.ts     the reference solution of a code station (validator only)
```

Ids follow the pattern `p2-l03a` (Phase 2, lesson 3, part a), `p2-r1`, `p2-trial`, `c03` and `b11`. Exercise ids are `<lessonId>.<slot>`.

## 5. Exercise formats
Every exercise has `tier`, `type`, `title`, `twist` (for the core), `task` (markdown) and `hints` (the five rungs). The type-specific fields follow.

### 5.1 `code`: a code mission
```yaml
type: code
solves: debounce.ts          # the file the <slot>.solution.* replaces (default: the first file)
files:                       # starter files shown in the editor (multi-file allowed)
  debounce.ts: |
    export function debounce(fn, wait) { ... }
entry: App.tsx               # for React missions: rendered by render() with no argument
mocks:                       # the built-in fetch mock: scripted and deterministic
  - { method: GET, path: /api/search, delay: [300, 50], json: { results: [] } }   # 1st call 300 ms, then 50 ms
  - { method: GET, path: /api/search, query: "q=zz", status: 500 }
tests: |                     # run inside the sandbox; helpers in §8
  test("shows results after typing", async () => { ... })
```

### 5.2 `design`: the design table
```yaml
type: design
palette: [client, cdn, lb, service, cache, queue, worker, sqldb, kvstore, replica, objectstore, search]
prebuilt: design/mark1.json   # Mark I only: the pre-wired part
scenarios:
  - id: steady
    traffic: { rps: 2000, read_ratio: 0.99, duration: 600 }
  - id: viral
    traffic: { rps: 20000, hot_key: 0.4 }
targets:                      # per scenario or global
  p99_ms: 50
  error_rate: 0.001
  availability: 0.999
  cost_per_month: 4000
rubric:
  must: [key_generation, cache_hot_reads, async_analytics]
  should: [redirect_code_reasoned, rate_limit_creates]
  bonus: [bloom_filter_custom_alias]
rules: [spof, unindexed_query, cache_without_ttl, sync_third_party]
```

**The guided build (`steps:`).** A design station can carry a step-by-step build for Mark I. It shows in full at Mark I, as a checklist at Mark III, and is hidden at Mark VII:
```yaml
steps:
  - id: cache
    title: The viral link
    goal: Put a cache between the service and the links store, with a TTL.   # one plain sentence
    teach: |                    # 3-8 short lines: the idea, an analogy, the numbers needed
      ...
    ask:                        # optional: a choice, or a number (accepted within 25% either way)
      q: 40% of 12,000 redirects a second are for one link. How many a second is that?
      number: 4800
      unit: per second
      why: ...                  # shown once it's right
    done:                       # every check must pass on the player's design
      - { rubric: cache_hot_reads }
      - { clear: cache_without_ttl }
    hint: Add a Cache, connect service → cache, and set its TTL above 0.
```

The check kinds are `{ ran: true }`, `{ has: kind, from?: kind }`, `{ clear: ruleId }`, `{ rubric: checkerId }` and `{ survives: scenarioId, kinds?: [...], max?: 0.8 }` (every part, or every part of those kinds, stays at or under `max` load).

Steps teach the **method** (the work asked ÷ what one unit can do), never the final numbers. The validator requires that the reference design passes every step and that the starting design doesn't finish the build. `src/engine/steps.test.ts` replays a beginner's build, so a step that can't be reached in order fails the tests.

The rubric items are **checkers** in `src/sim/rubric/`: functions over the design graph and its settings. Rules are anti-pattern detectors (GDD §5.3).

### 5.3 `blueprint`: front-end architecture
```yaml
type: blueprint
routes: [/, /pin/:id, /board/:id]
palette: [page, component, store_local, store_global, server_cache, worker, service_worker]
options: [rendering, code_split, image_strategy, prefetch, virtualise]
budgets: { lcp_ms: 2500, inp_ms: 200, cls: 0.1, js_kb: 250 }
device: mobile_mid           # the perf-lab device and network profile
rubric: { must: [...], should: [...] }
rules: [global_state_for_server_data, unvirtualised_list, images_without_dimensions]
```

### 5.4 Smaller formats
| Type | Key fields | Grading |
|---|---|---|
| `sequence` | `items` (shuffled), `answer` (an order), or `accept` (several orders) | exact match; partial order gives 🟡 |
| `predict` | `scenario` (code, a diagram or text), `options` or a free `answer` (one line), `why` | exact |
| `estimate` | `given` (facts), `ask` (quantities with units), `answer`, `zones` (for example `green: 2x, yellow: 10x`) | ratio to the reference |
| `desk` | `kind` (schema, state or api), `required` (checker ids), `rules` | the checkers |
| `interrogate` | `pool` (questions, each with `reveals` and `cost` in minutes), `budget`, `must_reveal` | coverage of `must_reveal` within the budget |
| `tradeoff` | `options`, `reasons` (with correct and incorrect sets), `answer` | the choice and the reasons (a right choice for the wrong reason is 🟡) |
| `assemble` | `sections` (the RADIO sections), `chips` (with `belongs` and `decoy` flags) | must-have chips placed, minus decoys |
| `incident` | `scenario` (a live sim), `actions` (with effects), `goal` (recover within N simulated minutes) | time to recover, side effects, ordering |
| `flaw` | `design` (a graph, or code), `planted` (the flaws with locations) | flags matched (missed critical = 🔴) |

## 6. Cases (`case.yaml`)
```yaml
id: b01
title: URL Shortener
phase: 5
level_unlocks: [mark1, mark3, mark7]
brief: |                      # Fury's opening line + the one-sentence ask
stations:
  - { kind: interrogate, ref: interrogate.yaml, timebox: 5 }
  - { kind: estimate,    ref: estimate.yaml,    timebox: 5 }
  - { kind: design,      ref: design.yaml,      timebox: 15 }
  - { kind: desk,        ref: api.yaml,         timebox: 10 }
  - { kind: code,        ref: deepdive.yaml,    timebox: 10 }
  - { kind: incident,    ref: curveballs.yaml }
  - { kind: assemble,    ref: radio.yaml }
mark1:                         # guidance shown only at Mark I
  prebuilt: design/mark1.json
  narration: guided.md         # JARVIS's step-by-step walkthrough
cards: review.yaml             # distilled key points for the Time Vault
```

**Case rules the validator enforces:**
- the `reference` design lands 🟢 on **every** scenario and curveball;
- the `naive` design lands 🔴;
- every rubric `must` is satisfied by the reference, and every rubric and rule id exists;
- every station has its own reference answer that lands 🟢:
  - the must-have questions fit within the interrogation budget;
  - the estimate answers;
  - the desk's `answer` endpoints;
  - the chips' sections;
  - the code station's `<stationId>.solution.ts`.

In practice, stations are written inline in `case.yaml` (see `content/cases/b01-url-shortener/case.yaml`), not as separate files.

## 7. Zones (how a submission is scored)
Computed by `src/engine/zones.ts`, the same for every type:
1. **Simulation band.** Each target is scored by margin: ≥ 20% margin is 🟢; met is 🔵; within 20% over is 🟡; worse is 🔴. The band is the worst target's.
2. **Rubric band.** All musts and ≥ 50% of shoulds is 🟢; all musts is 🔵; one must missing is 🟡; more is 🔴.
3. **Penalties.** A critical anti-pattern forces 🔴; a major one caps the zone at 🟡.
4. **Zone** = min(simulation band, rubric band), after penalties.
5. **Grade:** S, A, B or C for the zone. Hints and time adjust XP and the ★ flourish only.

**The audit** (`src/engine/audit.ts`) lists each target, rubric item and rule hit as ✓, ⚠, ✗ or ☠, tagged with its Infinity Stone. Before a pass, ✗ and ☠ show as questions; after a pass, the reference design and the reasons are revealed.

## 8. Test helpers for code missions (`src/runtime/harness.ts`)
| Helper | Purpose |
|---|---|
| `test(name, fn)` | declare a test; they run in order and stop at the first failure |
| `check(condition, "guiding question")` | fail with a question, never a fix |
| `load("file.ts")` | the learner's module (its exports) |
| `spy(impl?)` | a function that records `.calls` |
| `useFakeTimers()` | install fake timers and return the clock: `clock.tick(ms)`, `clock.runAll()` |
| `await render(el?)`, `screen`, `within`, `waitFor`, `act` | Testing Library and React (with no argument, renders the `entry` file's default export) |
| `user()` | user-event, wired to the fake clock if one is installed |
| `api.calls(path?)` | the requests the learner's code made to the fetch mock |
| `await axe(container?)` | accessibility violations, as a list of strings |
| (planned) `socket` | mock-socket: `send`, `drop`, `reconnect` |

**Rhodey's code review** (after a pass): AST rules that switch on as their ideas are taught. Examples:
- index used as a key;
- an effect without cleanup;
- server data held in global state;
- `any` in TypeScript;
- an un-memoised context value;
- a click handler on a `div` without a role.

## 9. Revision cards (`review.yaml`)
| Type | Fields |
|---|---|
| `choice` | `q`, `options`, `answer`, `why` |
| `predict` | `code` or `diagram`, `answer`, `why` |
| `order` | `items`, `answer`, `why` |
| `flaw` | a small design or code, `planted`, `why` |

## 10. Hints: the JARVIS ladder
Five rungs, unlocked one at a time:
1. **nudge**: the concept to think about;
2. **question**: about *your* answer;
3. **pseudocode**: structure only, or "which component family", never the exact setting;
4. **flaw**: names the region and the kind of mistake;
5. **analogous**: a similar-but-different example.

## 11. Authoring traps (learned the hard way; add to this list)
1. Quote any YAML value containing `: `.
2. Simulations must be **seeded**. Never use `Math.random` or `Date.now` in the simulation or the tests.
3. MSW fixtures and delays must be deterministic, and `delay` is milliseconds. Out-of-order scenarios use explicit per-request delays.
4. Hints must not leak solution lines (code) or exact required settings (designs).
5. A rubric checker must accept **every** reasonable equivalent design, not just the reference. Add an alternative reference (`alt-*.design.json`) whenever two architectures are both 🟢.
