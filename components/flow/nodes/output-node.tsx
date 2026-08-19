import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { ExpressionField } from "./expression-field";
import { countLines } from "../shapes/geometry";
import { useGraphStore } from "@/stores/graph-store";

export const OutputNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  const source = (data as { source?: string }).source ?? `"Hello"`;

  return (
    <NodeFrame id={id} kind="output" isSelected={selected} lines={countLines(source)}>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground">
          Output
        </span>
        <ExpressionField
          value={source}
          onChange={(val) => updateNodeData(id, { source: val })}
          multiline
          placeholder="expression"
        />
      </div>
    </NodeFrame>
  );
};
