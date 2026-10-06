// Anti-pattern detectors and rubric checkers over a design graph.
// Rules find known-bad designs (Rhodey's ☠ items); rubric checkers confirm the
// must-haves and should-haves a case asks for (✓ / ⚠ / ✗).
import { withDefaults } from "./components";
import { indexedColumns } from "./engine";
import type { Design, DesignNode, NodeKind, Scenario } from "./types";

export type Stone = "time" | "space" | "reality" | "power" | "mind" | "soul";

export interface RuleHit {
  id: string;
  severity: "critical" | "major";
  stone: Stone;
  title: string;
  /** JARVIS's question, shown before a pass. Never the fix. */
  question: string;
  /** Rhodey's explanation, shown after a pass. */
  why: string;
  nodeIds: string[];
}

export interface RubricCheck {
  id: string;
  status: "covered" | "partial" | "missing";
  stone: Stone;
  title: string;
  question: string;
  why: string;
}

export interface DesignContext {
  /** Every traffic class in the case's scenarios. */
  classes: Scenario["classes"];
}

const STORES: NodeKind[] = ["kvstore", "sqldb", "objectstore"];

class Graph {
  readonly nodes: Map<string, DesignNode & { s: Record<string, unknown> }>;
  private readonly out = new Map<string, string[]>();
  constructor(design: Design) {
    this.nodes = new Map(design.nodes.map((n) => [n.id, { ...n, s: withDefaults(n) }]));
    for (const e of design.edges) {
      if (this.nodes.has(e.from) && this.nodes.has(e.to)) this.out.set(e.from, [...(this.out.get(e.from) ?? []), e.to]);
    }
  }
  of(kind: NodeKind) {
    return [...this.nodes.values()].filter((n) => n.kind === kind);
  }
  next(id: string) {
    return (this.out.get(id) ?? []).map((d) => this.nodes.get(d)!);
  }
  /** Nodes reachable from the clients, in breadth-first order. */
  reachable() {
    const seen = new Set<string>();
    const queue = this.of("client").map((c) => c.id);
    while (queue.length) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push(...(this.out.get(id) ?? []));
    }
    return [...seen].map((id) => this.nodes.get(id)!);
  }
}

const n = (v: unknown, fallback: number) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

// ---------------------------------------------------------------------------
// Anti-patterns
// ---------------------------------------------------------------------------

type Rule = (g: Graph, ctx: DesignContext) => RuleHit | null;

