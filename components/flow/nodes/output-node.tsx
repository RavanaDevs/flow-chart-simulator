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

  const lastOutput = React.useMemo(() => {
    for (let i = terminal.length - 1; i >= 0; i--) {
      const line = terminal[i];
      if (line.kind === "output" && line.nodeId === id) {
        return line.text;
      }
    }
    return null;
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

      {lastOutput !== null && (
        <div className="nodrag nowheel absolute -bottom-8 left-1/2 -translate-x-1/2 z-40 flex max-w-[220px] items-center gap-1.5 rounded-md border border-cyan-500/40 bg-card px-2.5 py-1 text-xs font-mono font-semibold text-foreground shadow-md backdrop-blur">
          <span className="text-[10px] font-bold uppercase text-cyan-600 dark:text-cyan-400 shrink-0">
            out:
          </span>
          <span className="truncate">{lastOutput}</span>
        </div>
      )}
    </NodeFrame>
  );
};
