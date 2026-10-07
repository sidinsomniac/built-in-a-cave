import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import { auditDesign, type DesignSpec } from "../engine/audit";
import { simulate } from "./engine";
import { runRules } from "./rules";
import type { Design, DesignNode, Scenario } from "./types";

const node = (id: string, kind: DesignNode["kind"], settings: DesignNode["settings"] = {}): DesignNode => ({ id, kind, settings });
const reads = (rps: number, extra: Partial<Scenario["classes"][number]> = {}): Scenario => ({
  id: "s",
  label: "s",
  duration: 20,
  workingSetGb: 10,
  classes: [{ id: "read", label: "Read", op: "read", rps, ...extra }],
});
const chain = (nodes: DesignNode[], edges: [string, string][]): Design => ({ nodes, edges: edges.map(([from, to]) => ({ from, to })) });

const basic = (serviceReplicas: number, withCache = false): Design =>
  chain(
    [node("c", "client"), node("lb", "lb"), node("svc", "service", { replicas: serviceReplicas }), node("kv", "kvstore", { partitions: 2, replicas: 2 }), ...(withCache ? [node("cache", "cache", { memory_gb: 16, ttl_s: 3600 })] : [])],
    [["c", "lb"], ["lb", "svc"], ["svc", "kv"], ...(withCache ? ([["svc", "cache"]] as [string, string][]) : [])],
  );

describe("the simulation", () => {
  it("is deterministic: the same design always gets the same result", () => {
    const a = simulate(basic(2), reads(1500));
    const b = simulate(basic(2), reads(1500));
    expect(a).toEqual(b);
  });

  it("turns load over capacity into errors, and replicas fix it", () => {
    const under = simulate(basic(1), reads(3000));
    expect(under.errorRate).toBeGreaterThan(0.5);
    const enough = simulate(basic(4), reads(3000));
    expect(enough.errorRate).toBe(0);
  });

  it("without health checks, a dead copy keeps failing its share of requests", () => {
    const kill: Scenario = { ...reads(2000), failures: [{ at: 5, target: "svc", kind: "kill" }] };
    const checked = simulate(basic(5), kill);
    const unchecked = simulate({ ...basic(5), nodes: basic(5).nodes.map((n) => (n.id === "lb" ? { ...n, settings: { health_checks: false } } : n)) }, kill);
    expect(checked.errorRate).toBe(0);
    expect(unchecked.errorRate).toBeGreaterThan(0.1);
    expect(unchecked.notes.join(" ")).toMatch(/no health checks/);
  });

  it("gets slower as utilisation climbs", () => {
    const light = simulate(basic(10), reads(1000)).classes.read.p99;
    const heavy = simulate(basic(10), reads(9000)).classes.read.p99;
    expect(heavy).toBeGreaterThan(light * 2);
  });

  it("a cache rescues a store under pressure", () => {
    // 36,000 reads a second against a store that handles 40,000: near its limit.
    const without = simulate(basic(60), reads(36000));
    const withCache = simulate(basic(60, true), reads(36000));
    expect(withCache.classes.read.p99).toBeLessThan(without.classes.read.p99 / 2);
  });

  it("a hot key overloads one partition when nothing absorbs it", () => {
    const d = chain([node("c", "client"), node("svc", "service", { replicas: 30 }), node("kv", "kvstore", { partitions: 8, replicas: 1 })], [["c", "svc"], ["svc", "kv"]]);
    const spread = simulate(d, reads(20000));
    const hot = simulate(d, { ...reads(20000), hotKey: 0.6 });
    expect(spread.errorRate).toBe(0);
    expect(hot.errorRate).toBeGreaterThan(0.1);
    expect(hot.notes.join(" ")).toMatch(/hot/);
  });

  it("a cache restart sends a stampede to the store", () => {
    const d = basic(4, true);
    const r = simulate(d, { ...reads(3000), failures: [{ at: 5, target: "cache", kind: "restart", down: 2 }] });
    expect(r.notes.join(" ")).toMatch(/cold/);
  });

  it("a dead single node takes everything down; a replica survives", () => {
    const fail = { failures: [{ at: 5, target: "svc", kind: "kill" as const }] };
    expect(simulate(basic(1), { ...reads(500), ...fail }).availability).toBeLessThan(0.5);
    expect(simulate(basic(2), { ...reads(500), ...fail }).availability).toBe(1);
  });

  it("events go async through a queue, and pile up with nobody to drain them", () => {
    const sc: Scenario = { ...reads(1000), classes: [{ id: "read", label: "Read", op: "read", rps: 1000, emits: [{ event: "click", ratio: 1 }] }] };
    const drained = chain(
      [node("c", "client"), node("svc", "service", { replicas: 2 }), node("kv", "kvstore", { replicas: 2 }), node("q", "queue"), node("w", "worker"), node("a", "kvstore", { replicas: 2 })],
      [["c", "svc"], ["svc", "kv"], ["svc", "q"], ["q", "w"], ["w", "a"]],
    );
    expect(simulate(drained, sc).backlog).toBe(0);
    const orphan = chain([node("c", "client"), node("svc", "service", { replicas: 2 }), node("kv", "kvstore"), node("q", "queue")], [["c", "svc"], ["svc", "kv"], ["svc", "q"]]);
    expect(simulate(orphan, sc).backlog).toBeGreaterThan(1000);
  });

  it("an unindexed SQL lookup is far slower than an indexed one", () => {
    const sql = (indexes: string) => chain([node("c", "client"), node("svc", "service", { replicas: 2 }), node("db", "sqldb", { read_replicas: 1, indexes })], [["c", "svc"], ["svc", "db"]]);
    const sc = reads(500, { lookup: "email" });
    expect(simulate(sql("id"), sc).classes.read.p99).toBeGreaterThan(simulate(sql("id,email"), sc).classes.read.p99 * 5);
  });
});

