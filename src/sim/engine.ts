// The design-table simulation: a deterministic, time-stepped flow model.
//
// Every simulated second, each traffic class flows from the clients through the
// wired graph. Nodes accumulate load; load over capacity becomes errors; load near
// capacity becomes queueing latency. There is no randomness at all, so the same
// design always gets the same result - grading is reproducible.
import { CAPACITY, COMPONENTS, monthlyCost, withDefaults } from "./components";
import type { Design, DesignNode, Scenario, SettingValue, SimResult, TrafficClass } from "./types";

/** How long a restarted cache takes to warm back up, in seconds. */
const WARM_UP = 20;

type Settings = Record<string, SettingValue>;

interface NodeState {
  node: DesignNode;
  s: Settings;
  /** Replicas lost to failures. */
  lost: number;
  /** Down until this second (restart), or forever (kill with no replicas left). */
  downUntil: number;
  /** For caches: second the cache came back cold. */
  coldSince: number;
}

interface Load {
  /** Requests a second handled by the node (reads for stores). */
  reads: number;
  writes: number;
  /** For key-value stores: reads landing on the hottest partition. */
  hotReads: number;
  /** For SQL: reads by unindexed columns (they cost 20x). */
  slowReads: number;
}

/** A path a request can take, with its probability. `write` marks store writes. */
interface Branch {
  prob: number;
  hops: { id: string; write?: boolean; slow?: boolean }[];
  /** No route to a handler at all. */
  dead?: boolean;
}

const num = (s: Settings, key: string, fallback: number) => {
  const v = Number(s[key]);
  return Number.isFinite(v) ? v : fallback;
};

function multiplierAt(scenario: Scenario, t: number): number {
  let x = 1;
  for (const step of scenario.shape ?? []) if (t >= step.at) x = step.x;
  return x;
}

