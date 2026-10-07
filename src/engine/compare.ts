// "One of many designs that pass": how the player's design differs from the reference.
import { COMPONENTS, withDefaults } from "../sim/components";
import type { Design, DesignNode, NodeKind } from "../sim/types";

const SIZE_KEYS: Partial<Record<NodeKind, { key: string; label: string }[]>> = {
  service: [{ key: "replicas", label: "copies" }],
  cache: [
    { key: "replicas", label: "copies" },
    { key: "memory_gb", label: "GB each" },
    { key: "ttl_s", label: "s TTL" },
  ],
  kvstore: [
    { key: "partitions", label: "partitions" },
    { key: "replicas", label: "replicas" },
  ],
  sqldb: [{ key: "read_replicas", label: "read replicas" }],
  worker: [{ key: "replicas", label: "workers" }],
  lb: [{ key: "replicas", label: "copies" }],
};

const sizeOf = (n: DesignNode, kind: NodeKind) => {
  const s = withDefaults(n);
  return (SIZE_KEYS[kind] ?? []).map((k) => `${s[k.key]} ${k.label}`).join(", ");
};

function describe(nodes: DesignNode[], kind: NodeKind): string {
  if (!nodes.length) return "none";
  return nodes.map((n) => (sizeOf(n, kind) ? `${n.label ?? n.id} (${sizeOf(n, kind)})` : (n.label ?? n.id))).join("; ");
}

/** Sizes only, sorted - labels don't matter when deciding "the same". */
const signature = (nodes: DesignNode[], kind: NodeKind) => nodes.map((n) => sizeOf(n, kind)).sort().join(" | ") + `#${nodes.length}`;

export interface KindDiff {
  kind: NodeKind;
  name: string;
  yours: string;
  reference: string;
  same: boolean;
}

/** Per component kind: what the player used against what the reference used. */
export function compareDesigns(yours: Design, reference: Design): KindDiff[] {
  const kinds = [...new Set([...reference.nodes, ...yours.nodes].map((n) => n.kind))].filter((k) => k !== "client");
  return kinds.map((kind) => {
    const mine = yours.nodes.filter((n) => n.kind === kind);
    const theirs = reference.nodes.filter((n) => n.kind === kind);
    return { kind, name: COMPONENTS[kind].name, yours: describe(mine, kind), reference: describe(theirs, kind), same: signature(mine, kind) === signature(theirs, kind) };
  });
}