describe("anti-pattern rules", () => {
  const ctx = { classes: [{ id: "r", label: "Redirect", op: "read" as const, rps: 1, lookup: "short_code", emits: [{ event: "click", ratio: 1 }] }] };
  const ids = (d: Design) => runRules(d, ctx, ["spof", "cache_without_ttl", "sync_side_effects", "unindexed_lookup", "no_datastore", "orphan_queue"]).map((h) => h.id).sort();

  it("finds the naive design's problems", () => {
    const naive = chain([node("c", "client"), node("svc", "service"), node("db", "sqldb")], [["c", "svc"], ["svc", "db"]]);
    expect(ids(naive)).toEqual(["spof", "sync_side_effects", "unindexed_lookup"]);
  });

  it("flags a cache with no TTL, a queue with no workers, and a service with no store", () => {
    const d = chain([node("c", "client"), node("svc", "service", { replicas: 2 }), node("cache", "cache"), node("q", "queue")], [["c", "svc"], ["svc", "cache"], ["svc", "q"]]);
    expect(ids(d)).toEqual(["cache_without_ttl", "no_datastore", "orphan_queue"]);
  });
});

describe("the URL shortener case", () => {
  const c = load(readFileSync("content/cases/b01-url-shortener/case.yaml", "utf8")) as {
    scenarios: Scenario[];
    stations: { id: string; scenarios: string[] | Scenario[]; targets: DesignSpec["targets"]; rubric: DesignSpec["rubric"]; rules: string[] }[];
    reference: Design;
    naive: Design;
  };
  const station = c.stations.find((s) => s.id === "design")!;
  const spec: DesignSpec = { scenarios: c.scenarios.filter((s) => (station.scenarios as string[]).includes(s.id)), targets: station.targets, rubric: station.rubric, rules: station.rules };
  const curve = c.stations.find((s) => s.id === "curveballs")!;
  const curveSpec: DesignSpec = { scenarios: curve.scenarios as Scenario[], targets: curve.targets, rubric: { must: [], should: [] }, rules: [] };

  it("the reference design is optimal, the naive one fails", () => {
    expect(auditDesign(c.reference, spec).zone).toBe("optimal");
    expect(auditDesign(c.reference, curveSpec).zone).toBe("optimal");
    expect(auditDesign(c.naive, spec).zone).toBe("failing");
  });

  it("dropping the cache costs the zone, and says why", () => {
    const noCache: Design = { nodes: c.reference.nodes.filter((n) => n.id !== "cache"), edges: c.reference.edges.filter((e) => e.to !== "cache") };
    const report = auditDesign(noCache, spec);
    expect(report.zone).not.toBe("optimal");
    expect(report.musts.find((m) => m.id === "cache_hot_reads")?.status).toBe("missing");
  });

  it("a design with no headroom survives the normal day but fails the node-loss curveball", () => {
    const tight: Design = { ...c.reference, nodes: c.reference.nodes.map((n) => (n.id === "api" ? { ...n, settings: { ...n.settings, replicas: 12 } } : n)) };
    expect(auditDesign(tight, curveSpec).zone).not.toBe("optimal");
  });
});
