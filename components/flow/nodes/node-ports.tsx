import React from "react";
import { Handle, Position, HandleType } from "@xyflow/react";
import { NodeKind } from "@/lib/graph/types";
import { PortId } from "@/lib/graph/handles";
import { cn } from "@/lib/utils";

const POSITION_OF: Record<string, Position> = {
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
  className?: string;
};

/**
 * One connectable point. The canvas runs in Loose connection mode, so a single
 * handle both sends and receives — which is what lets a loop's back-edge leave
 * from whichever side faces the loop head. Direction is enforced by
 * isValidConnection and re-checked at compile time.
 */
function Port({ id, tone = "neutral", className }: PortProps) {
  return (
    <Handle
      type={"source" as HandleType}
      id={id}
      position={POSITION_OF[id]}
      className={cn(
        "!h-2.5 !w-2.5 !border-2 !border-background transition-all hover:!h-3.5 hover:!w-3.5",
        tone === "neutral" && "!bg-slate-400",
        tone === "true" && "!bg-emerald-500",
        tone === "false" && "!bg-amber-500",
        className
      )}
    />
  );
}

/** Every port a block of this kind exposes. */
export function NodePorts({ kind }: { kind: NodeKind }) {
  if (kind === "if") {
    return (
      <>
        <Port id="port-top" />
        <Port id="true-bottom" tone="true" />
        <Port id="false-left" tone="false" />
        <Port id="false-right" tone="false" />

        <span className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
          true
        </span>
        <span className="pointer-events-none absolute top-1/2 -left-8 -translate-y-1/2 text-[9px] font-bold text-amber-600 dark:text-amber-400">
          false
        </span>
        <span className="pointer-events-none absolute top-1/2 -right-8 -translate-y-1/2 text-[9px] font-bold text-amber-600 dark:text-amber-400">
          false
        </span>
      </>
    );
  }

  return (
    <>
      {GENERIC_PORTS.map((id) => (
        <Port key={id} id={id} />
      ))}
    </>
  );
}
