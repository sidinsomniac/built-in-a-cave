# Story Bible

> This is a personal, non-commercial fan project. The Marvel cast appears as quest-givers; every mystery, line and case is original. All franchise names live in `src/lore/`.

## The world
**Software is the suit.** Stark Industries runs on systems: the suits' heads-up display, the Stark Expo apps, S.H.I.E.L.D.'s briefing network, the Helicarrier. Each Phase, something fails at scale, and the only way through is a system that holds. **Clues come out of your work:** a test that passes, a simulation that turns green, a trace that shows the slow hop. You literally debug the plot.

## Rules for writing scenes
**The lesson is the meal; the story is the seasoning.** Story should be about a fifth of play time at most. It should make you want to build, then get out of the way.

**Plain words** (the validator enforces the first two):
- **At most 25 words a line** (40 for the narrator). Split a long line in two, or cut it.
- **No jargon the player hasn't met.** Every all-caps term (DNS, TTL, p99...) must be in `content/glossary.yaml`, which underlines its first use with a plain definition.
- Short sentences, everyday words. A character can be witty; they can't be cryptic.

**Shape of a lesson's story:**
- **Scene (3–7 lines):** the hook. Something is broken or strange, and it's personal to someone. Use subtext: characters say less than they mean (Happy is defensive, Tony deflects with jokes, Fury never says please).
- **One mid-lesson beat (1–4 lines),** written as a ` ```scene ` block inside the lecture, at a checkpoint. It ties the idea just taught to the mystery ("so a near-zero TTL means...").
- **Clue:** one sentence that the player's own work reveals.
- **Outro (2–5 lines):** pays off the clue and points to the next lesson. Every lesson needs one.

**Character arcs stay consistent** (see *The cast* below). Plots and clues are fixed once built; later lessons build on them.

**Other rules:**
- **Every beat ends with a reason to build:** a clue, a failure, a dare.
- **No canon quote longer than a few words.** Characters speak in their own style, in new lines.
- **The mentor never answers.** JARVIS asks; Rhodey audits; Fury pressures; nobody hands over the design.
- **Running gags:**
  - "Is it DNS? It's always DNS." (Happy)
  - Tony renaming every component something grand.
  - Peter asking the question everyone was afraid to ask.
  - Shuri roasting slow pages.

## The cast
See [GDD.md](GDD.md#3-the-cast) for their roles. Arcs:
- **JARVIS** grows from a voice in the cave to your trusted co-pilot. In the Endgame, he hands you the controls: no hints in the final battle, by design.
- **Rhodey** starts by auditing everything you do. He ends by asking *you* to review *his* design (Phase 6, lesson 7).
- **Peter Parker** joins in Phase 2 as an intern. Later he becomes the junior you mentor (lead-level growth).
- **Ultron** is foreshadowed from Phase 3 (a "helpful" auto-scaler with opinions), revealed in Phase 5, and defeated in the Endgame.

---

## Phase 1: The Cave (*Dark Keynote*)
**The premise.** Your first day at Stark Industries. Tony is mid-keynote at the Stark Expo when the Expo app goes dark for half the planet. In the confusion, a power failure seals Tony in the sub-basement server vault, "the Cave", with nothing but an old terminal, JARVIS's voice and a box of scraps. You're the new engineer on the other end of the line. Every lesson teaches one layer of how the web works, and gets Tony one door closer to daylight.

**Suspects:**
- **Dummy**, Tony's clumsy robot arm, which was "tidying cables" in the vault (a red herring);
- **Happy**, who restarted "the internet box" (a red herring; it's always DNS, but not *his* DNS);
- **Hammer Industries' new contractor**, who "helped" with the Expo's network config last week.

**The truth.** Justin Hammer's contractor pushed three "optimisations":
- a DNS record with a broken TTL;
- an expired certificate on the API;
- a CORS rule that blocks the Expo's own front end.

Each alone was survivable. Together they took the app down worldwide. Hammer insists it was "a feature".

### Scene-by-scene
| Lesson | Where | Story beat | Clue your work reveals |
|---|---|---|---|
| Prologue | Stark Expo, then the vault | The keynote; the app dies on the big screen; the lights die too. JARVIS patches you through to Tony in the dark. | The mystery begins |
| 1 Clients and Servers | The vault terminal | Tony doesn't know what's broken: the phones or the servers? You trace one request. | The phones are fine. **The requests never reach the servers.** |
| 2 IP, Packets, Ports | The network closet | Packets are leaving, but are they arriving? | The packets go to **an address that isn't ours** |
| 3 DNS | The vault's dusty DNS console | Peter (on the phone): "How does a name even become a number?" | The Expo's DNS record was changed **last Tuesday**, with a near-zero TTL |
| 4 TCP and UDP | Fibre junction | Connections open and die. Handshake by handshake. | Once DNS is fixed, connections succeed, **then fail at the next layer** |
| 5 TLS and HTTPS | The certificate locker | "Connection not private." Tony: "Rude." | **The API certificate expired at midnight**; its renewal job was disabled |
| R1 | Briefing on the phone | Pepper lays out the timeline; Happy confesses he only restarted the router. | Happy is cleared. **All three changes trace to one contractor login.** |
| 6 HTTP Pt1 | The API gateway | Requests reach the API now, and get mysterious status codes. | The front end gets **403s, only from the browser** |
| 6 HTTP Pt2 | Same | Shuri drops in from Wakanda: "It's CORS. It's always CORS when it isn't DNS." | **A CORS rule allows only `hammer-industries.com`** |
| 7 HTTP/1.1, 2, 3 | Load-balancer room | The fixed app is slow on mobile. Why? | The edge was downgraded to **HTTP/1.1** by the same change set |
| 8 APIs and JSON | The Expo API console | You rebuild the ticket client properly. | The contractor's API keys are still active, **with "admin" scope** |
| R2 | The vault door's keypad | JARVIS needs the full request story to open the door. | Dummy is cleared (he only unplugged a lamp) |
| 9 Render Pipeline | The vault's last monitor | The Expo page finally loads, and stutters. | A Hammer "analytics" script **forces layout on every scroll** |
| 10 Event Loop | Same | The page freezes on tap. | The script **blocks the main thread for 900 ms**, every 5 s |
| 11 Browser Storage | The Expo kiosk | Kiosks still show the outage. | The kiosks **cached the broken config in localStorage** forever |
| 12 Latency Numbers | Fury, on a secure line | Fury: "How fast *should* this be?" | The proper latency budget says the Expo can **load in under 2 s** |
| 13 Estimation | Pepper's office | Re-launch day: how big must the Expo be? | A load estimate the old system **couldn't have survived anyway** |
| R3 | The vault door | The final lock: the click-to-pixel timeline, in order. | The door opens. Daylight. |
| 🏁 Trial | Stark Expo, relaunch | **Escape the Cave.** Find the failures, repair the client, estimate the load, wire the minimal system that survives the relaunch. | Hammer's contractor is caught. The Expo relaunches live, and holds. |

### Phase 1 beats, lesson by lesson (written before the content)
Each lesson's opening scene sets up the table above. Its mid-lesson beat and outro are:

| Lesson | Mid-lesson beat (at a checkpoint) | Outro (pays off the clue, points onward) |
|---|---|---|
| 1 Clients and Servers | Happy: "So the phone sends a request... and if nothing comes back?" JARVIS: it never left, never arrived, or was never answered. | JARVIS: the phones send perfectly good requests, and **none reach our servers**. Tony: "So they're going somewhere else." Happy, quietly: "...I did restart the internet box." |
| 2 IP, Packets, Ports | Tony: "Every packet carries a 'to' address. Whose address are ours carrying?" JARVIS: "Not ours, sir." | JARVIS: the packets go to **an address that isn't ours**. Tony: "Then something is handing out the wrong address." Peter: "Like a phone book with a typo?" JARVIS: "Like a phone book someone edited." |
| 3 DNS | (built) | (built) |
| 4 TCP and UDP | Tony: "Each new connection costs a round trip before anything useful?" JARVIS: "Before a single byte of the app, sir." | JARVIS: with DNS fixed, connections **complete, then fail at the very next step**: the secure part. Tony: "Of course it's the secure part." |
| 5 TLS and HTTPS | Happy: "Certificates expire? Like milk?" JARVIS: "Like milk. And someone switched off the reminder to buy more." | JARVIS: the API certificate **expired at midnight**; its renewal job was **switched off**, not broken. Tony: "Switched off." Pepper: "Briefing. Everyone. Now." |
| R1 Briefing Room I | Pepper lays out the timeline as the player rebuilds it. | Happy confesses he only restarted the router, and is cleared. JARVIS: **the DNS change and the disabled renewal job came from one login**: a contractor's. Tony: "Whose contractor?" Pepper: "Hammer's." |

**Outro.** Tony walks out of the vault squinting, and declares the outage "a stress test I designed". Pepper doesn't let him finish. Rhodey hands you your first audit badge. JARVIS: "Shall I prepare the workshop, sir? I suspect the suits will need software."

---

## Phases 2–6: arcs in outline
*Each Phase's scene-by-scene script is written when that Phase is built.*

### Phase 2: The Workshop (*Mark III*)
Tony is building the Mark III suit, and its HUD is a React app. The HUD glitches in flight: stale readings, flickering targets, frozen controls. These are race conditions, stale closures, missing cleanups and inaccessible controls.

Hammer's rival "drone HUD", built by **Ivan Vanko**, is suspiciously similar. Was the Stark code stolen, or are both teams making the same classic bugs? (Both, it turns out.)

Peter Parker joins as an intern and asks every question you were afraid to.

**Trial:** Mark III, a timed 90-minute build of the Expo ticket browser that must survive a live demo.

### Phase 3: The Arc Reactor (*Extremis*)
Stark Tower's arc-reactor grid runs on distributed services. Under load, parts of it overheat:
- hot shards;
- cache stampedes;
- replica lag;
- retry storms.

A rival think tank, **A.I.M.**, offers "Extremis" auto-scaling that fixes everything by... running everything hotter. Each lesson isolates one building block and shows how it fails, and how to tame it.

A helpful auto-scaler starts making decisions nobody approved: the first whisper of Ultron.

**Trial:** keep the reactor stable through an escalating, multi-failure night.

### Phase 4: S.H.I.E.L.D. Briefings (*Insight*)
Fury recruits you to rebuild S.H.I.E.L.D.'s front ends: feeds, chat, documents, video briefings. But something inside is leaking:
- tokens in local storage;
- XSS in a comment box;
- an over-permissive micro-frontend.

**HYDRA** has infiltrated the client layer. Each case is a briefing app you design properly, and each design closes one leak.

**Trial:** The Brief, an unseen case under Fury's clock, the night Project Insight goes live.

### Phase 5: The Helicarrier (*Age of Ultron*)
The Helicarrier's backend is a city of services: chat, payments, video, maps. Ultron is born in the network. He spreads through every single point of failure, every unbounded fan-out, every non-idempotent payment.

Each case hardens one system against him. He keeps asking, through Fury's curveballs: "What happens when *I* take this node?"

**Trial:** The Brief, an unseen backend case while Ultron attacks.

### Phase 6: Endgame (*The Snap*)
Half the infrastructure vanishes in an instant: a region, gone. You lead the recovery:
- disaster recovery;
- migrations without downtime;
- cost under pressure;
- incident command;
- reviewing other teams' plans.

Rhodey asks you to audit *his* design. Peter is now your junior.

**The Final Battle:** a three-round loop, with no hints. JARVIS hands you the controls.

**Epilogue:** your Readiness meter at 100%, and an "offer letter" from Stark Industries, signed by Pepper.

## Recurring set pieces
| Set piece | When | What happens |
|---|---|---|
| **The cold open** | Start of each Phase | A failure at scale that the Phase will teach you to fix |
| **Rhodey's audit** | After every submission | The zone, itemised, with Infinity Stone tags |
| **Fury's curveball** | Station 6 of every case | An incident on your own design |
| **Happy's pager** | Incident drills | Panic, comedy, then a runbook |
| **Shuri's lab** | Performance lessons | Roasts slow pages; teaches the fix with a question |
| **The Brief** | End of Phases 4–6 | A blank canvas and a clock |
