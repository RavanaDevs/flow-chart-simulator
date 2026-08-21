import React from "react";
import { NodeProps } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { ExpressionField } from "./expression-field";
import { countLines } from "../shapes/geometry";
import { useGraphStore } from "@/stores/graph-store";
import { useT } from "@/hooks/use-t";
import { InputValueType } from "@/lib/graph/types";

import { BlockPrompt } from "./block-prompt";

export const InputNode: React.FC<NodeProps> = ({ id, selected, data }) => {
  const { t } = useT();
  const updateNodeData = useGraphStore((s) => s.updateNodeData);

  const names = (data as { names?: string }).names ?? "x";
  const valueType = ((data as { valueType?: InputValueType }).valueType ?? "number") as InputValueType;

  return (
    <NodeFrame
      id={id}
      kind="input"
      isSelected={selected}
      lines={countLines(names)}
      overlay={<BlockPrompt nodeId={id} />}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground">
          <span>{t("block.input")}</span>
          <select
            value={valueType}
            onChange={(e) =>
              updateNodeData(id, { valueType: e.target.value as InputValueType })
            }
            className="nodrag nowheel cursor-pointer rounded bg-transparent px-1 py-0.5 text-[10px] normal-case text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus:text-foreground"
          >
            <option value="number">number</option>
            <option value="text">text</option>
          </select>
        </div>
        <ExpressionField
          value={names}
          onChange={(val) => updateNodeData(id, { names: val })}
          placeholder={t("block.inputPlaceholder")}
          multiline
        />
      </div>
    </NodeFrame>
  );
};