export const RULES: Record<string, Rule> = {
  no_datastore: (g) => {
    const services = g.reachable().filter((x) => x.kind === "service");
    const bad = services.filter((s) => !g.next(s.id).some((d) => STORES.includes(d.kind)));
    if (!services.length || !bad.length) return null;
    return {
      id: "no_datastore",
      severity: "critical",
      stone: "reality",
      title: "A service with nowhere to keep its data",
      question: "Where does this service read and write the data it serves? What happens to it on a restart?",
      why: "A stateless service needs a durable store behind it; memory alone loses everything on restart.",
      nodeIds: bad.map((b) => b.id),
    };
  },
  spof: (g) => {
    const reach = g.reachable();
    const bad = reach.filter((x) => {
      if (x.kind === "service") return n(x.s.replicas, 1) < 2;
      if (x.kind === "kvstore") return n(x.s.replicas, 1) < 2;
      if (x.kind === "sqldb") return n(x.s.read_replicas, 0) < 1;
      return false;
    });
    if (!bad.length) return null;
    return {
      id: "spof",
      severity: "major",
      stone: "space",
      title: "Single point of failure",
      question: "If this one machine dies at 3 a.m., what do your users see?",
      why: "Anything on the critical path needs a second copy (replicas, a standby or a replica set) so one failure isn't an outage.",
      nodeIds: bad.map((b) => b.id),
    };
  },
  cache_without_ttl: (g) => {
    const bad = g.reachable().filter((x) => x.kind === "cache" && n(x.s.ttl_s, 0) <= 0);
    if (!bad.length) return null;
    return {
      id: "cache_without_ttl",
      severity: "major",
      stone: "reality",
      title: "A cache with no expiry",
      question: "When the data changes, or a link expires, how does the cache ever find out?",
      why: "Without a TTL (or explicit invalidation) cached entries can stay wrong forever, and the cache grows until it evicts at random.",
      nodeIds: bad.map((b) => b.id),
    };
  },
  sync_side_effects: (g, ctx) => {
    const emitting = ctx.classes.some((c) => (c.emits ?? []).length > 0);
    if (!emitting) return null;
    const bad = g
      .reachable()
      .filter((x) => x.kind === "service" && !g.next(x.id).some((d) => d.kind === "queue") && g.next(x.id).some((d) => STORES.includes(d.kind)));
    if (!bad.length) return null;
    return {
      id: "sync_side_effects",
      severity: "major",
      stone: "time",
      title: "Slow side work inside the request",
      question: "Does the user have to wait for the analytics write before they're redirected? Could that work happen later?",
      why: "Side effects (analytics, emails, thumbnails) belong on a queue, so the request returns fast and spikes don't hit the main database.",
      nodeIds: bad.map((b) => b.id),
    };
  },
  unindexed_lookup: (g, ctx) => {
    const lookups = [...new Set(ctx.classes.map((c) => c.lookup).filter((l): l is string => !!l && l !== "id"))];
    const bad = g
      .reachable()
      .filter((x) => x.kind === "sqldb" && lookups.some((l) => !indexedColumns(x.s as Record<string, string>).includes(l.toLowerCase())));
    if (!bad.length) return null;
    return {
      id: "unindexed_lookup",
      severity: "major",
      stone: "time",
      title: "Lookups on an unindexed column",
      question: `How does the database find one row by ${lookups.join(" or ")} among billions? Does it have to look at every row?`,
      why: "Without an index, a lookup scans the table: slow, and it eats the database's capacity.",
      nodeIds: bad.map((b) => b.id),
    };
  },
  orphan_queue: (g) => {
    const bad = g.reachable().filter((x) => x.kind === "queue" && !g.next(x.id).some((d) => d.kind === "worker"));
    if (!bad.length) return null;
    return {
      id: "orphan_queue",
      severity: "major",
      stone: "power",
      title: "A queue nobody reads",
      question: "Who takes the jobs off this queue? What happens as it fills?",
      why: "A queue needs consumers (workers) that drain it into a store; otherwise the backlog grows until the queue rejects work.",
      nodeIds: bad.map((b) => b.id),
    };
  },
};

export function runRules(design: Design, ctx: DesignContext, enabled: string[]): RuleHit[] {
  const g = new Graph(design);
  return enabled.map((id) => RULES[id]?.(g, ctx) ?? null).filter((h): h is RuleHit => h !== null);
}

// ---------------------------------------------------------------------------
// Rubric checkers
// ---------------------------------------------------------------------------

type Checker = (g: Graph) => Pick<RubricCheck, "status"> & { detail?: string };

interface CheckerSpec {
  stone: Stone;
  title: string;
  question: string;
  why: string;
  check: Checker;
}

