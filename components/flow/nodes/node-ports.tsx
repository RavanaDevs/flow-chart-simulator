import React from "react";
import { Handle, Position, HandleType, useConnection } from "@xyflow/react";
import { NodeKind } from "@/lib/graph/types";
import { PortId } from "@/lib/graph/handles";
import { useGraphStore } from "@/stores/graph-store";
import { cn } from "@/lib/utils";

const POSITION_OF: Record<PortId, Position> = {
  "port-top": Position.Top,
  "port-right": Position.Right,
  "port-bottom": Position.Bottom,
  "port-left": Position.Left,
  "true-bottom": Position.Bottom,
  "false-left": Position.Left,
  "false-right": Position.Right,
};

const GENERIC_PORTS: PortId[] = [
  "port-top",
  "port-right",
  "port-bottom",
  "port-left",
];

type PortProps = {
  id: PortId;
  tone?: "neutral" | "true" | "false";
  /** Forced visible regardless of hover — this port carries an edge. */
  connected: boolean;
  /** Forced visible on every node while a connection is being dragged. */
  revealAll: boolean;
  label?: string;
  labelClassName?: string;
};

/**
 * One connectable point. The canvas runs in Loose connection mode, so a single
 * handle both sends and receives — which is what lets a loop's back-edge leave
 * from whichever side faces the loop head. Direction is enforced by
 * isValidConnection and re-checked at compile time.
 *
 * Ports stay out of the way until they are useful: hidden by default, revealed
 * on hover, and always shown once something is attached. They keep their hit
 * area while faded, so aiming at one still works.
 */
function Port({
  id,
  tone = "neutral",
  connected,
  revealAll,
  label,
  labelClassName,
}: PortProps) {
  const pinned = connected || revealAll;
  const visibility = pinned
    ? "opacity-100"
    : "opacity-0 group-hover:opacity-100";

  return (
    <>
      <Handle
        type={"source" as HandleType}
        id={id}
        position={POSITION_OF[id]}
        className={cn(
          "!h-2.5 !w-2.5 !border-2 !border-background transition-all hover:!h-3.5 hover:!w-3.5",
          tone === "neutral" && "!bg-slate-400",
          tone === "true" && "!bg-emerald-500",
          tone === "false" && "!bg-amber-500",
          visibility
        )}
      />
      {label && (
        <span
          className={cn(
            "pointer-events-none absolute text-[9px] font-bold transition-opacity",
            labelClassName,
            visibility
          )}
        >
          {label}
        </span>
      )}
    </>
  );
}

/** Every port a block of this kind exposes. */
export function NodePorts({
  kind,
  nodeId,
}: {
  kind: NodeKind;
  nodeId: string;
}) {
  // A stable string rather than a Set, so this only re-renders the node when
  // its own connections actually change.
  const connectedKey = useGraphStore((s) => {
    const ids: string[] = [];
    for (const e of s.edges) {
      if (e.source === nodeId && e.sourceHandle) ids.push(e.sourceHandle);
      if (e.target === nodeId && e.targetHandle) ids.push(e.targetHandle);
    }
    return ids.sort().join("|");
  });

  // While a connection is being dragged, every node shows its ports — you
  // cannot aim at a drop target you cannot see.
  const revealAll = useConnection((c) => c.inProgress);

  const connected = React.useMemo(
    () => new Set(connectedKey ? connectedKey.split("|") : []),
    [connectedKey]
  );

  if (kind === "if") {
    return (
      <>
        <Port
          id="port-top"
          connected={connected.has("port-top")}
          revealAll={revealAll}
        />
        <Port
          id="true-bottom"
          tone="true"
          connected={connected.has("true-bottom")}
          revealAll={revealAll}
          label="true"
          labelClassName="-bottom-4 left-1/2 -translate-x-1/2 text-emerald-600 dark:text-emerald-400"
        />
        <Port
          id="false-left"
          tone="false"
          connected={connected.has("false-left")}
          revealAll={revealAll}
          label="false"
          labelClassName="top-1/2 -left-8 -translate-y-1/2 text-amber-600 dark:text-amber-400"
        />
        <Port
          id="false-right"
          tone="false"
          connected={connected.has("false-right")}
          revealAll={revealAll}
          label="false"
          labelClassName="top-1/2 -right-8 -translate-y-1/2 text-amber-600 dark:text-amber-400"
        />
      </>
    );
  }

  return (
    <>
      {GENERIC_PORTS.map((id) => (
        <Port
          key={id}
          id={id}
          connected={connected.has(id)}
          revealAll={revealAll}
        />
      ))}
    </>
  );
}
