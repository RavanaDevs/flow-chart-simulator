import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { ExpressionField } from "./expression-field";
import { useRunStore } from "@/stores/run-store";
import { useGraphStore } from "@/stores/graph-store";
import { InputValueType } from "@/lib/graph/types";

export const InputNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const currentNodeId = useRunStore((s) => s.state.currentNodeId);
  const status = useRunStore((s) => s.state.status);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  const isActive = currentNodeId === id;
  const isAwaiting = isActive && status === "awaiting-input";

  const varName = (data as { varName?: string }).varName ?? "x";
  const valueType = ((data as { valueType?: InputValueType }).valueType ?? "number") as InputValueType;

  return (
    <NodeFrame id={id} kind="input" isSelected={selected} isActive={isActive}>
      {isAwaiting && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg animate-bounce whitespace-nowrap">
          <span>Type in Terminal</span> ↵
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-primary border-2 border-background"
      />
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
          <span>Input</span>
          <select
            value={valueType}
            onChange={(e) =>
              updateNodeData(id, { valueType: e.target.value as InputValueType })
            }
            className="nodrag nowheel rounded border border-border bg-background px-1 py-0.5 text-[10px] normal-case"
          >
            <option value="number">number</option>
            <option value="text">text</option>
          </select>
        </div>
        <ExpressionField
          value={varName}
          onChange={(val) => updateNodeData(id, { varName: val })}
          placeholder="varName"
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
