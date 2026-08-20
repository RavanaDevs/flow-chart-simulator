import { NodeProps, useReactFlow } from "@xyflow/react";
import { NodeFrame } from "./node-frame";
import { useT } from "@/hooks/use-t";

import { useRunStore } from "@/stores/run-store";
import { RotateCcw } from "lucide-react";

export const StopNode: React.FC<NodeProps> = ({ id, selected }) => {
  const { t } = useT();
  const status = useRunStore((s) => s.state.status);
  const currentNodeId = useRunStore((s) => s.state.currentNodeId);
  const resetRun = useRunStore((s) => s.resetRun);
  const { fitView } = useReactFlow();

  const isFinishedHere = status === "finished" && currentNodeId === id;

  return (
    <NodeFrame id={id} kind="stop" isSelected={selected}>
      <span className="font-semibold uppercase tracking-wider text-foreground">
        {t("block.stop")}
      </span>

      {isFinishedHere && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            resetRun();
            fitView({ duration: 400, padding: 0.2 });
          }}
          className="nodrag nowheel absolute -top-3 left-full ml-4 z-50 flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 animate-in fade-in zoom-in-95 cursor-pointer"
          title={t("toolbar.reset")}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{t("toolbar.reset")}</span>
        </button>
      )}
    </NodeFrame>
  );
};
