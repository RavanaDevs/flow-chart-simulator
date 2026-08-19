import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";

export const StartNode: React.FC<NodeProps> = ({ id, selected }) => {

  return (
    <NodeFrame id={id} kind="start" isSelected={selected}>
      <span className="font-semibold uppercase tracking-wider text-foreground">
        Start
      </span>
    </NodeFrame>
  );
};
