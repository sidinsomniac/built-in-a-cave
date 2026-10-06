// Shared types for the design table and its simulation.

export type NodeKind =
  | "client"
  | "cdn"
  | "lb"
  | "service"
  | "cache"
  | "queue"
  | "worker"
  | "kvstore"
  | "sqldb"
  | "objectstore";

export type SettingValue = string | number | boolean;

export interface DesignNode {
  id: string;
  kind: NodeKind;
  label?: string;
  settings: Record<string, SettingValue>;
  x?: number;
  y?: number;
}

export interface DesignEdge {
  from: string;
  to: string;
}

export interface Design {
  nodes: DesignNode[];
  edges: DesignEdge[];
}

/** One kind of request in a scenario, e.g. "redirect" reads or "create" writes. */
export interface TrafficClass {
  id: string;
  label: string;
  op: "read" | "write";
  /** Requests per second at multiplier 1. */
  rps: number;
  /** Can a CDN serve it (a public, cache-friendly response)? */
  cacheable?: boolean;
  /** The field the datastore looks up by; "id" means the primary key. */
  lookup?: string;
  /** Side effects each request triggers, e.g. a click-analytics event per redirect. */
  emits?: { event: string; ratio: number }[];
}

export interface Failure {
  /** Simulated second it happens. */
  at: number;
  /** A node kind (the first node of that kind) or a node id. */
  target: string;
  kind: "kill" | "restart";
  /** Seconds a restarted node stays down before coming back cold. */
  down?: number;
}

export interface Scenario {
  id: string;
  label: string;
  /** Simulated seconds. */
  duration: number;
  classes: TrafficClass[];
  /** Piecewise traffic multiplier: [{ at: 0, x: 1 }, { at: 30, x: 10 }]. */
  shape?: { at: number; x: number }[];
  /** Fraction of read traffic that hits one single key (a viral link, a celebrity). */
  hotKey?: number;
  /** Size of the data that reads touch, in GB (drives cache hit ratios). */
  workingSetGb?: number;
  failures?: Failure[];
}

/** Targets a design must meet. Latency targets can be per traffic class. */
export interface Targets {
  p99_ms?: number | Record<string, number>;
  error_rate?: number;
  availability?: number;
  cost_per_month?: number;
  /** Maximum events waiting in queues at the end of the run. */
  backlog?: number;
}

export interface ClassResult {
  /** Worst p99 latency across the run, in ms. */
  p99: number;
  errorRate: number;
}

export interface SimResult {
  scenarioId: string;
  classes: Record<string, ClassResult>;
  /** Overall error rate across every request. */
  errorRate: number;
  /** Fraction of seconds with an error rate under 1%. */
  availability: number;
  costPerMonth: number;
  /** Events still waiting in queues at the end. */
  backlog: number;
  /** Events that had nowhere to go (no queue and no datastore). */
  lostEvents: number;
  /** Each node's highest utilisation during the run (1 = exactly at capacity). */
  peakUtil: Record<string, number>;
  /** Per-second trace for the replay timeline. */
  timeline: { t: number; p99: number; errorRate: number; hottest: string; utilisation: number }[];
  /** Plain-language notes on what happened (for JARVIS and the audit). */
  notes: string[];
}
