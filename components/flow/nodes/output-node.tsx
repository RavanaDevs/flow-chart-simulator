import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { ExpressionField } from "./expression-field";
import { countLines } from "../shapes/geometry";
import { useGraphStore } from "@/stores/graph-store";
import { useT } from "@/hooks/use-t";

import { useRunStore } from "@/stores/run-store";

export const OutputNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const { t } = useT();
  const updateNodeData = useGraphStore((s) => s.updateNodeData);
  const terminal = useRunStore((s) => s.state.terminal);

  const source = (data as { source?: string }).source ?? `"Hello"`;

  const nodeOutputLines = React.useMemo(() => {
    let lastIdx = -1;
    for (let i = terminal.length - 1; i >= 0; i--) {
      const line = terminal[i];
      if (line.kind === "output" && line.nodeId === id) {
        lastIdx = i;
        break;
      }
    }
    if (lastIdx === -1) return null;

    const lines: string[] = [];
    for (let i = lastIdx; i >= 0; i--) {
      const line = terminal[i];
      if (line.kind === "output" && line.nodeId === id) {
        lines.unshift(line.text);
      } else {
        break;
      }
    }
    return lines.length > 0 ? lines : null;
  }, [terminal, id]);

  return (
    <NodeFrame id={id} kind="output" isSelected={selected} lines={countLines(source)}>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground">
          {t("block.output")}
        </span>
        <ExpressionField
          value={source}
          onChange={(val) => updateNodeData(id, { source: val })}
          multiline
          placeholder={t("block.outputPlaceholder")}
        />
      </div>

      {nodeOutputLines !== null && (
        <div className="nodrag nowheel absolute -top-2 left-full ml-4 z-40 flex w-56 flex-col gap-1 rounded-xl border border-cyan-500/40 bg-card p-2.5 text-xs font-mono shadow-xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-border/50 pb-1 text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-400">
            <span>out</span>
            {nodeOutputLines.length > 1 && (
              <span className="text-[9px] font-normal text-muted-foreground">
                {nodeOutputLines.length} lines
              </span>
            )}
          </div>
          <div className="flex max-h-36 flex-col gap-0.5 overflow-y-auto whitespace-pre-wrap break-words text-[11px] font-semibold text-foreground">
            {nodeOutputLines.map((lineText, idx) => (
              <div key={idx} className="leading-snug">
                {lineText}
              </div>
            ))}
          </div>
        </div>
      )}
    </NodeFrame>
  );
};
