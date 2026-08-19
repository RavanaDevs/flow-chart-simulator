import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { NodePorts } from "./node-ports";

export const StopNode: React.FC<NodeProps> = ({ id, selected }) => {

  return (
    <NodeFrame id={id} kind="stop" isSelected={selected}>
      <NodePorts kind="stop" />
      <span className="font-semibold uppercase tracking-wider text-foreground">
        Stop
      </span>
    </NodeFrame>
  );
};
