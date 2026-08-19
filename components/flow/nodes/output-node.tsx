import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { ExpressionField } from "./expression-field";
import { countLines } from "../shapes/geometry";
import { useGraphStore } from "@/stores/graph-store";
import { useT } from "@/hooks/use-t";

export const OutputNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const { t } = useT();
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  const source = (data as { source?: string }).source ?? `"Hello"`;

  return (
    <NodeFrame id={id} kind="output" isSelected={selected} lines={countLines(source)}>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase font-bold text-muted-foreground">
          {t("block.output")}
        </span>
        <ExpressionField
          value={source}
          onChange={(val) => updateNodeData(id, { source: val })}
          multiline
          placeholder={t("block.outputPlaceholder")}
        />
      </div>
    </NodeFrame>
  );
};
