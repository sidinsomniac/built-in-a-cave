import { describe, expect, it } from "vitest";
import { simulate } from "../sim/engine";
import type { Design, DesignNode, NodeKind, SettingValue } from "../sim/types";
import { compareDesigns } from "./compare";
import { CASES } from "./content";
import { askCorrect, currentStep, numberClose } from "./steps";
import type { DesignStation } from "./types";

const b01 = CASES.find((c) => c.id === "b01")!;
const station = b01.stations.find((s) => s.kind === "design") as DesignStation;
const scenarios = station.scenarios.map((id) => b01.scenarios.find((s) => s.id === id)!);
const steps = station.steps!;

/** Builds a design the way a player would, one change at a time. */
function builder() {
  const d: Design = structuredClone(station.prebuilt);
  return {
    d,
    add(id: string, kind: NodeKind, from: string, settings: Record<string, SettingValue> = {}) {
      d.nodes.push({ id, kind, settings } as DesignNode);
      d.edges.push({ from, to: id });
    },
    set(id: string, settings: Record<string, SettingValue>) {
      const n = d.nodes.find((x) => x.id === id)!;
      n.settings = { ...n.settings, ...settings };
    },
  };
}

/** The right answer to every step's question - as a player would type or pick it. */
const answers = Object.fromEntries(steps.filter((s) => s.ask).map((s) => [s.id, String("options" in s.ask! ? s.ask!.answer : s.ask!.number)]));
const at = (d: Design, ran = true) => steps[currentStep(steps, d, { scenarios, ran }, answers, [])]?.id ?? "done";

describe("the guided build (B1)", () => {
  it("advances one step at a time as a beginner builds", () => {
    const b = builder();
    expect(at(b.d, false)).toBe("run-bare");
    expect(at(b.d)).toBe("store");
    b.add("links", "kvstore", "api");
    expect(at(b.d)).toBe("copies");
    b.set("api", { replicas: 4 });
    expect(at(b.d), "4,040 requests/s on 4 copies is still just over - the readout nudges a fifth").toBe("copies");
    b.set("api", { replicas: 5 });
    expect(at(b.d)).toBe("clicks");
    b.add("q", "queue", "api");
    b.add("w", "worker", "q", { replicas: 2 });
    b.add("an", "kvstore", "w", { partitions: 2 });
    expect(at(b.d)).toBe("cache");
    b.add("cache", "cache", "api");
    expect(at(b.d), "a cache with no TTL doesn't finish the step").toBe("cache");
    b.set("cache", { ttl_s: 86400 });
    expect(at(b.d)).toBe("spike");
    b.set("api", { replicas: 16 });
    b.set("w", { replicas: 8 });
    b.set("an", { partitions: 6 });
    expect(at(b.d)).toBe("codes");
    b.set("api", { keygen: "counter_base62", rate_limit: true });
    expect(at(b.d)).toBe("spares");
    b.set("links", { replicas: 2 });
    b.set("an", { replicas: 2 });
    expect(at(b.d)).toBe("done");
  });

  it("needs the questions answered at Mark I, but not at Mark III", () => {
    const b = builder();
    b.add("links", "kvstore", "api");
    const ctx = { scenarios, ran: true };
    expect(currentStep(steps, b.d, ctx, {}, [], true)).toBe(1);
    expect(currentStep(steps, b.d, ctx, {}, [], false)).toBe(2);
  });

  it("keeps finished steps finished", () => {
    const b = builder();
    expect(currentStep(steps, b.d, { scenarios, ran: true }, answers, ["run-bare", "store"])).toBe(2);
  });
});

describe("step questions", () => {
  it("accepts close numbers and the right option", () => {
    expect(numberClose(15, 15)).toBe(true);
    expect(numberClose(16, 15)).toBe(true);
    expect(numberClose(30, 15)).toBe(false);
    expect(askCorrect({ q: "", number: 4800, why: "" }, "5000")).toBe(true);
    expect(askCorrect({ q: "", options: ["a", "b"], answer: 1, why: "" }, "1")).toBe(true);
    expect(askCorrect({ q: "", options: ["a", "b"], answer: 1, why: "" }, "0")).toBe(false);
  });
});

describe("load readouts", () => {
  it("states what a node was asked for and what it can do", () => {
    const b = builder();
    b.add("links", "kvstore", "api");
    const r = simulate(b.d, scenarios[0]);
    expect(r.nodeLoad.api.capacity).toBe(1000);
    expect(r.nodeLoad.api.demand).toBe(4040);
    expect(r.nodeLoad.api.sizing).toBe("1 copy × 1,000 requests/s");
    expect(r.nodeLoad.links.note).toMatch(/writes\/s/);
    expect(r.nodeLoad.clients).toBeUndefined();
  });

  it("explains a cache's hit rate from its memory", () => {
    const b = builder();
    b.add("links", "kvstore", "api");
    b.add("cache", "cache", "api", { memory_gb: 10, ttl_s: 60 });
    const r = simulate(b.d, scenarios[0]);
    expect(r.nodeLoad.cache.note).toMatch(/10 GB of memory .* holds 50% of the 20 GB/);
  });
});

describe("comparing with the reference", () => {
  it("treats different sizes as different, and labels as irrelevant", () => {
    const mine = structuredClone(b01.reference);
    mine.nodes.find((n) => n.id === "cache")!.label = "My cache";
    expect(compareDesigns(mine, b01.reference).every((d) => d.same)).toBe(true);
    mine.nodes.find((n) => n.id === "cache")!.settings.memory_gb = 32;
    expect(compareDesigns(mine, b01.reference).find((d) => d.kind === "cache")!.same).toBe(false);
  });
});
