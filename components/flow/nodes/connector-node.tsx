import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";

/**
 * A merge junction: several paths arrive, one path leaves. It performs no
 * operation — it exists so branches can rejoin at a visible point instead of
 * three arrows converging on the side of some unrelated block.
 */
export const ConnectorNode: React.FC<NodeProps> = ({ id, selected }) => {
  return (
    <NodeFrame id={id} kind="connector" isSelected={selected} label="Connector">
      <span className="sr-only">Connector</span>
    </NodeFrame>
  );
};
