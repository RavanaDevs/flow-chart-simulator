import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { ExpressionField } from "./expression-field";
import { useRunStore } from "@/stores/run-store";
import { useGraphStore } from "@/stores/graph-store";

export const OutputNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const isActive = useRunStore((s) => s.state.currentNodeId === id);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  const source = (data as { source?: string }).source ?? `"Hello"`;

  return (
    <NodeFrame id={id} kind="output" isSelected={selected} isActive={isActive}>
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-primary border-2 border-background"
      />
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground">
          Output
        </span>
        <ExpressionField
          value={source}
          onChange={(val) => updateNodeData(id, { source: val })}
          placeholder="expression"
        />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-primary border-2 border-background"
      />
    </NodeFrame>
  );
};
