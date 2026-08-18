import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { useRunStore } from "@/stores/run-store";

export const StopNode: React.FC<NodeProps> = ({ id, selected }) => {
  const isActive = useRunStore((s) => s.state.currentNodeId === id);

  return (
    <NodeFrame id={id} kind="stop" isSelected={selected} isActive={isActive}>
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-primary border-2 border-background"
      />
      <span className="font-semibold uppercase tracking-wider text-foreground">
        Stop
      </span>
    </NodeFrame>
  );
};
