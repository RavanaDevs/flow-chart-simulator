import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { NodePorts } from "./node-ports";
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

  const names = (data as { names?: string }).names ?? "x";
  const valueType = ((data as { valueType?: InputValueType }).valueType ?? "number") as InputValueType;

  return (
    <NodeFrame id={id} kind="input" isSelected={selected}>
      <NodePorts kind="input" />
      {isAwaiting && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg animate-bounce whitespace-nowrap">
          <span>Type in Terminal</span> ↵
        </div>
      )}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
          <span>Input</span>
          <select
            value={valueType}
            onChange={(e) =>
              updateNodeData(id, { valueType: e.target.value as InputValueType })
            }
            className="nodrag nowheel cursor-pointer rounded bg-transparent px-1 py-0.5 text-[10px] normal-case text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus:text-foreground"
          >
            <option value="number">number</option>
            <option value="text">text</option>
          </select>
        </div>
        <ExpressionField
          value={names}
          onChange={(val) => updateNodeData(id, { names: val })}
          placeholder="name, name"
        />
      </div>
    </NodeFrame>
  );
};
