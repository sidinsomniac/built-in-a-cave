// The component catalogue: what each box on the design table can do, and what it costs.
// Numbers are deliberately round and explainable, not vendor benchmarks.
import type { DesignNode, NodeKind, SettingValue } from "./types";

export interface SettingSpec {
  key: string;
  label: string;
  kind: "number" | "boolean" | "choice" | "text";
  default: SettingValue;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  help: string;
}

export interface ComponentSpec {
  kind: NodeKind;
  name: string;
  icon: string;
  blurb: string;
  /** Base latency in ms at low load. */
  latency: number;
  settings: SettingSpec[];
}

const replicas = (def: number, max: number, help: string): SettingSpec => ({
  key: "replicas",
  label: "Replicas",
  kind: "number",
  default: def,
  min: 1,
  max,
  help,
});

export const COMPONENTS: Record<NodeKind, ComponentSpec> = {
  client: {
    kind: "client",
    name: "Clients",
    icon: "📱",
    blurb: "Browsers and apps sending requests. Every design starts here.",
    latency: 0,
    settings: [],
  },
  cdn: {
    kind: "cdn",
    name: "CDN",
    icon: "🌐",
    blurb: "Edge servers near users. Can answer cache-friendly reads without touching your servers.",
    latency: 4,
    settings: [
      { key: "cache_reads", label: "Cache responses at the edge", kind: "boolean", default: false, help: "Serve cache-friendly reads from the edge." },
      { key: "ttl_s", label: "Edge TTL (seconds)", kind: "number", default: 60, min: 0, max: 86400, help: "How long the edge keeps a response." },
    ],
  },
  lb: {
    kind: "lb",
    name: "Load balancer",
    icon: "⚖️",
    blurb: "Spreads requests across the services behind it, and stops sending to dead ones.",
    latency: 0.5,
    settings: [
      replicas(2, 4, "Managed load balancers run as a redundant pair by default."),
      { key: "health_checks", label: "Health checks", kind: "boolean", default: true, help: "Pings each copy every few seconds, and stops sending requests to copies that don't answer." },
    ],
  },
  service: {
    kind: "service",
    name: "Service",
    icon: "🧩",
    blurb: "Your application code. Stateless, so you can run many copies.",
    latency: 3,
    settings: [
      replicas(1, 50, "Copies of the service behind the load balancer. Each handles about 1,000 requests a second."),
      { key: "rate_limit", label: "Rate-limit writes per user", kind: "boolean", default: false, help: "Rejects abusive bursts with 429 before they reach the database." },
    ],
  },
  cache: {
    kind: "cache",
    name: "Cache",
    icon: "⚡",
    blurb: "In-memory key-value store (like Redis). Very fast; holds a copy of hot data.",
    latency: 0.5,
    settings: [
      replicas(1, 10, "Cache nodes. Each handles about 50,000 requests a second."),
      { key: "memory_gb", label: "Memory (GB)", kind: "number", default: 4, min: 1, max: 512, help: "More memory holds more of the working set, so more hits." },
      { key: "ttl_s", label: "TTL (seconds, 0 = never expire)", kind: "number", default: 0, min: 0, max: 604800, help: "How long an entry lives before it must be fetched again." },
    ],
  },
  queue: {
    kind: "queue",
    name: "Queue",
    icon: "📬",
    blurb: "Holds work to be done later (like SQS or Kafka), so the request can return immediately.",
    latency: 1,
    settings: [],
  },
  worker: {
    kind: "worker",
    name: "Workers",
    icon: "🛠️",
    blurb: "Background processes that take jobs off a queue and do the slow work.",
    latency: 0,
    settings: [replicas(1, 50, "Each worker processes about 2,000 jobs a second (it batches its writes).")],
  },
  kvstore: {
    kind: "kvstore",
    name: "Key-value store",
    icon: "🗄️",
    blurb: "A NoSQL store (like DynamoDB or Cassandra). Fast lookups by key; scales by partitions.",
    latency: 2,
    settings: [
      { key: "partitions", label: "Partitions", kind: "number", default: 1, min: 1, max: 256, help: "Keys are spread across partitions. Each handles about 10,000 reads and 3,000 writes a second." },
      replicas(1, 5, "Copies of every partition. Extra copies add read capacity and survive a node loss."),
    ],
  },
  sqldb: {
    kind: "sqldb",
    name: "SQL database",
    icon: "🛢️",
    blurb: "A relational database (like Postgres). Rich queries and transactions; one primary for writes.",
    latency: 4,
    settings: [
      { key: "read_replicas", label: "Read replicas", kind: "number", default: 0, min: 0, max: 8, help: "Copies that serve reads. Each adds about 5,000 reads a second." },
      { key: "indexes", label: "Indexed columns (comma-separated)", kind: "text", default: "id", help: "Lookups on an unindexed column scan the table: slow and expensive." },
    ],
  },
  objectstore: {
    kind: "objectstore",
    name: "Object storage",
    icon: "🪣",
    blurb: "Cheap, durable storage for files and blobs (like S3).",
    latency: 25,
    settings: [],
  },
};

/** Capacity in requests per second for one replica or partition. */
export const CAPACITY = {
  cdn: 10_000_000,
  lb: 100_000,
  service: 1_000,
  cache: 50_000,
  queue: 100_000,
  worker: 2_000,
  kvRead: 10_000,
  kvWrite: 3_000,
  sqlRead: 5_000,
  sqlWrite: 1_000,
  objectstore: 1_000_000,
};

/** Monthly cost in credits (round numbers so trade-offs are easy to reason about). */
export function monthlyCost(node: DesignNode): number {
  const s = node.settings;
  const n = (key: string, fallback: number) => Number(s[key] ?? fallback);
  switch (node.kind) {
    case "client":
      return 0;
    case "cdn":
      return s.cache_reads ? 400 : 200;
    case "lb":
      return 50 * n("replicas", 2);
    case "service":
      return 150 * n("replicas", 1);
    case "cache":
      return n("replicas", 1) * (60 + 10 * n("memory_gb", 4));
    case "queue":
      return 100;
    case "worker":
      return 100 * n("replicas", 1);
    case "kvstore":
      return 120 * n("partitions", 1) * n("replicas", 1);
    case "sqldb":
      return 500 + 350 * n("read_replicas", 0);
    case "objectstore":
      return 80;
  }
}

/** A node's settings with defaults filled in. */
export function withDefaults(node: DesignNode): Record<string, SettingValue> {
  const out: Record<string, SettingValue> = {};
  for (const spec of COMPONENTS[node.kind].settings) out[spec.key] = spec.default;
  return { ...out, ...node.settings };
}