export function indexedColumns(s: Settings): string[] {
  return String(s.indexes ?? "id")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

export function simulate(design: Design, scenario: Scenario): SimResult {
  const states = new Map<string, NodeState>();
  for (const node of design.nodes) {
    states.set(node.id, { node, s: withDefaults(node), lost: 0, downUntil: -1, coldSince: -Infinity });
  }
  const out = new Map<string, string[]>();
  for (const e of design.edges) {
    if (!states.has(e.from) || !states.has(e.to)) continue;
    out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  }
  const kindOf = (id: string) => states.get(id)!.node.kind;
  const next = (id: string) => out.get(id) ?? [];
  const replicasOf = (st: NodeState) => {
    const k = st.node.kind;
    const base =
      k === "kvstore" ? num(st.s, "partitions", 1) * num(st.s, "replicas", 1)
      : k === "sqldb" ? 1 + num(st.s, "read_replicas", 0)
      : num(st.s, "replicas", 1);
    return Math.max(0, base - st.lost);
  };
  const isDown = (st: NodeState, t: number) => st.downUntil > t || (st.lost > 0 && replicasOf(st) === 0);

  const workingSet = scenario.workingSetGb ?? 10;
  const hot = scenario.hotKey ?? 0;
  const notes = new Set<string>();
  const firstOverload = new Map<string, number>();

  // Totals across the run.
  const classStats = new Map<string, { worstP99: number; requests: number; errors: number }>();
  for (const c of scenario.classes) classStats.set(c.id, { worstP99: 0, requests: 0, errors: 0 });
  let totalRequests = 0;
  let totalErrors = 0;
  let goodSeconds = 0;
  let backlog = 0;
  let lostEvents = 0;
  const timeline: SimResult["timeline"] = [];
  const peakUtil: Record<string, number> = {};

  for (let t = 0; t < scenario.duration; t++) {
    // ---- failures ----
    for (const f of scenario.failures ?? []) {
      if (f.at !== t) continue;
      const st = states.get(f.target) ?? [...states.values()].find((x) => x.node.kind === f.target);
      if (!st) continue;
      if (f.kind === "kill") {
        st.lost += 1;
        notes.add(`At ${t}s, one ${COMPONENTS[st.node.kind].name.toLowerCase()} node (${st.node.label ?? st.node.id}) died.`);
      } else {
        st.downUntil = t + (f.down ?? 5);
        st.coldSince = st.downUntil;
        notes.add(`At ${t}s, ${st.node.label ?? st.node.id} restarted and came back empty (cold).`);
      }
    }

    const mult = multiplierAt(scenario, t);
    const loads = new Map<string, Load>();
    const load = (id: string) => {
      let l = loads.get(id);
      if (!l) loads.set(id, (l = { reads: 0, writes: 0, hotReads: 0, slowReads: 0 }));
      return l;
    };
    const cacheHit = (st: NodeState): number => {
      if (isDown(st, t)) return 0;
      const memory = num(st.s, "memory_gb", 4) * replicasOf(st);
      let base = Math.min(1, memory / workingSet) * 0.97;
      const ttl = num(st.s, "ttl_s", 0);
      if (ttl > 0 && ttl < 60) base *= 0.8; // very short TTLs expire hot entries constantly
      let hit = hot + (1 - hot) * base;
      const warm = Math.min(1, (t - st.coldSince) / WARM_UP);
      if (warm < 1) {
        hit *= Math.max(0, warm);
        notes.add(`The cache was cold after its restart, so misses fell through to the database (a stampede).`);
      }
      return hit;
    };

    // ---- route every class, building branches and loads ----
    const classBranches = new Map<string, Branch[]>();
    const route = (id: string, c: TrafficClass, rps: number, prob: number, hops: Branch["hops"]): Branch[] => {
      const st = states.get(id)!;
      const here = [...hops, { id }];
      const kind = st.node.kind;
      if (kind === "cdn") {
        load(id).reads += rps;
        const canCache = c.op === "read" && c.cacheable && st.s.cache_reads && num(st.s, "ttl_s", 0) > 0 && !isDown(st, t);
        const hit = canCache ? hot + (1 - hot) * 0.9 : 0;
        const branches: Branch[] = hit > 0 ? [{ prob: prob * hit, hops: here }] : [];
        const missRps = rps * (1 - hit);
        const downstream = next(id);
        if (downstream.length === 0) return [...branches, { prob: prob * (1 - hit), hops: here, dead: true }];
        for (const d of downstream) branches.push(...route(d, c, missRps / downstream.length, (prob * (1 - hit)) / downstream.length, here));
        return branches;
      }
      if (kind === "lb") {
        load(id).reads += rps;
        const downstream = next(id).filter((d) => !isDown(states.get(d)!, t));
        const all = next(id);
        if (all.length === 0) return [{ prob, hops: here, dead: true }];
        const targets = downstream.length ? downstream : all; // all dead: errors flow to a dead node
        return targets.flatMap((d) => route(d, c, rps / targets.length, prob / targets.length, here));
      }
      if (kind === "service") {
        load(id).reads += rps;
        return dataPath(id, c, rps, prob, here);
      }
      // Clients wired straight to a store, cache or queue: treat it as the handler.
      load(id).reads += rps;
      return [{ prob, hops: here }];
    };

    const dataPath = (serviceId: string, c: TrafficClass, rps: number, prob: number, hops: Branch["hops"]): Branch[] => {
      const downstream = next(serviceId);
      const stores = downstream.filter((d) => ["kvstore", "sqldb", "objectstore"].includes(kindOf(d)));
      const caches = downstream.filter((d) => kindOf(d) === "cache");
      const queues = downstream.filter((d) => kindOf(d) === "queue");
      const store = stores[0];

      // Side effects (events) - asynchronous through a queue, or synchronous to the store.
      let syncWrite = false;
      for (const em of c.emits ?? []) {
        const evRps = rps * em.ratio;
        if (queues.length) {
          const q = queues[0];
          load(q).writes += evRps;
          const workers = next(q).filter((w) => kindOf(w) === "worker");
          const capacity = workers.reduce((sum, w) => sum + (isDown(states.get(w)!, t) ? 0 : replicasOf(states.get(w)!) * CAPACITY.worker), 0);
          const processed = Math.min(evRps, capacity);
          backlog += evRps - processed;
          if (backlog > 0) {
            const drained = Math.min(backlog, Math.max(0, capacity - evRps));
            backlog -= drained;
          }
          for (const w of workers) {
            const sink = next(w).find((d) => ["kvstore", "sqldb", "objectstore"].includes(kindOf(d)));
            if (sink) load(sink).writes += processed / workers.length;
          }
          if (workers.length === 0) {
            backlog += evRps;
            notes.add("Events pile up in the queue: nothing consumes them.");
          }
        } else if (store) {
          load(store).writes += evRps;
          syncWrite = true;
          notes.add(`Every ${c.label.toLowerCase()} also writes its ${em.event} event to the database before answering.`);
        } else {
          lostEvents += evRps;
          notes.add(`${em.event} events are lost: there is nowhere to put them.`);
        }
      }
      const withSync = (b: Branch): Branch => (syncWrite && store ? { ...b, hops: [...b.hops, { id: store, write: true }] } : b);

      if (!store) {
        if (c.op === "read" && caches.length) {
          const hit = cacheHit(states.get(caches[0])!);
          load(caches[0]).reads += rps;
          return [
            withSync({ prob: prob * hit, hops: [...hops, { id: caches[0] }] }),
            { prob: prob * (1 - hit), hops: [...hops, { id: caches[0] }], dead: true },
          ];
        }
        return [{ prob, hops, dead: true }];
      }

      const stStore = states.get(store)!;
      const slowLookup =
        stStore.node.kind === "sqldb" && !!c.lookup && c.lookup !== "id" && !indexedColumns(stStore.s).includes(c.lookup.toLowerCase());
      if (slowLookup) notes.add(`Looking up by "${c.lookup}" scans the whole table: that column has no index.`);

      if (c.op === "write") {
        load(store).writes += rps;
        return [withSync({ prob, hops: [...hops, { id: store, write: true }] })];
      }
      // Reads: cache-aside if there's a cache.
      const addStoreRead = (missRps: number) => {
        const l = load(store);
        l.reads += missRps;
        if (slowLookup) l.slowReads += missRps;
        // The hot key's misses all land on one partition - unless a warm cache absorbs them.
        const cacheState = caches.length ? states.get(caches[0])! : null;
        const cacheWarm = cacheState && !isDown(cacheState, t) && t - cacheState.coldSince >= WARM_UP;
        const hotShare = cacheWarm ? 0 : hot;
        l.hotReads += missRps * hotShare;
      };
      if (caches.length) {
        const cache = caches[0];
        const hit = cacheHit(states.get(cache)!);
        if (!isDown(states.get(cache)!, t)) load(cache).reads += rps;
        addStoreRead(rps * (1 - hit));
        return [
          withSync({ prob: prob * hit, hops: [...hops, { id: cache }] }),
          withSync({ prob: prob * (1 - hit), hops: [...hops, ...(isDown(states.get(cache)!, t) ? [] : [{ id: cache }]), { id: store, slow: slowLookup }] }),
        ];
      }
      addStoreRead(rps);
      return [withSync({ prob, hops: [...hops, { id: store, slow: slowLookup }] })];
    };

    const clients = design.nodes.filter((n) => n.kind === "client");
    for (const c of scenario.classes) {
      const rps = c.rps * mult;
      const entry = clients.flatMap((cl) => next(cl.id));
      const branches: Branch[] = entry.length
        ? entry.flatMap((e) => route(e, c, rps / entry.length, 1 / entry.length, []))
        : [{ prob: 1, hops: [], dead: true }];
      classBranches.set(c.id, branches);
    }

    // ---- utilisation, errors and latency per node ----
    const util = new Map<string, number>();
    const nodeErr = new Map<string, number>();
    const nodeP99 = new Map<string, { read: number; write: number }>();
    let hottest = "";
    let hottestUtil = 0;
    for (const [id, st] of states) {
      const l = loads.get(id) ?? { reads: 0, writes: 0, hotReads: 0, slowReads: 0 };
      const r = replicasOf(st);
      const down = isDown(st, t);
      let u = 0;
      switch (st.node.kind) {
        case "cdn": u = l.reads / CAPACITY.cdn; break;
        case "lb": u = l.reads / (CAPACITY.lb * Math.max(1, r)); break;
        case "service": u = r ? l.reads / (CAPACITY.service * r) : Infinity; break;
        case "cache": u = r ? l.reads / (CAPACITY.cache * r) : Infinity; break;
        case "queue": u = l.writes / CAPACITY.queue; break;
        case "worker": u = 0; break;
        case "objectstore": u = (l.reads + l.writes) / CAPACITY.objectstore; break;
        case "kvstore": {
          const partitions = num(st.s, "partitions", 1);
          const copies = Math.max(1, num(st.s, "replicas", 1) - st.lost / Math.max(1, partitions));
          const coldReads = l.reads - l.hotReads;
          const hottestPartition = l.hotReads + coldReads / partitions;
          u = hottestPartition / (CAPACITY.kvRead * copies) + l.writes / partitions / CAPACITY.kvWrite;
          if (l.hotReads > 0 && hottestPartition / (CAPACITY.kvRead * copies) > 0.8) {
            notes.add("One partition is hot: a single key gets a big share of the traffic.");
          }
          break;
        }
        case "sqldb": {
          const fastReads = l.reads - l.slowReads;
          const readCap = CAPACITY.sqlRead * Math.max(1, 1 + num(st.s, "read_replicas", 0) - st.lost);
          u = (fastReads + l.slowReads * 20) / readCap + l.writes / CAPACITY.sqlWrite;
          break;
        }
        default: u = 0;
      }
      if (down) u = Infinity;
      util.set(id, u);
      peakUtil[id] = Math.max(peakUtil[id] ?? 0, Number.isFinite(u) ? u : 99);
      const err = down ? 1 : u > 1 ? 1 - 1 / u : 0;
      nodeErr.set(id, err);
      if (u > 1 && Number.isFinite(u) && !firstOverload.has(id)) {
        firstOverload.set(id, t);
        notes.add(`At ${t}s, ${st.node.label ?? COMPONENTS[st.node.kind].name} was overloaded (${Math.round(u * 100)}% of capacity).`);
      }
      const capped = Math.min(Number.isFinite(u) ? u : 0.95, 0.95);
      const factor = 1.5 + (3 * capped) / (1 - capped);
      const base = COMPONENTS[st.node.kind].latency;
      nodeP99.set(id, { read: base * factor, write: base * 2 * factor });
      if (Number.isFinite(u) && u > hottestUtil && st.node.kind !== "client") {
        hottestUtil = u;
        hottest = id;
      }
    }

    // ---- per-class latency and errors this second ----
    let stepRequests = 0;
    let stepErrors = 0;
    let stepP99 = 0;
    for (const c of scenario.classes) {
      const rps = c.rps * mult;
      let errProb = 0;
      let p99 = 0;
      let slowest = 0;
      for (const b of classBranches.get(c.id)!) {
        if (b.dead) {
          errProb += b.prob;
          continue;
        }
        let survive = 1;
        let latency = 0;
        for (const h of b.hops) {
          survive *= 1 - (nodeErr.get(h.id) ?? 0);
          const p = nodeP99.get(h.id)!;
          latency += h.write ? p.write : h.slow ? p.read * 30 : p.read;
        }
        errProb += b.prob * (1 - survive);
        slowest = Math.max(slowest, latency);
        if (b.prob * survive >= 0.01) p99 = Math.max(p99, latency);
      }
      // When most requests fail, the few that succeed don't define the experience:
      // report the slowest path (or "never answers" if nothing gets through).
      if (errProb >= 0.5) p99 = Math.max(p99, slowest, 10_000);
      const stats = classStats.get(c.id)!;
      stats.worstP99 = Math.max(stats.worstP99, p99);
      stats.requests += rps;
      stats.errors += rps * errProb;
      stepRequests += rps;
      stepErrors += rps * errProb;
      stepP99 = Math.max(stepP99, p99);
    }
    totalRequests += stepRequests;
    totalErrors += stepErrors;
    const stepErrorRate = stepRequests ? stepErrors / stepRequests : 0;
    if (stepErrorRate < 0.01) goodSeconds++;
    timeline.push({
      t,
      p99: Math.round(stepP99 * 10) / 10,
      errorRate: stepErrorRate,
      hottest: hottest ? states.get(hottest)!.node.label ?? hottest : "",
      utilisation: hottestUtil,
    });
  }

  if (backlog > 1) notes.add(`${Math.round(backlog).toLocaleString()} events were still waiting in the queue at the end.`);

  const classes: SimResult["classes"] = {};
  for (const [id, s] of classStats) {
    classes[id] = { p99: Math.round(s.worstP99 * 10) / 10, errorRate: s.requests ? s.errors / s.requests : 0 };
  }
  return {
    scenarioId: scenario.id,
    classes,
    errorRate: totalRequests ? totalErrors / totalRequests : 0,
    availability: scenario.duration ? goodSeconds / scenario.duration : 1,
    costPerMonth: design.nodes.reduce((sum, n) => sum + monthlyCost({ ...n, settings: withDefaults(n) }), 0),
    backlog: Math.round(backlog),
    lostEvents: Math.round(lostEvents),
    peakUtil,
    timeline,
    notes: [...notes],
  };
}