export const CHECKERS: Record<string, CheckerSpec> = {
  cache_hot_reads: {
    stone: "time",
    title: "Hot reads served from a cache",
    question: "Most links are read again and again. Must every read go all the way to the database?",
    why: "A cache in front of the store absorbs repeated reads (a 100:1 read ratio is mostly repeats), cutting latency and database load.",
    check: (g) => {
      const services = g.reachable().filter((x) => x.kind === "service");
      const caches = services.flatMap((s) => g.next(s.id).filter((d) => d.kind === "cache"));
      if (!caches.length) return { status: "missing" };
      return { status: caches.some((c) => n(c.s.ttl_s, 0) > 0) ? "covered" : "partial" };
    },
  },
  async_events: {
    stone: "time",
    title: "Analytics recorded asynchronously",
    question: "Where does each click get recorded, and does the user wait for it?",
    why: "Emitting click events to a queue, drained by workers into their own store, keeps redirects fast and protects the main store.",
    check: (g) => {
      const services = g.reachable().filter((x) => x.kind === "service");
      const queues = services.flatMap((s) => g.next(s.id).filter((d) => d.kind === "queue"));
      if (!queues.length) return { status: "missing" };
      const drained = queues.some((q) => g.next(q.id).some((w) => w.kind === "worker" && g.next(w.id).some((d) => STORES.includes(d.kind))));
      return { status: drained ? "covered" : "partial" };
    },
  },
  redundant_services: {
    stone: "space",
    title: "More than one copy of every service",
    question: "How many copies of the service sit behind the load balancer?",
    why: "Two or more replicas behind a load balancer survive a node loss and share the load.",
    check: (g) => {
      const services = g.reachable().filter((x) => x.kind === "service");
      if (!services.length) return { status: "missing" };
      const lb = g.reachable().some((x) => x.kind === "lb");
      const ok = services.every((s) => n(s.s.replicas, 1) >= 2);
      return { status: ok && lb ? "covered" : ok || lb ? "partial" : "missing" };
    },
  },
  replicated_store: {
    stone: "space",
    title: "The datastore survives a node loss",
    question: "If one database node dies, is the data - and the service - still there?",
    why: "Replicas (or replicated partitions) keep the data available and add read capacity.",
    check: (g) => {
      const stores = g.reachable().filter((x) => x.kind === "kvstore" || x.kind === "sqldb");
      if (!stores.length) return { status: "missing" };
      const ok = stores.every((s) => (s.kind === "kvstore" ? n(s.s.replicas, 1) >= 2 : n(s.s.read_replicas, 0) >= 1));
      return { status: ok ? "covered" : "missing" };
    },
  },
  keygen_collision_safe: {
    stone: "reality",
    title: "Short codes that never collide",
    question: "Two people shorten different URLs in the same millisecond. Can they get the same code?",
    why: "A counter (or pre-generated key pool) encoded in base62 is unique by construction; truncated hashes collide and need retry logic.",
    check: (g) => {
      const services = g.reachable().filter((x) => x.kind === "service");
      const scheme = String(services.find((s) => s.s.keygen)?.s.keygen ?? "");
      if (scheme === "counter_base62" || scheme === "key_pool") return { status: "covered" };
      if (scheme === "hash_truncate") return { status: "partial" };
      return { status: "missing" };
    },
  },
  rate_limit_writes: {
    stone: "soul",
    title: "Abuse protection on creation",
    question: "What stops one script from creating ten million links a minute?",
    why: "A per-user rate limit on writes protects storage, the key space and everyone else's latency.",
    check: (g) => ({ status: g.reachable().some((x) => x.kind === "service" && x.s.rate_limit === true) ? "covered" : "missing" }),
  },
  edge_cached_redirects: {
    stone: "time",
    title: "Popular redirects answered at the edge",
    question: "A link goes viral worldwide. Must every click cross the ocean to your servers?",
    why: "A CDN can cache redirect responses near users, absorbing viral spikes before they reach you.",
    check: (g) => {
      const cdn = g.reachable().find((x) => x.kind === "cdn");
      if (!cdn) return { status: "missing" };
      return { status: cdn.s.cache_reads && n(cdn.s.ttl_s, 0) > 0 ? "covered" : "partial" };
    },
  },
};

export function runRubric(design: Design, ids: string[]): RubricCheck[] {
  const g = new Graph(design);
  return ids
    .filter((id) => CHECKERS[id])
    .map((id) => {
      const spec = CHECKERS[id];
      return { id, status: spec.check(g).status, stone: spec.stone, title: spec.title, question: spec.question, why: spec.why };
    });
}
