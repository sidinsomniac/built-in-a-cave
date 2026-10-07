// The Field Manual: a plain-words page for one design-table component.
import { useEffect } from "react";
import { MANUAL } from "../engine/content";
import { COMPONENTS, type SettingSpec } from "../sim/components";
import type { NodeKind } from "../sim/types";
import { Markdown } from "./common";

export function FieldManual({ kind, extraSettings = [], onClose }: { kind: NodeKind; extraSettings?: SettingSpec[]; onClose: () => void }) {
  const spec = COMPONENTS[kind];
  const page = MANUAL[kind];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const settings = [...spec.settings, ...extraSettings].map((s) => ({ label: s.label, text: page.settings[s.key] ?? s.help }));
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Field Manual: ${spec.name}`} data-testid="manual" onClick={onClose}>
      <div className="modal hud-panel" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <div className="muted small">📘 Field Manual</div>
          <button className="btn small ghost" onClick={onClose} aria-label="Close the Field Manual" autoFocus>
            ✕
          </button>
        </div>
        <h2 style={{ marginTop: 4 }}>
          {spec.icon} {spec.name}
        </h2>
        <Markdown text={page.what} />
        <dl className="manual">
          <dt>Think of it as</dt>
          <dd>{page.analogy}</dd>
          <dt>Reach for it when</dt>
          <dd>{page.when}</dd>
          <dt>How much it can take</dt>
          <dd>{page.capacity}</dd>
          {page.cost && (
            <>
              <dt>What it costs</dt>
              <dd>{page.cost}</dd>
            </>
          )}
          <dt>How it fails</dt>
          <dd>{page.fails}</dd>
        </dl>
        {settings.length > 0 && (
          <>
            <h3>Settings</h3>
            <ul className="small">
              {settings.map((s) => (
                <li key={s.label}>
                  <b>{s.label}:</b> {s.text}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
