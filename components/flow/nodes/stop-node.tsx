import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";

export const StopNode: React.FC<NodeProps> = ({ id, selected }) => {

  return (
    <NodeFrame id={id} kind="stop" isSelected={selected}>
      <span className="font-semibold uppercase tracking-wider text-foreground">
        Stop
      </span>
    </NodeFrame>
  );
};
