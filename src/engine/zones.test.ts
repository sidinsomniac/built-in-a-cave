import { describe, expect, it } from "vitest";
import { calculate, gradeAssembly, gradeBriefing, gradeDesk, gradeEstimates, gradeInterrogation, type DeskCheck } from "./stations";
import { coverageZone, designZone, estimateZone, marginZone, minZone, rubricZone, sequenceZone } from "./zones";

describe("zones", () => {
  it("judge a value against its target by margin", () => {
    expect(marginZone(30, 50)).toBe("optimal");
    expect(marginZone(45, 50)).toBe("solid");
    expect(marginZone(55, 50)).toBe("risky");
    expect(marginZone(80, 50)).toBe("failing");
    expect(marginZone(0.9999, 0.999, false)).toBe("optimal");
    expect(marginZone(0.99, 0.999, false)).toBe("failing");
  });

  it("take the worst zone", () => {
    expect(minZone("optimal", "risky", "solid")).toBe("risky");
  });

  it("rubric: musts decide pass, shoulds decide optimal", () => {
    const r = (status: "covered" | "partial" | "missing") => ({ id: "x", status, stone: "time" as const, title: "", question: "", why: "" });
    expect(rubricZone([r("covered")], [r("covered"), r("missing")])).toBe("optimal");
    expect(rubricZone([r("covered")], [r("missing"), r("missing")])).toBe("solid");
    expect(rubricZone([r("partial")], [])).toBe("solid");
    expect(rubricZone([r("missing")], [])).toBe("risky");
    expect(rubricZone([r("missing"), r("missing")], [])).toBe("failing");
  });

  it("anti-patterns cap or sink a design", () => {
    const hit = (severity: "critical" | "major") => ({ id: "x", severity, stone: "time" as const, title: "", question: "", why: "", nodeIds: [] });
    expect(designZone([], [], [], [hit("major")])).toBe("risky");
    expect(designZone([], [], [], [hit("critical")])).toBe("failing");
  });

  it("estimates by ratio, sequences by order, coverage by share", () => {
    expect(estimateZone(40, 38.6)).toBe("optimal");
    expect(estimateZone(70, 40)).toBe("solid");
    expect(estimateZone(300, 40)).toBe("risky");
    expect(estimateZone(4000, 40)).toBe("failing");
    expect(sequenceZone(["a", "b", "c"], ["a", "b", "c"])).toBe("optimal");
    expect(sequenceZone(["b", "a", "c"], ["a", "b", "c"])).toBe("failing");
    expect(coverageZone(5, 5)).toBe("optimal");
    expect(coverageZone(5, 5, 1)).toBe("risky");
    expect(coverageZone(2, 5)).toBe("failing");
  });
});

describe("station graders", () => {
  it("interrogation counts the must-have requirements revealed", () => {
    const pool = [
      { id: "a", q: "", a: "", reveals: ["scale"], cost: 1 },
      { id: "b", q: "", a: "", reveals: ["ratio"], cost: 1 },
      { id: "c", q: "", a: "", reveals: [], cost: 1 },
    ];
    const reqs = [{ id: "scale", text: "", must: true }, { id: "ratio", text: "", must: true }];
    expect(gradeInterrogation(["a", "b"], pool, reqs).zone).toBe("optimal");
    expect(gradeInterrogation(["a", "c"], pool, reqs).zone).toBe("failing");
  });

  it("estimates take the worst of the asks", () => {
    const asks = [{ id: "w", label: "", unit: "", answer: 40 }, { id: "r", label: "", unit: "", answer: 4000 }];
    expect(gradeEstimates({ w: 39, r: 3900 }, asks).zone).toBe("optimal");
    expect(gradeEstimates({ w: 39, r: 390000 }, asks).zone).toBe("failing");
  });

  it("the calculator handles powers of ten and suffixes", () => {
    expect(calculate("100M / (30 * 86400)")).toBeCloseTo(38.58, 1);
    expect(calculate("1.2e3 + 2k")).toBe(3200);
    expect(() => calculate("2 +")).toThrow();
  });

  it("the API desk grades methods, codes and options, and catches unsafe GETs", () => {
    const checks: DeskCheck[] = [
      { id: "create", purpose: "create", must: true, expect: { method: ["POST"], status: [201] }, stone: "reality", title: "", question: "", why: "" },
      { id: "redirect", purpose: "redirect", must: true, expect: { method: ["GET"], pathParam: true, status: [302] }, partial: { method: ["GET"], status: [301] }, stone: "mind", title: "", question: "", why: "" },
    ];
    const good = [
      { method: "POST", path: "/links", purpose: "create", status: 201, options: [] },
      { method: "GET", path: "/:code", purpose: "redirect", status: 302, options: [] },
    ];
    expect(gradeDesk(good, checks).zone).toBe("optimal");
    expect(gradeDesk([good[0], { ...good[1], status: 301 }], checks).zone).toBe("solid");
    expect(gradeDesk([{ ...good[0], method: "GET" }, good[1]], checks).zone).not.toBe("optimal");
  });

  it("assembly rewards the right sections and punishes decoys", () => {
    const chips = [{ id: "a", text: "", section: "r" }, { id: "b", text: "", section: "d" }, { id: "x", text: "", decoy: true }];
    const labels = { r: "Requirements", d: "Data model" };
    expect(gradeAssembly({ a: "r", b: "d" }, chips, labels).zone).toBe("optimal");
    expect(gradeAssembly({ a: "r", b: "d", x: "r" }, chips, labels).zone).toBe("risky");
  });
});

describe("the parts briefing", () => {
  const cards = [0, 1, 0, 1, 1].map((answer) => ({ answer, q: "q", why: "w" }));
  it("is optimal when every card is right first time", () => {
    expect(gradeBriefing({ 0: [0], 1: [1], 2: [0], 3: [1], 4: [1] }, cards).zone).toBe("optimal");
  });
  it("is solid with a couple of second tries, risky with many, failing until finished", () => {
    expect(gradeBriefing({ 0: [1, 0], 1: [1], 2: [0], 3: [1], 4: [1] }, cards).zone).toBe("solid");
    expect(gradeBriefing({ 0: [1, 0], 1: [0, 1], 2: [1, 0], 3: [1], 4: [1] }, cards).zone).toBe("risky");
    expect(gradeBriefing({ 0: [0], 1: [1] }, cards).zone).toBe("failing");
  });
});
