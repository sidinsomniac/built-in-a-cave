# Curriculum: Six Phases, from the Cave to the Endgame

This takes a front-end developer with **no backend or system-design background** to **senior and engineering-lead interview readiness** in three areas:
- **🛠 Machine coding:** timed builds and polyfills, in real React.
- **🖥 Front-end system design:** the RADIO rounds.
- **🏗 Backend system design:** the distributed-systems rounds.

It follows [exercise-design.md](exercise-design.md). Every lesson has a 🌱 Warm-up, a 🔥 Core challenge with a twist, and an optional ⭐ Outstanding. Every case is played through stations at falling support levels (Mark I → III → VII → the Brief). Every answer lands in a **zone** (🟢 Optimal, 🔵 Solid, 🟡 Risky, 🔴 Failing) with **Rhodey's audit**.

**Key**
- **Pt1/Pt2**: the lesson is split into parts.
- **R**: a *Briefing Room* revision lesson.
- **C**: a front-end case. **B**: a backend case.
- **(twist)**: the twist used by the core challenge.
- Exercise types: 💻 code, 🗺 design table, 🧩 blueprint, 🔢 sequencer, 🔮 predict, 🧮 estimation, 📐 data and API desk, ❓ interrogate, ⚖ trade-off board, 🧷 answer assembly, 🚨 incident drill, 🔍 spot the flaw.

| Phase | Theme | Size | Finale |
|---|---|---|---|
| 1 | **The Cave**: how the web actually works | 13 + 3R | Trial: Escape the Cave |
| 2 | **The Workshop**: machine coding | 15 + 3R | Trial: Mark III (a 90-minute build) |
| 3 | **The Arc Reactor**: the backend building blocks | 16 + 3R | Trial: Keep the Reactor Stable |
| 4 | **S.H.I.E.L.D. Briefings**: front-end system design | 10 lessons + 11 cases + 3R | Trial: The Brief (front end) |
| 5 | **The Helicarrier**: backend system design | 5 lessons + 15 cases + 3R | Trial: The Brief (backend) |
| 6 | **Endgame**: the lead and the loop | 9 lessons + 3 mock loops + 2R | Trial: The Final Battle |

**How the difficulty climbs:**
- **Phase 1:** knowledge from scratch, through interactive diagrams.
- **Phase 2:** the code you already half-know, sharpened to interview grade.
- **Phase 3:** each backend building block on its own, on a small simulation.
- **Phases 4 and 5:** whole cases, first guided, then solo.
- **Phase 6:** blank canvases, the clock, and lead-level judgement.

Within every case, the support fades:
- the **first** play is Mark I (guided);
- replays and later cases climb to Mark VII (solo);
- every Phase ends in a blank-canvas Trial.

---

## Phase 1: The Cave (how the web actually works)
*Requires nothing. Ends able to explain, step by step, what happens from a click to a pixel, and to reason about latency and scale in numbers.*

