import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { useT } from "@/hooks/use-t";

export const StartNode: React.FC<NodeProps> = ({ id, selected }) => {
  const { t } = useT();

  return (
    <NodeFrame id={id} kind="start" isSelected={selected}>
      <span className="font-semibold uppercase tracking-wider text-foreground">
        {t("block.start")}
      </span>
    </NodeFrame>
  );
};
