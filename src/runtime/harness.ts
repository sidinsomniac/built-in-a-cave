// The workshop test harness. Runs a learner's code mission against hidden tests.
//
// Works in any DOM: the sandbox iframe in the browser, and jsdom in the content
// validator. The learner's TS/TSX files are compiled with Sucrase into CommonJS
// and evaluated with a tiny module system; React comes from this bundle.
import { act, createElement, type ReactElement } from "react";
import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import * as JsxRuntime from "react/jsx-runtime";
import { transform } from "sucrase";
import { screen, within, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import FakeTimers from "@sinonjs/fake-timers";

export interface MockRoute {
  method?: string;
  path: string;
  /** Only match when the query string contains this text (e.g. "q=zz"). */
  query?: string;
  status?: number;
  /** Milliseconds before the response arrives. A list gives one delay per call. */
  delay?: number | number[];
  json?: unknown;
}

export interface Mission {
  files: Record<string, string>;
  /** File to render as a React app (default export). Omit for pure TS missions. */
  entry?: string;
  tests: string;
  mocks?: MockRoute[];
}

export interface TestOutcome {
  name: string;
  passed: boolean;
  /** For a failed check: JARVIS's guiding question. For a crash: the error. */
  message?: string;
  kind?: "check" | "crash" | "timeout";
}

export interface RunResult {
  passed: number;
  total: number;
  tests: TestOutcome[];
  /** Compile errors, if the code doesn't even build. */
  compileError?: string;
}

export class CheckFailed extends Error {}

const TEST_TIMEOUT_MS = 5000;

function compile(code: string, filename: string): string {
  return transform(code, {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
    filePath: filename,
  }).code;
}

const LIBRARIES: Record<string, unknown> = {
  react: React,
  "react-dom/client": ReactDOMClient,
  "react/jsx-runtime": JsxRuntime,
};

/** Evaluates the learner's files lazily, so a file is only run when required. */
function makeModules(files: Record<string, string>, win: Window & typeof globalThis) {
  const cache = new Map<string, Record<string, unknown>>();
  const resolve = (spec: string): string | null => {
    const name = spec.replace(/^\.\//, "");
    for (const candidate of [name, `${name}.ts`, `${name}.tsx`, `${name}.js`]) if (candidate in files) return candidate;
    return null;
  };
  const load = (spec: string): Record<string, unknown> => {
    if (spec in LIBRARIES) return LIBRARIES[spec] as Record<string, unknown>;
    const file = resolve(spec);
    if (!file) throw new Error(`Cannot find module "${spec}". Is the file name spelled exactly right?`);
    const hit = cache.get(file);
    if (hit) return hit;
    const module = { exports: {} as Record<string, unknown> };
    cache.set(file, module.exports);
    const code = compile(files[file], file);
    const fn = new win.Function("require", "module", "exports", code);
    fn(load, module, module.exports);
    cache.set(file, module.exports);
    return module.exports;
  };
  return load;
}

/** A spy: a function that records its calls. */
export function spy<T extends (...args: never[]) => unknown>(impl?: T) {
  const calls: unknown[][] = [];
  const fn = ((...args: unknown[]) => {
    calls.push(args);
    return impl ? (impl as unknown as (...a: unknown[]) => unknown)(...args) : undefined;
  }) as ((...args: unknown[]) => unknown) & { calls: unknown[][] };
  fn.calls = calls;
  return fn;
}

export async function runMission(mission: Mission, win: Window & typeof globalThis = window as Window & typeof globalThis): Promise<RunResult> {
  const doc = win.document;
  const realSetTimeout = win.setTimeout.bind(win);
  const realFetch = win.fetch?.bind(win);

  // Collect the tests.
  const tests: { name: string; fn: () => unknown }[] = [];
  const load = makeModules(mission.files, win);

  // Per-test state.
  type InstalledClock = ReturnType<ReturnType<typeof FakeTimers.withGlobal>["install"]>;
  let clock: InstalledClock | null = null;
  let roots: ReactDOMClient.Root[] = [];
  let calls: { method: string; path: string; query: string }[] = [];
  const callCount = new Map<string, number>();

  const installFetch = () => {
    const routes = mission.mocks ?? [];
    win.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://stark.local");
      const method = (init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET")).toUpperCase();
      calls.push({ method, path: url.pathname, query: url.search });
      const route =
        routes.find((r) => (r.method ?? "GET").toUpperCase() === method && r.path === url.pathname && r.query && url.search.includes(r.query)) ??
        routes.find((r) => (r.method ?? "GET").toUpperCase() === method && r.path === url.pathname && !r.query);
      const key = `${method} ${url.pathname}`;
      const n = callCount.get(key) ?? 0;
      callCount.set(key, n + 1);
      const delays = route?.delay ?? 0;
      const delay = Array.isArray(delays) ? delays[Math.min(n, delays.length - 1)] : delays;
      const signal = init?.signal;
      await new Promise<void>((resolve, reject) => {
        if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
        const timer = win.setTimeout(resolve, delay);
        signal?.addEventListener("abort", () => {
          win.clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
      const status = route ? route.status ?? 200 : 404;
      const body = route ? JSON.stringify(route.json ?? null) : JSON.stringify({ error: "not found" });
      return new win.Response(body, { status, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;
  };

  const helpers = {
    test: (name: string, fn: () => unknown) => tests.push({ name, fn }),
    check(condition: unknown, question: string) {
      if (!condition) throw new CheckFailed(question);
    },
    load,
    spy,
    screen,
    within,
    waitFor,
    act,
    createElement,
    useFakeTimers() {
      clock = FakeTimers.withGlobal(win).install({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
      return clock;
    },
    user() {
      const c = clock;
      return userEvent.setup({ document: doc, advanceTimers: c ? (ms: number) => c.tick(ms) : undefined });
    },
    async render(element?: ReactElement) {
      const el = element ?? createElement((load(mission.entry ?? "App.tsx").default as React.ComponentType) ?? "div");
      const container = doc.createElement("div");
      doc.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      roots.push(root);
      await act(async () => root.render(el));
      return container;
    },
    api: {
      calls: (path?: string) => (path ? calls.filter((c) => c.path === path) : calls),
    },
    async axe(container?: Element) {
      const axe = (await import("axe-core")).default;
      const results = await axe.run(container ?? doc.body, { resultTypes: ["violations"] });
      return results.violations.map((v) => `${v.id}: ${v.help}`);
    },
  };

  try {
    const compiled = compile(mission.tests, "tests.ts");
    const names = Object.keys(helpers);
    const fn = new win.Function(...names, compiled);
    fn(...names.map((n) => (helpers as Record<string, unknown>)[n]));
  } catch (err) {
    return { passed: 0, total: 0, tests: [], compileError: err instanceof Error ? err.message : String(err) };
  }

  const outcomes: TestOutcome[] = [];
  for (const t of tests) {
    calls = [];
    callCount.clear();
    installFetch();
    let outcome: TestOutcome;
    try {
      await Promise.race([
        Promise.resolve().then(t.fn),
        new Promise((_, reject) => realSetTimeout(() => reject(new Error("__timeout__")), TEST_TIMEOUT_MS)),
      ]);
      outcome = { name: t.name, passed: true };
    } catch (err) {
      if (err instanceof CheckFailed || (err instanceof Error && err.constructor.name === "CheckFailed")) {
        outcome = { name: t.name, passed: false, kind: "check", message: err.message };
      } else if (err instanceof Error && err.message === "__timeout__") {
        outcome = { name: t.name, passed: false, kind: "timeout", message: "The spell ran for too long. Is something waiting forever, or looping?" };
      } else {
        outcome = { name: t.name, passed: false, kind: "crash", message: err instanceof Error ? `${err.name}: ${err.message}` : String(err) };
      }
    } finally {
      for (const r of roots) {
        try {
          await act(async () => r.unmount());
        } catch {
          // a crashed tree may refuse to unmount
        }
      }
      roots = [];
      doc.body.innerHTML = "";
      (clock as InstalledClock | null)?.uninstall();
      clock = null;
    }
    outcomes.push(outcome);
    if (!outcome.passed) break; // one idea at a time
  }
  if (realFetch) win.fetch = realFetch;
  return { passed: outcomes.filter((o) => o.passed).length, total: tests.length, tests: outcomes };
}
