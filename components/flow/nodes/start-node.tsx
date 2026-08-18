import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { useRunStore } from "@/stores/run-store";

export const StartNode: React.FC<NodeProps> = ({ id, selected }) => {
  const isActive = useRunStore((s) => s.state.currentNodeId === id);

  return (
    <NodeFrame id={id} kind="start" isSelected={selected} isActive={isActive}>
      <span className="font-semibold uppercase tracking-wider text-foreground">
        Start
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-primary border-2 border-background"
      />
    </NodeFrame>
  );
};