| # | Lesson | Concepts | Exercises: 🌱 Warm-up · 🔥 Core (twist) · ⭐ Outstanding |
|---|---|---|---|
| 1 | Clients and Servers | request and response, client, server, what "a server" physically is | 🔢 order a page load's request/response steps · 🔮 which machine does the work in five scenarios *(misconception)* · 🗺 wire your first browser → server → database and watch one request travel |
| 2 | The Plumbing: IP, Packets and Ports | addresses, routing, packets, ports, localhost | 🔢 a packet's hops · 🔮 what happens when a packet is lost *(edge case)* · 🧮 how many packets carry a 1 MB image |
| 3 | DNS | names to addresses, resolvers, root, TLD and authoritative servers, TTL, caching | 🔢 a full DNS resolution · 🔮 the cached vs uncached lookup after a TTL expires *(edge case)* · 🗺 simulate a DNS outage and pick the mitigation |
| 4 | TCP and UDP | the handshake, reliability, ordering, why UDP exists | 🔢 the three-way handshake · 🔮 which transport for video calls, file downloads and DNS *(trade-off)* · 🧮 round trips before the first byte on a far server |
| 5 | TLS and HTTPS | encryption, certificates, the TLS handshake, TLS 1.3 | 🔢 the TLS 1.3 handshake · 🔍 spot the man-in-the-middle in a broken chain *(debug)* · ⚖ the cost of TLS termination at the load balancer vs the service |
| R1 | Briefing Room I | lessons 1–5 | 🔢 the full click-to-connection timeline · 🔮 three "what breaks" questions · 🧮 the latency budget of a first visit |
| 6 | HTTP **Pt1**: Requests and Responses | methods, paths, status codes (2xx/3xx/4xx/5xx), bodies | 🔮 the status code for ten situations · 📐 design the requests for a to-do app *(spec reading)* · 💻 a `fetch` wrapper that turns status codes into typed errors (on MSW) |
| 6 | HTTP **Pt2**: Headers, Cookies and CORS | headers, cookies, caching headers (Cache-Control, ETag), CORS preflight | 🔮 will the browser cache this? · 💻 fix a CORS failure on the mock API *(debug)* · 🔮 an ETag revalidation trace |
| 7 | HTTP/1.1, 2 and 3 | keep-alive, head-of-line blocking, multiplexing, QUIC | 🔢 match the protocol to the problem it fixed · 🔮 the waterfall under HTTP/1.1 vs HTTP/2 *(comparison)* · ⚖ when HTTP/3 helps (lossy mobile) |
| 8 | APIs and JSON | what an API is, REST resources, JSON, idempotent methods | 📐 a REST API for Stark Expo tickets · 🔮 which methods are safe to retry *(misconception)* · 💻 a paginated client against MSW |
| R2 | Briefing Room II | lessons 6–8 | 🔮 a status-code and caching gauntlet · 💻 repair a broken API client · 📐 review an API with three flaws |
| 9 | The Browser's Render Pipeline | parse, style, layout, paint, composite; reflow; the critical rendering path | 🔢 order the pipeline · 🔮 which CSS change triggers layout vs paint vs composite *(trap)* · 💻 fix a layout-thrashing loop |
| 10 | The JavaScript Event Loop | the call stack, tasks, microtasks, `requestAnimationFrame` | 🔮 predict the log order · 🔮 promises vs `setTimeout` vs rAF *(trap)* · 💻 split a long task so input stays responsive (INP) |
| 11 | Storage in the Browser | cookies, localStorage, sessionStorage, IndexedDB, the Cache API; limits and security | ⚖ the right store for six kinds of data · 🔍 spot the token in localStorage *(security)* · 💻 a tiny IndexedDB-backed draft saver |
| 12 | Latency Numbers Everyone Should Know | memory vs disk vs network, same-region vs cross-continent | 🔢 sort the operations by latency · 🧮 the latency budget of an API call that hits a database twice *(combination)* · 🧮 why a cache 50 ms away can still be a win |
| 13 | Powers of Ten: Estimation Basics | units, powers of 10, daily → per second, peak factors | 🧮 1 million daily users → requests a second · 🧮 storage for 5 years of photos *(units trap)* · 🧮 the bandwidth for a video launch |
| R3 | Briefing Room III | lessons 9–13 | 🔮 render and event-loop mix · 🧮 an estimation sprint · 🔢 the click-to-pixel timeline |
| 🏁 | **Trial: Escape the Cave** | everything | **Stage 1:** a broken request chain. Find the DNS, TLS and CORS failures (🔍). **Stage 2:** repair the API client (💻). **Stage 3:** estimate the load (🧮). **Stage 4:** wire and simulate the minimal system that survives it (🗺). |

## Phase 2: The Workshop (machine coding)
*Requires Phase 1. Ends able to build interview-grade components and utilities in 45–90 minutes: correct, tested, accessible.*

| # | Lesson | Concepts | Exercises |
|---|---|---|---|
| 1 | Closures, Scope and `this` | closures, binding, arrow functions | 🔮 `this` in ten call sites · 💻 `bind`/`call`/`apply` polyfills *(edge case)* · 💻 `once` and `memoize` |
| 2 | Events in the DOM | capture, bubble, delegation, `preventDefault`, custom events | 🔮 the event order · 💻 a delegated list with dynamic items *(edge case)* · 💻 an EventEmitter (`on`, `off`, `once`, `emit`) |
| 3 | Debounce and Throttle **Pt1** | timers, trailing debounce, throttle | 💻 a trailing debounce · 💻 a throttle that never drops the last call *(edge case)* · 🔮 the timeline under fake timers |
| 3 | Debounce and Throttle **Pt2** | leading and trailing options, `cancel`, `flush`, `maxWait` | 💻 leading + trailing · 💻 `cancel` and `flush` *(spec reading)* · 💻 lodash-compatible `maxWait` |
| 4 | Promises Inside Out | states, chaining, errors, `Promise.all`, `allSettled`, `any`, `race` | 💻 `Promise.all` · 💻 `allSettled` and `any` with AggregateError *(spec reading)* · 💻 a `Promise` polyfill (then and catch) |
| R1 | Briefing Room I | lessons 1–4 | 🔮 a closure and event mix · 💻 repair a broken debounce · 💻 `race` with a timeout |
| 5 | Async Control | AbortController, timeouts, retry with exponential backoff and jitter, promise pools | 💻 retry with backoff (MSW 500s) · 💻 a promise pool with a concurrency limit *(scale)* · 💻 an async task queue with priorities |
| 6 | Utility Classics | deep clone (cycles), deep equal, curry, flatten, `groupBy`, LRU | 💻 curry · 💻 deep clone with cycles, Maps and Dates *(edge case)* · 💻 an LRU cache with O(1) operations |
| 7 | React Rendering | render vs commit, reconciliation, keys, memo, context re-renders | 🔮 which components re-render · 💻 fix a list with index keys *(debug)* · 🔮 context splitting to stop re-renders |
| 8 | Hooks in Depth | effects and cleanup, stale closures, custom hooks, `useSyncExternalStore` and tearing | 💻 `usePrevious`, `useInterval` · 💻 fix a stale-closure timer *(debug)* · 💻 a tearing-free external store hook |
| R2 | Briefing Room II | lessons 5–8 | 🔮 a hook-order puzzle · 💻 a cancellable fetch hook · 💻 repair a leaking effect |
| 9 | Accessible Widgets **Pt1** | ARIA roles, keyboard patterns, focus management | 💻 tabs (arrow keys, `aria-selected`) · 💻 a modal with a focus trap and return focus *(edge case)* · 💻 an accordion with a single or multiple open mode |
| 9 | Accessible Widgets **Pt2** | the combobox pattern, `aria-activedescendant`, live regions | 💻 a static combobox · 💻 an async autocomplete UI: debounced, cached, race-safe (MSW out-of-order responses) *(race)* · 💻 highlighted matches and a "no results" announcement |
| 10 | Data Fetching in React | `useFetch` with cache, abort, retry, stale-while-revalidate | 💻 a basic `useFetch` · 💻 cache + abort on unmount + dedupe concurrent calls *(race)* · 💻 SWR with background revalidation |
| 11 | Lists at Scale | IntersectionObserver, infinite scroll, windowing | 💻 infinite scroll with a cursor (MSW) · 💻 a virtualised list of 100,000 rows from scratch *(scale)* · 💻 variable-height virtualisation |
| R3 | Briefing Room III | lessons 9–11 | 💻 fix a combobox's keyboard handling · 🔮 virtualisation edge cases · 💻 infinite scroll that doesn't double-fetch |
| 12 | Nested Comments | recursive components, collapse, reply, optimistic updates | 💻 render a comment tree · 💻 reply with an optimistic insert and rollback on 500 *(edge case)* · 💻 collapse state that survives re-fetch |
| 13 | Drag and Drop | pointer events, the HTML5 DnD API, keyboard drag-and-drop | 💻 reorder a list · 💻 a kanban board across columns, with keyboard support *(accessibility)* · 💻 drag auto-scroll |
| 14 | Forms | controlled vs uncontrolled, validation, async validation, multi-step wizards | 💻 a validated signup form · 💻 async username check, debounced and race-safe *(race)* · 💻 a wizard with persisted drafts |
| 15 | Real-time UI | WebSockets on the client (mock-socket), reconnection, ordering | 💻 a live ticker · 💻 a chat pane with reconnection and de-duplication *(edge case)* · 💻 presence and typing indicators |
| 🏁 | **Trial: Mark III** | everything | **A 90-minute timed build**, the "Stark Expo ticket browser": an accessible autocomplete search, an infinite-scroll grid, a details modal and a cart, against MSW with errors and slow responses. Graded by hidden tests, axe and Rhodey's review. |

