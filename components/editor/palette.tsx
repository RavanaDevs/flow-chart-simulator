import React from "react";
import { NodeKind } from "@/lib/graph/types";
import { useGraphStore } from "@/stores/graph-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getShapeSize } from "@/components/flow/shapes/geometry";
import { GRID_SIZE } from "@/lib/graph/grid";
import { Play, Square, ArrowDownToLine, ArrowUpFromLine, Cpu, GitFork } from "lucide-react";

type PaletteItem = {
  kind: NodeKind;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const ITEMS: PaletteItem[] = [
  {
    kind: "start",
    label: "Start",
    description: "Begins the flowchart",
    icon: <Play className="h-4 w-4 text-emerald-500" />,
  },
  {
    kind: "process",
    label: "Process",
    description: "Calculates or sets a variable (x = 1)",
    icon: <Cpu className="h-4 w-4 text-blue-500" />,
  },
  {
    kind: "input",
    label: "Input",
    description: "Asks user for input value",
    icon: <ArrowDownToLine className="h-4 w-4 text-purple-500" />,
  },
  {
    kind: "output",
    label: "Output",
    description: "Displays a message or answer",
    icon: <ArrowUpFromLine className="h-4 w-4 text-cyan-500" />,
  },
  {
    kind: "if",
    label: "Decision (If)",
    description: "Branches on true/false condition",
    icon: <GitFork className="h-4 w-4 text-amber-500" />,
  },
  {
    kind: "stop",
    label: "Stop",
    description: "Ends execution",
    icon: <Square className="h-4 w-4 text-red-500" />,
  },
];

export const Palette: React.FC = () => {
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

    // Drop the new block directly below the selected one and share a centre
    // line, so the connecting arrow comes out straight. Every shape dimension
    // is a whole number of grid steps, so this offset survives snapping.
    const base = getShapeSize(selectedNode.kind);
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
          <span>Blocks Palette</span>
          <Badge variant="outline" className="text-[10px]">Drag or Click</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2 overflow-y-auto">
        {ITEMS.map((item) => {
          // A flowchart has exactly one Start. Grey the item out rather than
          // removing it, so the block is still discoverable and the reason it
          // is unavailable is visible.
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
                  ? "Your flowchart already has a Start block"
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
                  {item.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {disabled ? "Already on the canvas" : item.description}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
