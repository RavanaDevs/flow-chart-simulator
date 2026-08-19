import React from "react";
import { NodeKind } from "@/lib/graph/types";
import { useGraphStore } from "@/stores/graph-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getShapeSize, countLines } from "@/components/flow/shapes/geometry";
import { GRID_SIZE } from "@/lib/graph/grid";
import { useT } from "@/hooks/use-t";
import { UiKey } from "@/lib/i18n/ui-keys";
import { Play, Square, ArrowDownToLine, ArrowUpFromLine, Cpu, GitFork, CircleDot } from "lucide-react";

type PaletteItemConfig = {
  kind: NodeKind;
  labelKey: UiKey;
  descKey: UiKey;
  icon: React.ReactNode;
};

const ITEMS: PaletteItemConfig[] = [
  {
    kind: "start",
    labelKey: "palette.block.start",
    descKey: "palette.block.startDesc",
    icon: <Play className="h-4 w-4 text-emerald-500" />,
  },
  {
    kind: "process",
    labelKey: "palette.block.process",
    descKey: "palette.block.processDesc",
    icon: <Cpu className="h-4 w-4 text-blue-500" />,
  },
  {
    kind: "input",
    labelKey: "palette.block.input",
    descKey: "palette.block.inputDesc",
    icon: <ArrowDownToLine className="h-4 w-4 text-purple-500" />,
  },
  {
    kind: "output",
    labelKey: "palette.block.output",
    descKey: "palette.block.outputDesc",
    icon: <ArrowUpFromLine className="h-4 w-4 text-cyan-500" />,
  },
  {
    kind: "if",
    labelKey: "palette.block.decision",
    descKey: "palette.block.decisionDesc",
    icon: <GitFork className="h-4 w-4 text-amber-500" />,
  },
  {
    kind: "connector",
    labelKey: "palette.block.connector",
    descKey: "palette.block.connectorDesc",
    icon: <CircleDot className="h-4 w-4 text-slate-400" />,
  },
  {
    kind: "stop",
    labelKey: "palette.block.stop",
    descKey: "palette.block.stopDesc",
    icon: <Square className="h-4 w-4 text-red-500" />,
  },
];

export const Palette: React.FC = () => {
  const { t } = useT();
  const { nodes, addNode, selectedId } = useGraphStore();
  const hasStart = nodes.some((n) => n.kind === "start");

  const handleDragStart = (e: React.DragEvent, kind: NodeKind) => {
    e.dataTransfer.setData("application/reactflow-kind", kind);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleClickAdd = (kind: NodeKind, disabled: boolean) => {
    if (disabled) return;

    const selectedNode = nodes.find((n) => n.id === selectedId);
    if (!selectedNode) {
      addNode(kind, { x: 240, y: 144 });
      return;
    }

    const data = selectedNode.data as { source?: string; names?: string };
    const base = getShapeSize(
      selectedNode.kind,
      countLines(data.source ?? data.names)
    );
    const next = getShapeSize(kind);

    addNode(kind, {
      x: selectedNode.position.x + base.width / 2 - next.width / 2,
      y: selectedNode.position.y + base.height + GRID_SIZE * 3,
    });
  };

  return (
    <Card className="h-full rounded-none border-y-0 border-l-0 shadow-none">
      <CardHeader className="p-3 border-b">
        <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center justify-between">
          <span>{t("palette.title")}</span>
          <Badge variant="outline" className="text-[10px]">{t("palette.dragOrClick")}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2 overflow-y-auto">
        {ITEMS.map((item) => {
          const disabled = item.kind === "start" && hasStart;

          return (
            <div
              key={item.kind}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, item.kind)}
              onClick={() => handleClickAdd(item.kind, disabled)}
              aria-disabled={disabled}
              title={
                disabled
                  ? t("palette.startDisabledTitle")
                  : undefined
              }
              className={cn(
                "group flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 shadow-sm transition-all",
                disabled
                  ? "cursor-not-allowed opacity-45"
                  : "cursor-grab hover:border-primary hover:bg-accent hover:shadow"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background",
                  !disabled && "group-hover:border-primary"
                )}
              >
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">
                  {t(item.labelKey)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {disabled ? t("palette.alreadyOnCanvas") : t(item.descKey)}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