## Phase 3: The Arc Reactor (the backend building blocks)
*Requires Phase 1. Ends knowing every building block a design round uses: what it does, when to reach for it, how it fails, and its trade-offs. Each lesson's 🔥 is a small design-table simulation.*

| # | Lesson | Concepts | Exercises |
|---|---|---|---|
| 1 | One Server, and Its Limits | capacity, utilisation, queueing (Little's law, lightly), worst-case latency | 🗺 load one server until it breaks · 🔮 why latency explodes at 90% utilisation *(misconception)* · 🧮 how many servers for a 3× peak |
| 2 | Scaling Up vs Out | vertical vs horizontal, stateless services, sessions | ⚖ up or out for five systems · 🗺 make a stateful service scale out *(debug)* · 🔍 spot the hidden state |
| 3 | Load Balancers | round robin, least connections, consistent routing, health checks, L4 vs L7 | 🔮 where requests go · 🗺 a dying node with and without health checks *(failure)* · ⚖ L4 vs L7 for WebSockets |
| 4 | Caching **Pt1** | where caches live, cache-aside, TTL, hit rate | 🗺 add a cache and watch the latency · 🗺 pick a TTL for three data types *(trade-off)* · 🧮 the memory needed for an 80% hit rate |
| 4 | Caching **Pt2** | invalidation, write-through, write-behind, stampedes, hot keys | 🔮 the stale-read sequence · 🗺 survive a mass expiry (stampede) *(failure)* · 🗺 a hot key from a celebrity post |
| R1 | Briefing Room I | lessons 1–4 | 🗺 mixed scaling · 🔍 spot three cache bugs · 🧮 a capacity sprint |
| 5 | CDNs and the Edge | edge caching, origin shield, cache keys, purging, edge compute | 🗺 put a CDN in front of images · 🔮 the cache-key trap (query strings, cookies) *(trap)* · ⚖ purge vs versioned URLs |
| 6 | Databases **Pt1**: Choosing a Store | relational, key-value, document, wide-column, search, blob, time-series | ⚖ the right store for eight data sets · 📐 model Stark Expo in SQL *(spec reading)* · 📐 the same data, document-shaped |
| 6 | Databases **Pt2**: Indexes | B-trees, composite indexes, covering indexes, query plans, N+1 | 🔮 which queries use the index · 🗺 fix a slow endpoint with the right index *(debug)* · 🔍 spot the N+1 |
| 6 | Databases **Pt3**: Transactions | ACID, isolation levels, anomalies (dirty, non-repeatable and phantom reads, lost updates), locking | 🔮 which anomaly each level allows · 🔮 two transactions interleaved: what's the final balance? *(trap)* · ⚖ optimistic vs pessimistic locking for seat booking |
| 7 | Replication | leader-follower, sync vs async, replica lag, read-your-writes, failover | 🗺 add read replicas · 🔮 read-your-writes after a replica lag spike *(edge case)* · 🚨 a failed leader: the failover runbook |
| R2 | Briefing Room II | lessons 5–7 | 🗺 a read-heavy system end to end · 🔮 an isolation gauntlet · 📐 index design |
| 8 | Sharding | partition keys, range vs hash, hot shards, resharding, consistent hashing | 🔮 where each key lands · 🗺 fix a hot shard (timestamp key) *(failure)* · 💻 consistent hashing with virtual nodes |
| 9 | Queues, Pub/Sub and Streams | async work, consumer groups, ordering, at-least-once, dead-letter queues, backpressure | 🗺 move slow work off the request path · 🗺 a consumer falls behind: backpressure *(failure)* · ⚖ Kafka vs SQS for three workloads |
| 10 | CAP, PACELC and Consistency | partitions, strong vs eventual, quorums, linearisability | 🔮 what each system returns during a partition · 🗺 a quorum read/write tuning *(trade-off)* · ⚖ the right consistency for likes, payments and inventory |
| 11 | Idempotency and Retries | idempotency keys, exponential backoff with jitter, the exactly-once myth, the outbox pattern | 💻 an idempotent handler with keys · 🗺 a retry storm and how jitter calms it *(failure)* · 🗺 the outbox pattern for event publishing |
| R3 | Briefing Room III | lessons 8–11 | 🗺 a write-heavy system end to end · 🔍 spot five distributed-systems bugs · 🧮 shard counts |
| 12 | Rate Limiting | token bucket, leaky bucket, fixed and sliding window, where to enforce limits | 💻 a token bucket · 💻 a sliding-window log vs counter *(trade-off)* · 🗺 limits at the gateway vs per service |
| 13 | Real-time Delivery | polling, long polling, Server-Sent Events, WebSockets, connection gateways, fan-out | ⚖ the transport for six features · 🗺 a million connections: gateway sizing *(scale)* · 🗺 presence fan-out |
| 14 | Search and Indexing | inverted indexes, tokenising, ranking, search clusters, keeping the index in sync | 🔮 what an inverted index returns · 🗺 keep search in sync via change data capture *(consistency)* · 📐 design a product search index |
| 15 | Observability | metrics, logs, traces, the four golden signals, SLIs, SLOs, error budgets, alerting | 🔮 which signal finds which bug · 🚨 use traces to find the slow hop *(debug)* · 📐 SLOs and alerts for an API |
| 16 | Security Building Blocks | authentication vs authorisation, sessions vs tokens, OAuth2 and OIDC flows, JWT pitfalls, secrets, encryption at rest and in transit | 🔢 the OAuth authorisation-code-with-PKCE flow · 🔍 spot the JWT mistakes *(security)* · ⚖ sessions vs JWTs for three apps |
| 🏁 | **Trial: Keep the Reactor Stable** | everything | An escalating, multi-stage simulation. Each stage adds load or a failure: traffic ×10, a cache stampede, a replica lag spike, a hot shard, a retry storm. Patch the design between stages (🗺 and 🚨). |

## Phase 4: S.H.I.E.L.D. Briefings (front-end system design)
*Requires Phases 1–3. Ends able to lead any front-end system design round with RADIO, in the time box.*

### Lessons

| # | Lesson | Concepts | Exercises |
|---|---|---|---|
| 1 | The RADIO Framework | Requirements, Architecture, Data model, Interface, Optimisations; time boxes; signposting | 🧷 assemble RADIO for a like button (guided) · ❓ interrogate Pepper about a poll widget *(hidden requirement)* · 🧷 spot the decoys in a sample answer |
| 2 | Rendering Strategies | client-side, server-side, static, incremental, streaming, islands, server components; hydration costs | ⚖ the strategy for eight pages · 🧩 a marketing site plus an app shell, simulated *(page-speed trade-off)* · ⚖ streaming server rendering for a dashboard |
| 3 | Client State Architecture | local vs global vs server cache, normalisation, derived state, URL state | 📐 normalise a feed's entities · 🧩 put every piece of state in its right home *(trap)* · 📐 state for undo and redo |
| 4 | Data Fetching Patterns | stale-while-revalidate, dedupe, offset vs cursor pagination, optimistic updates, retries, prefetching | ⚖ offset vs cursor · 💻 optimistic like with rollback (MSW) *(edge case)* · 🧩 a prefetch-on-intent strategy |
| 5 | Real-time on the Client | polling, Server-Sent Events, WebSockets, reconnection with backoff, ordering, de-duplication | ⚖ the transport for five features · 💻 ordered, de-duplicated messages after a reconnect *(edge case)* · 🧩 a presence architecture |
| R1 | Briefing Room I | lessons 1–5 | 🧷 RADIO for a todo app · 🧩 a mixed blueprint · 🔍 spot the flaws in a dashboard design |
| 6 | Performance **Pt1** | LCP, INP and CLS; the critical path; images (formats, `srcset`, lazy loading, priority hints); fonts | 🔮 which change fixes which page-speed metric · 🧩 hit the LCP budget for a product page *(budget)* · 🧩 an image pipeline for a gallery |
| 7 | Performance **Pt2** | code splitting, bundle budgets, tree shaking, virtualisation, web workers, memoisation | 🧩 split a 2 MB bundle · 🧩 keep INP under 200 ms on a heavy table *(budget)* · ⚖ a worker vs the main thread for three tasks |
| 8 | Accessibility and Internationalisation at the Design Level | semantic structure, focus management for SPA routes, live regions, right-to-left text, locale formatting | 🔍 spot the accessibility blockers in a design · 🧩 accessible route changes *(spec reading)* · 📐 an i18n plan for 12 locales |
| 9 | Offline and PWAs | service workers, cache strategies (cache-first, network-first, stale-while-revalidate), background sync, conflict handling | ⚖ the cache strategy per resource · 🧩 an offline-first notes app *(conflict)* · 🔢 the service worker update lifecycle |
| 10 | Front-end Security | XSS, CSRF, CSP, clickjacking, token storage, dependency risk | 🔍 spot the XSS sinks · 📐 a CSP for an app with a third-party widget *(trade-off)* · ⚖ token storage options |
| R2 | Briefing Room II | lessons 6–10 | 🧩 a page-speed gauntlet · 🔍 a security review · 🧷 RADIO for a weather dashboard |

### Cases
Each is played Mark I first. Stations run in the order ❓ → 🧮 → 🧩 → 📐 → 💻 → 🚨 → 🧷.

| # | Case | Pepper's hidden requirements (revealed by the right questions) | Targets (performance lab) | Must-haves (rubric) | Deep dive (💻) | Fury's curveballs |
|---|---|---|---|---|---|---|
| C1 | **Autocomplete** *(guided)* | results under 100 ms perceived; works on mobile; recent searches; keyboard only | INP ≤ 200 ms; results paint ≤ 100 ms after cache hit | debounce; client cache (LRU); cancel stale requests; combobox ARIA; highlight matches; empty and error states | a race-safe debounced fetch with an LRU cache | slow network (3G); a burst of out-of-order responses; 10× the result size |
| C2 | **News Feed** (Facebook/Twitter) | infinite; mixed media; new posts arrive live; likes and comments inline | LCP ≤ 2.5 s; CLS ≤ 0.1; INP ≤ 200 ms on 1,000 items | cursor pagination; normalised store; virtualisation; image placeholders with dimensions; optimistic like; "new posts" pill, not auto-insert | a virtualised feed with variable-height posts | a celebrity post with 50k comments; offline then online; a slow image CDN |
| C3 | **Pinterest** | masonry grid; huge images; save to boards; infinite scroll | LCP ≤ 2.5 s; CLS = 0 on load; memory bounded at 2,000 pins | masonry with known aspect ratios; responsive images (`srcset`, AVIF/WebP); lazy loading plus a priority hint for the first row; virtualised masonry; prefetching the next page | a masonry layout algorithm (shortest column first) | the window resized to mobile; 10,000 pins scrolled; image 404s |
| C4 | **Chat with Presence** (Messenger/Slack) | 1:1 and group; read receipts; typing; offline send queue | message visible ≤ 100 ms after send; reconnect ≤ 5 s | WebSocket with reconnect and backoff; client message ids and de-duplication; ordering by server sequence; optimistic send with retry; presence via heartbeats; virtualised history | reconnect, de-duplicate and reorder a message stream | a network flap mid-send; 500 unread messages; a group of 5,000 |
| C5 | **E-commerce Product and Checkout** (Amazon) | SEO matters; price and stock change; guest checkout; payment provider redirect | LCP ≤ 2.0 s on mobile; checkout INP ≤ 200 ms | server or static rendering for product pages with a client-side checkout; stock shown as fresh data; idempotent order submission (double-click safe); form validation; payment redirect states | an idempotent, double-submit-proof checkout button and state machine | a flash sale (stock races); the payment provider times out; the cart on two tabs |
| C6 | **Google Docs** (collaborative editor client) | real-time co-editing; cursors of others; offline edits; comments; version history | remote edit visible ≤ 200 ms; no lost edits | an OT or CRDT model (with the trade-off chosen); a local operation buffer; presence cursors; reconnect and rebase; autosave states | an OT transform for concurrent inserts and deletes | two users edit the same word; offline for 10 minutes; a 300-page document |
| C7 | **Netflix Player** (video streaming client) | quick start; adaptive quality; resume position; subtitles; TV and mobile | time to first frame ≤ 2 s; rebuffer ratio ≤ 1% | HLS/DASH segments; adaptive bitrate on throughput plus buffer; a buffer target; preloading the next episode; accessible controls; captions | a bitrate-selection rule against a bandwidth trace | bandwidth drops 80% mid-show; a seek to an unbuffered part; the CDN edge fails |
| C8 | **Photo Upload and Gallery** (Instagram/Google Photos) | big uploads on mobile; resumable; previews; albums | upload resumes after a drop; gallery LCP ≤ 2.5 s | chunked, resumable uploads; client-side resize and preview; progress and retry; a thumbnail grid with lazy loading; EXIF orientation | chunked upload with resume (MSW) | the network drops at 70%; 500 photos at once; a HEIC file |
| C9 | **Airbnb-style Search** (map, filters, results) | the map and list stay in sync; filters in the URL; shareable links | INP ≤ 200 ms when panning the map | URL as the source of truth for state; debounced map-bounds queries; clustered markers; list ↔ map hover sync; cancelled stale queries | URL-synced filter state with back/forward support | 10,000 markers; a fast pan; a filter combination with no results |
| C10 | **A Design System for 12 Teams** | themes per product; accessibility built in; versioning without breaking teams | adoption over migration effort | design tokens pipeline; headless and styled layers; semantic versioning and codemods; accessibility contracts; docs and visual regression tests | a token pipeline (source → CSS variables → TS types) | a breaking change needed in Button; a team on an old version; dark mode in a week |
| C11 | **Micro-frontends Platform** | independent deploys; shared shell; teams own routes | a shell's LCP unchanged by remotes | the composition choice (build-time, runtime Module Federation, iframes) with the trade-off; shared dependencies as singletons; contracts between apps; a fallback when a remote fails | runtime loading of a remote, with a fallback | two remotes need different React versions; a remote's deploy breaks; bundle duplication |
| R3 | Briefing Room III | the cases so far | 🔍 spot the flaws in a peer's feed design · 🧷 RADIO assembly at speed · ⚖ the rendering choice for three cases | | | |
| 🏁 | **Trial: The Brief (front end)** | a random unseen case from a hidden pool (for example, a spreadsheet, a poll, Trello, Google Calendar, a stock dashboard), with a blank canvas and RADIO time boxes | | | | |

## Phase 5: The Helicarrier (backend system design)
*Requires Phases 3 and 4. Ends able to lead any classic backend design round, from requirements to estimates to deep dives.*

### Lessons

| # | Lesson | Concepts | Exercises |
|---|---|---|---|
| 1 | Estimation at Scale | daily users → requests a second, peak factors, read/write ratios, storage over years, bandwidth, the number of servers | 🧮 a social app · 🧮 a video platform *(units trap)* · 🧮 a messaging app at a billion messages a day |
| 2 | API Design | REST vs GraphQL vs gRPC, resource modelling, pagination, filtering, versioning, errors, idempotency | 📐 a REST API for tickets · ⚖ GraphQL vs REST for a mobile client *(trade-off)* · 📐 a versioning plan |
| 3 | Unique IDs and Time | auto-increment vs UUID vs Snowflake, clocks, ordering | ⚖ the ID scheme for four systems · 💻 a Snowflake-style generator *(edge case: clock skew)* · 🔮 sorting by ID vs by time |
| 4 | Blob Storage and Media Pipelines | object stores, presigned URLs, multipart upload, processing pipelines, CDN delivery | 🗺 an image upload pipeline · 🗺 move uploads off your servers with presigned URLs *(trade-off)* · 🗺 a thumbnail pipeline via a queue |
| 5 | Geo and Time Data | geohash, quadtrees, time-series storage, retention | 🔮 which geohash cells cover a radius · 🗺 a nearby-search index *(trade-off)* · 📐 a metrics retention plan |
| R1 | Briefing Room I | lessons 1–5 | 🧮 an estimation sprint · 📐 an API review · 🗺 a media pipeline repair |

### Cases
Each is played Mark I first. Stations run in the order ❓ → 🧮 → 🗺 → 📐 → 💻 → 🚨 → 🧷.

| # | Case | Hidden requirements | Simulation targets | Must-haves (rubric) | Deep dive (💻) | Fury's curveballs |
|---|---|---|---|---|---|---|
| B1 | **URL Shortener** *(guided)* | 100M new links a month; read:write 100:1; custom aliases; expiry; analytics | redirect p99 ≤ 50 ms; 99.9% available | a key-generation strategy (counter + base62, or a pre-generated pool); a key-value store; cache for hot links; 301 vs 302 chosen with a reason; async click analytics | base62 encode and decode, and a collision-safe generator | a viral link (hot key); the cache cluster restarts; analytics write spikes |
| B2 | **Rate Limiter** (distributed) | per user and per API key; several tiers; across many gateway nodes | decision ≤ 5 ms; accuracy within 5% | the algorithm chosen (token bucket or sliding window); a shared counter store (Redis) with atomic operations; behaviour if the limiter fails (fail open vs closed); 429 with retry-after | a sliding-window counter | the Redis node dies; clock skew between gateways; a burst at the window edge |
| B3 | **Notification System** | push, email and SMS; user preferences; retries; no duplicates | send ≤ 30 s at p99; no lost notifications | a queue per channel; a preferences service; idempotency on send; retries with backoff and a dead-letter queue; templating; rate limits to providers | idempotent send with de-duplication keys | a provider outage; a 10M-user broadcast; a user unsubscribes mid-send |
| B4 | **News Feed Backend** | 300M daily users; follow graph; ranking; celebrities | feed load p99 ≤ 200 ms | fan-out on write for normal users, on read for celebrities (hybrid); a feed cache; a post store; cursor pagination; ranking as a separate step | the hybrid fan-out decision rule | a celebrity with 50M followers posts; a cache wipe; the ranking service slows |
| B5 | **Typeahead Service** | top-10 suggestions; updates hourly; multiple languages | p99 ≤ 30 ms | a trie, or a prefix → top-k table; precomputed top-k; a cache by prefix; batch rebuilds from logs; sharding by prefix | top-k suggestions from a trie | a trending term spikes; one prefix shard is hot; a rebuild job fails |
| R2 | Briefing Room II | B1–B5 | 🔍 spot the flaws in a feed design · 🧷 assembly at speed · 🧮 an estimation gauntlet | | | |
| B6 | **Chat System** (WhatsApp) | 1:1 and groups; delivery and read receipts; offline delivery; multi-device | message delivery p99 ≤ 300 ms; no lost messages | WebSocket gateways with a session registry; a message store keyed by conversation; sequence numbers per conversation; an offline queue and push; receipts; group fan-out limits | per-conversation ordering with sequence numbers | a gateway node dies with 1M connections; a group of 5,000; a user on 3 devices |
| B7 | **Pinterest Backend** | pins, boards and follows; a home feed; image storage at scale | home feed p99 ≤ 250 ms; images via CDN | an object store and CDN for images; a metadata store; a home feed (precomputed and cached); search for pins; a sharded graph store | feed precompute batching | a viral pin; image processing backs up; a board with 1M pins |
| B8 | **Google Docs Collaboration Server** | real-time co-editing; history; permissions; offline sync | edit round-trip p99 ≤ 150 ms | a collaboration server per document (sticky routing); OT or CRDT chosen with the trade-off; an operation log plus snapshots; presence; permissions checked per operation | server-side OT rebase of a pending operation | the document's server crashes; 100 editors at once; a long-offline client reconnects |
| B9 | **Video Streaming** (Netflix/YouTube) | upload, transcoding, global playback, recommendations | start ≤ 2 s; rebuffering ≤ 1%; transcode ≤ 1 hour | upload to an object store; a transcoding pipeline via queues (into multiple bitrates and segments); a CDN (with an Open Connect–style edge cache); a metadata service; view counts asynchronous | a transcoding job orchestrator (a fan-out of segments) | a premiere surge; an edge region fails; a transcode backlog |
| B10 | **Proximity Service** (Uber/Yelp) | nearby search; drivers move every 4 seconds; matching | nearby query p99 ≤ 100 ms; location write throughput | geohash or quadtree indexes; an in-memory location store for moving drivers; a write path separate from the read path; matching as its own service | nearby search over geohash neighbours | a stadium event (hot cell); drivers crossing cell borders; a region outage |
| R3 | Briefing Room III | B6–B10 | 🔍 a peer's chat design · 🚨 an incident drill · 🧷 assembly | | | |
| B11 | **Ticket Booking** (BookMyShow/Ticketmaster) | seat maps; a hold for 10 minutes; flash sales; no double booking | 0 double bookings; hold p99 ≤ 200 ms | seat holds with expiry (a lock with TTL, or a reservation row); a transaction with optimistic or pessimistic locking; a virtual waiting room for spikes; idempotent payment | seat hold and release with TTL, race-safe | 1M users for 50k seats; a payment timeout during the hold; a hold expiry storm |
| B12 | **Payment System** | charges, refunds, payouts; external providers; reconciliation | 0 double charges; every transaction auditable | idempotency keys end to end; a double-entry ledger; states (pending, settled, failed) in a state machine; provider webhooks with verification; reconciliation jobs; the outbox pattern | a double-entry ledger with an idempotent post | a webhook arrives twice; the provider is slow; a partial refund races a charge |
| B13 | **Distributed Key-Value Store** (Dynamo-style) | tunable consistency; always writable; billions of keys | p99 ≤ 10 ms; survives a node loss | consistent hashing with virtual nodes; replication factor N with quorums R/W; hinted handoff; conflict resolution (vector clocks or last-writer-wins, with the trade-off); gossip failure detection | quorum read and write with read repair | a node dies; a network partition; a hot key |
| B14 | **Web Crawler** | a billion pages a month; politeness; freshness; de-duplication | throughput target; zero politeness violations | a URL frontier with per-host queues; politeness delays; de-duplication (URL hashing, content fingerprints); parsers as workers; robots.txt; storage | a politeness-aware frontier | a crawler trap; one huge site; DNS slowdowns |
| B15 | **Leaderboard and Top-K** (gaming) | real-time ranks; millions of players; daily and all-time boards | rank lookup p99 ≤ 50 ms | sorted sets (Redis) or a sharded approximation; time-windowed boards; batching updates; ties | top-k with a heap over sharded partial results | a tournament surge; one shard down; cheating spikes |
| 🏁 | **Trial: The Brief (backend)** | a random unseen case from a hidden pool (for example, Dropbox, Google Calendar, a Twitter search, an ad-click aggregator, a stock exchange matching engine), with a blank canvas and time boxes | | | | |

## Phase 6: Endgame (the lead and the loop)
*Requires Phases 4 and 5. Ends able to pass a full senior or lead loop, and to make lead-level calls on migration, reliability, cost and incidents.*

| # | Lesson | Concepts | Exercises |
|---|---|---|---|
| 1 | Full-Stack Cases | designing the front end and backend together; the contract between them | 🗺🧩 Slack end to end · 🗺🧩 Trello with real-time boards *(consistency)* · 🗺🧩 Google Calendar with sharing |
| 2 | Migrations Without a Big Bang | the strangler fig, dual writes and backfills, feature flags, shadow traffic, rollback plans | 🔢 order a database migration safely · 🗺 strangle a monolith route by route *(risk)* · 🔢 a micro-frontend migration plan |
| 3 | Multi-Region and Disaster Recovery | active-passive vs active-active, RPO and RTO, data residency, failover | ⚖ RPO and RTO for four businesses · 🗺 survive a region loss *(failure)* · 🚨 a regional failover drill |
| 4 | Cost-Aware Architecture | cost models, egress, caching vs compute, storage tiers, autoscaling | 🧮 the monthly cost of a design · 🗺 cut cost 40% without missing targets *(trade-off)* · ⚖ reserved vs on-demand vs spot |
| 5 | Build vs Buy, and Decision Records | evaluation criteria, lock-in, architecture decision records (ADRs, chosen from structured options) | ⚖ build or buy for search, auth and payments · 🧷 assemble an ADR from chips *(structure)* · 🔍 spot the bias in a vendor pitch |
| R1 | Briefing Room I | lessons 1–5 | 🗺 a mixed lead-level scenario · 🔢 migration ordering · 🧮 a cost sprint |
| 6 | Incident Command | roles, the first ten minutes, mitigation before root cause, communication order, blameless post-mortems | 🚨 a database overload · 🚨 a bad deploy with partial rollback *(pressure)* · 🔢 a post-mortem's action items, prioritised |
| 7 | Reviewing Designs | reading someone else's design, flagging risks, asking the right question | 🔍 three flawed designs · 🔍 a design with one critical flaw hidden among many minor ones *(prioritising)* · 🔍 a front-end and backend mismatch |
| 8 | Release Engineering at Scale | monorepos and Nx, CI/CD, canary releases, feature flags, observability for the front end | 🔢 a canary rollout · 🗺 a pipeline for 20 teams *(scale)* · 🚨 a canary goes bad |
| 9 | Interview Strategy | time boxes, signposting, scoping to the time available, handling curveballs, choosing deep dives | 🧷 an ideal 45-minute plan for three cases · ❓ the five questions that matter most, at speed *(time pressure)* · 🧷 recover from a curveball |
| R2 | Briefing Room II | lessons 6–9 | 🚨 a mixed incident · 🔍 a review gauntlet · 🧷 strategy at speed |
| 10–12 | **Mock Loops I–III** | full rounds under time: machine coding (60 minutes), front-end design (45 minutes), backend design (45 minutes) | each loop draws unseen cases from hidden pools; the Readiness meter updates |
| 🏁 | **Trial: The Final Battle** | | Three rounds back to back, all against the clock. A machine-coding build. A front-end case. A backend case with Ultron's curveballs. Graded in zones, with a full after-action report. |

---

## Coverage check (nothing a senior or lead loop expects is missing)

| Standard prep list | Where it's covered |
|---|---|
| **GreatFrontEnd / Front End Interview Handbook, front-end system design:** news feed, autocomplete, Pinterest, chat, e-commerce, image carousel, poll widget, video player, Google Docs, photo sharing, travel booking | C1–C9; the carousel and poll appear in Phase 4's lessons and Trial pool |
| **Front-end fundamentals:** rendering strategies, state, performance (Core Web Vitals), accessibility, internationalisation, offline, security | Phase 4, lessons 2–10; Phase 1, lessons 9–11 |
| **Machine coding (BFE.dev / GreatFrontEnd):** debounce, throttle, the Promise combinators, a promise pool, retry, deep clone, curry, LRU, EventEmitter, infinite scroll, virtualised list, nested comments, kanban, autocomplete UI, modal and tabs, `useFetch`, forms | Phase 2, all lessons and the Trial |
| **Alex Xu, *System Design Interview* Volumes 1 and 2:** rate limiter, consistent hashing, key-value store, unique IDs, URL shortener, web crawler, notifications, news feed, chat, autocomplete, YouTube, Google Drive, proximity, nearby friends, Google Maps, distributed message queue, metrics monitoring, ad-click aggregation, hotel reservation, email, object storage, real-time leaderboard, payment system, digital wallet, stock exchange | B1–B15; Phase 3, lessons 8, 9, 12 and 15; Phase 5, lessons 3–5; Google Drive, ad-click aggregation and the stock exchange are in the Trial pools |
| **Distributed-systems vocabulary (*Designing Data-Intensive Applications*):** replication, partitioning, transactions and isolation, consistency and consensus (conceptually), streams | Phase 3, lessons 6–11 |
| **Networking (*High Performance Browser Networking*):** TCP, TLS, HTTP/1–3, WebSockets, Server-Sent Events | Phase 1, lessons 2–8; Phase 3, lesson 13 |
| **Lead-level:** migrations, disaster recovery, cost, build vs buy, incidents, design review, release engineering | Phase 6, lessons 1–8 |
| **Interview performance:** RADIO, time boxes, curveballs, timed mocks | Phase 4, lesson 1; Phase 6, lesson 9; every Brief and mock loop |
