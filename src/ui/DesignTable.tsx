// The design table: drag components, wire them, configure them.
// Every action has a keyboard-friendly control too (add, connect, edit, delete).
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, useState } from "react";
import { COMPONENTS, withDefaults, type SettingSpec } from "../sim/components";
import type { Design, DesignNode, NodeKind } from "../sim/types";
import type { Zone } from "../engine/zones";

type FlowData = { node: DesignNode; heat?: Zone; selected: boolean; specs: SettingSpec[] };

function summary(node: DesignNode, specs: SettingSpec[]): string {
  const s = withDefaults(node);
  const parts: string[] = [];
  for (const spec of specs) {
    const v = s[spec.key];
    if (spec.kind === "boolean") {
      if (v) parts.push(spec.label.toLowerCase());
    } else if (spec.kind === "choice") {
      if (v && v !== "none") parts.push(String(spec.options?.find((o) => o.value === v)?.label ?? v));
    } else if (v !== undefined && v !== "") parts.push(`${spec.key.replace(/_/g, " ")}: ${v}`);
  }
  return parts.join(" · ");
}

function ComponentNode({ data }: NodeProps<Node<FlowData>>) {
  const spec = COMPONENTS[data.node.kind];
  return (
    <div className={`flow-node ${data.selected ? "selected" : ""} ${data.heat && data.heat !== "optimal" ? `hot-${data.heat}` : ""}`} data-testid={`node-${data.node.id}`}>
      {data.node.kind !== "client" && <Handle type="target" position={Position.Left} />}
      <div className="title">
        {spec.icon} {data.node.label ?? spec.name}
      </div>
      <div className="meta">{spec.name}</div>
      <div className="meta">{summary(data.node, data.specs)}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { component: ComponentNode };

export interface DesignTableProps {
  design: Design;
  onChange?: (d: Design) => void;
  palette: NodeKind[];
  extraSettings?: Partial<Record<NodeKind, SettingSpec[]>>;
  heat?: Record<string, Zone>;
  readOnly?: boolean;
  height?: number;
}

export function DesignTable({ design, onChange, palette, extraSettings = {}, heat = {}, readOnly = false, height }: DesignTableProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [connectTo, setConnectTo] = useState("");
  const specsFor = (kind: NodeKind) => [...COMPONENTS[kind].settings, ...(extraSettings[kind] ?? [])];
  const update = (d: Design) => onChange?.(d);

  const nodes: Node<FlowData>[] = useMemo(
    () =>
      design.nodes.map((n, i) => ({
        id: n.id,
        type: "component",
        position: { x: n.x ?? 60 + (i % 4) * 220, y: n.y ?? 60 + Math.floor(i / 4) * 140 },
        data: { node: n, heat: heat[n.id], selected: n.id === selected, specs: specsFor(n.kind) },
        deletable: !readOnly && n.kind !== "client",
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [design, heat, selected, readOnly],
  );
  const edges: Edge[] = useMemo(() => design.edges.map((e) => ({ id: `${e.from}->${e.to}`, source: e.from, target: e.to, animated: true, deletable: !readOnly })), [design, readOnly]);

  const removeNode = (id: string) => {
    update({ nodes: design.nodes.filter((n) => n.id !== id), edges: design.edges.filter((e) => e.from !== id && e.to !== id) });
    if (selected === id) setSelected(null);
  };

  const onNodesChange = (changes: NodeChange<Node<FlowData>>[]) => {
    if (readOnly) return;
    const removed = changes.filter((c) => c.type === "remove").map((c) => (c as { id: string }).id);
    const moved = applyNodeChanges(changes.filter((c) => c.type === "position"), nodes);
    let next: Design = {
      nodes: design.nodes.map((n) => {
        const m = moved.find((x) => x.id === n.id);
        return m ? { ...n, x: Math.round(m.position.x), y: Math.round(m.position.y) } : n;
      }),
      edges: design.edges,
    };
    if (removed.length) next = { nodes: next.nodes.filter((n) => !removed.includes(n.id)), edges: next.edges.filter((e) => !removed.includes(e.from) && !removed.includes(e.to)) };
    if (changes.some((c) => c.type === "position" || c.type === "remove")) update(next);
    const sel = changes.find((c) => c.type === "select" && (c as { selected: boolean }).selected) as { id: string } | undefined;
    if (sel) setSelected(sel.id);
  };
  const onEdgesChange = (changes: EdgeChange[]) => {
    if (readOnly) return;
    const removed = changes.filter((c) => c.type === "remove").map((c) => (c as { id: string }).id);
    if (removed.length) update({ ...design, edges: design.edges.filter((e) => !removed.includes(`${e.from}->${e.to}`)) });
  };
  const connect = (from: string, to: string) => {
    if (from === to || design.edges.some((e) => e.from === from && e.to === to)) return;
    update({ ...design, edges: [...design.edges, { from, to }] });
  };
  const onConnect = (c: Connection) => !readOnly && c.source && c.target && connect(c.source, c.target);

  const add = (kind: NodeKind) => {
    const count = design.nodes.filter((n) => n.kind === kind).length;
    const id = `${kind}${count ? count + 1 : ""}`;
    const uniqueId = design.nodes.some((n) => n.id === id) ? `${kind}-${Date.now() % 100000}` : id;
    const anchor = design.nodes.find((n) => n.id === selected);
    const node: DesignNode = { id: uniqueId, kind, label: COMPONENTS[kind].name, settings: {}, x: (anchor?.x ?? 300) + 220, y: (anchor?.y ?? 120) + 40 * count };
    update({ ...design, nodes: [...design.nodes, node] });
    setSelected(uniqueId);
  };

  const sel = design.nodes.find((n) => n.id === selected);
  const setSetting = (key: string, value: string | number | boolean) => {
    if (!sel) return;
    update({ ...design, nodes: design.nodes.map((n) => (n.id === sel.id ? { ...n, settings: { ...n.settings, [key]: value } } : n)) });
  };

  return (
    <div className={readOnly ? "" : "designer"}>
      <div className="canvas" style={height ? { height } : undefined} data-testid="canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => setSelected(n.id)}
          onPaneClick={() => setSelected(null)}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          fitView
          // Let the page scroll over the canvas; zoom with the controls or a pinch.
          zoomOnScroll={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
          colorMode="dark"
        >
          <Background gap={22} color="#2a201c" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {!readOnly && (
        <aside className="stack">
          <div className="card">
            <b>Add a component</b>
            <div className="palette" style={{ marginTop: 8 }}>
              {palette.map((k) => (
                <button key={k} className="btn small" onClick={() => add(k)} title={COMPONENTS[k].blurb} data-testid={`add-${k}`}>
                  {COMPONENTS[k].icon} {COMPONENTS[k].name}
                </button>
              ))}
            </div>
            <p className="muted small">Drag from a box's right edge to another box to wire them - or use "Connect to" below.</p>
          </div>
          <div className="card" data-testid="inspector">
            {!sel ? (
              <p className="muted small">Select a component to configure it.</p>
            ) : (
              <div className="stack">
                <div className="row between">
                  <b>
                    {COMPONENTS[sel.kind].icon} {COMPONENTS[sel.kind].name}
                  </b>
                  {sel.kind !== "client" && (
                    <button className="btn small ghost" onClick={() => removeNode(sel.id)} data-testid="delete-node">
                      🗑 Remove
                    </button>
                  )}
                </div>
                <p className="muted small">{COMPONENTS[sel.kind].blurb}</p>
                <label>
                  <span className="small">Label</span>
                  <input value={sel.label ?? ""} onChange={(e) => update({ ...design, nodes: design.nodes.map((n) => (n.id === sel.id ? { ...n, label: e.target.value } : n)) })} style={{ width: "100%" }} />
                </label>
                {specsFor(sel.kind).map((spec) => {
                  const value = withDefaults({ ...sel, settings: sel.settings })[spec.key] ?? spec.default;
                  return (
                    <label key={spec.key} title={spec.help}>
                      <span className="small">{spec.label}</span>
                      {spec.kind === "boolean" ? (
                        <input type="checkbox" checked={Boolean(value)} onChange={(e) => setSetting(spec.key, e.target.checked)} aria-label={spec.label} style={{ marginLeft: 8 }} />
                      ) : spec.kind === "choice" ? (
                        <select value={String(value)} onChange={(e) => setSetting(spec.key, e.target.value)} aria-label={spec.label} style={{ width: "100%" }}>
                          {spec.options?.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : spec.kind === "number" ? (
                        <input type="number" min={spec.min} max={spec.max} value={Number(value)} onChange={(e) => setSetting(spec.key, Number(e.target.value))} aria-label={spec.label} style={{ width: "100%" }} />
                      ) : (
                        <input value={String(value)} onChange={(e) => setSetting(spec.key, e.target.value)} aria-label={spec.label} style={{ width: "100%" }} />
                      )}
                      <span className="muted small">{spec.help}</span>
                    </label>
                  );
                })}
                <div>
                  <span className="small">Connect to</span>
                  <div className="row">
                    <select value={connectTo} onChange={(e) => setConnectTo(e.target.value)} aria-label="Connect to" data-testid="connect-select">
                      <option value="">Choose...</option>
                      {design.nodes
                        .filter((n) => n.id !== sel.id && n.kind !== "client")
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {COMPONENTS[n.kind].icon} {n.label ?? n.id}
                          </option>
                        ))}
                    </select>
                    <button className="btn small" disabled={!connectTo} onClick={() => connect(sel.id, connectTo)} data-testid="connect-button">
                      Connect →
                    </button>
                  </div>
                  <ul className="small">
                    {design.edges
                      .filter((e) => e.from === sel.id)
                      .map((e) => (
                        <li key={e.to}>
                          → {design.nodes.find((n) => n.id === e.to)?.label ?? e.to}{" "}
                          <button className="btn small ghost" onClick={() => update({ ...design, edges: design.edges.filter((x) => !(x.from === e.from && x.to === e.to)) })} aria-label={`Disconnect ${e.to}`}>
                            ✕
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
