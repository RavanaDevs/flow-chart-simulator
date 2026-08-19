import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { ExpressionField } from "./expression-field";
import { useGraphStore } from "@/stores/graph-store";
import { useT } from "@/hooks/use-t";

export const IfNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const { t } = useT();
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  const source = (data as { source?: string }).source ?? "x > 0";

  return (
    <NodeFrame id={id} kind="if" isSelected={selected}>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground">
          {t("block.decision")}
        </span>
        <ExpressionField
          value={source}
          onChange={(val) => updateNodeData(id, { source: val })}
          placeholder={t("block.conditionPlaceholder")}
        />
      </div>
    </NodeFrame>
  );
};
