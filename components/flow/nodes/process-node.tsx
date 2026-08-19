import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { NodePorts } from "./node-ports";
import { ExpressionField } from "./expression-field";
import { useGraphStore } from "@/stores/graph-store";

export const ProcessNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  const source = (data as { source?: string }).source ?? "x = 1";

  return (
    <NodeFrame id={id} kind="process" isSelected={selected}>
      <NodePorts kind="process" />
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground">
          Process
        </span>
        <ExpressionField
          value={source}
          onChange={(val) => updateNodeData(id, { source: val })}
          placeholder="x = 1"
        />
      </div>
    </NodeFrame>
  );
};
