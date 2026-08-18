import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { ExpressionField } from "./expression-field";
import { useRunStore } from "@/stores/run-store";
import { useGraphStore } from "@/stores/graph-store";

export const IfNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const isActive = useRunStore((s) => s.state.currentNodeId === id);
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  const source = (data as { source?: string }).source ?? "x > 0";

  return (
    <NodeFrame id={id} kind="if" isSelected={selected} isActive={isActive}>
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-primary border-2 border-background"
      />

      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground">
          Decision (If)
        </span>
        <ExpressionField
          value={source}
          onChange={(val) => updateNodeData(id, { source: val })}
          placeholder="condition"
        />
      </div>

      {/* True Handle (Bottom) */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
        true
      </div>
      <Handle
        type="source"
        id="true"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-emerald-500 border-2 border-background"
      />

      {/* False Handle (Right) */}
      <div className="absolute top-1/2 -right-7 -translate-y-1/2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
        false
      </div>
      <Handle
        type="source"
        id="false"
        position={Position.Right}
        className="!h-3 !w-3 !bg-amber-500 border-2 border-background"
      />
    </NodeFrame>
  );
};
