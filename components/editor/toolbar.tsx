import React from "react";
import { Button } from "@/components/ui/button";
import { useGraphStore } from "@/stores/graph-store";
import { useRunStore } from "@/stores/run-store";
import { compile } from "@/lib/graph/compile";
import {
  Play,
  StepForward,
  RotateCcw,
  Undo2,
  Download,
  Upload,
  Focus,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";
import { exportDocument, importDocument } from "@/lib/persistence/document";

type ToolbarProps = {
  speedMs: number;
  setSpeedMs: (speed: number) => void;
  followNode: boolean;
  setFollowNode: (follow: boolean) => void;
};

export const Toolbar: React.FC<ToolbarProps> = ({
  speedMs,
  setSpeedMs,
  followNode,
  setFollowNode,
}) => {
  const { nodes, edges, loadDocument } = useGraphStore();
  const { state, history, loadProgram, tick, stepBack, resetRun } = useRunStore();

  const handleRun = () => {
    const cRes = compile({ nodes, edges });
    if (!cRes.ok) {
      toast.error("Cannot run flowchart: Please resolve the errors in the Problems panel.");
      return;
    }
    loadProgram(cRes.program);
    useRunStore.getState().tick();
  };

  const handleStep = () => {
    if (state.status === "idle") {
      const cRes = compile({ nodes, edges });
      if (!cRes.ok) {
        toast.error("Cannot step flowchart: Please resolve the errors first.");
        return;
      }
      loadProgram(cRes.program);
    }
    tick();
  };

  const handleExport = () => {
    const jsonStr = exportDocument(nodes, edges);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowchart-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Flowchart exported successfully.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = importDocument(content);
      if (!res.ok) {
        toast.error(`Import failed: ${res.error}`);
        return;
      }
      loadDocument(res.doc.nodes, res.doc.edges);
      resetRun();
      toast.success("Flowchart imported successfully.");
    };
    reader.readAsText(file);
  };

  const isRunning = state.status === "running";

  return (
    <div className="flex h-12 w-full items-center justify-between border-b border-border bg-card px-4 shadow-sm">
      {/* Run / Execution Controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleRun}
          disabled={isRunning}
          className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
        >
          <Play className="mr-1.5 h-4 w-4 fill-current" />
          Run
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleStep}
          disabled={isRunning || state.status === "finished" || state.status === "error"}
        >
          <StepForward className="mr-1.5 h-4 w-4" />
          Step
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={stepBack}
          disabled={history.length === 0 || isRunning}
          title="Step backwards one state"
        >
          <Undo2 className="mr-1.5 h-4 w-4" />
          Step Back
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={resetRun}
          disabled={state.status === "idle" && history.length === 0}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Speed & Viewport Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Gauge className="h-4 w-4" />
          <span>Speed:</span>
          <select
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            className="rounded border border-border bg-background px-2 py-1 text-xs font-semibold"
          >
            <option value={800}>Slow (800ms)</option>
            <option value={400}>Normal (400ms)</option>
            <option value={150}>Fast (150ms)</option>
            <option value={20}>Instant</option>
          </select>
        </div>

        <Button
          size="sm"
          variant={followNode ? "secondary" : "ghost"}
          onClick={() => setFollowNode(!followNode)}
          title="Follow active block in viewport"
          className="text-xs"
        >
          <Focus className="mr-1.5 h-4 w-4" />
          Follow Node
        </Button>

        {/* Persistence Actions */}
        <div className="flex items-center gap-1.5 border-l border-border pl-3">
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <div className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold shadow-xs hover:bg-accent hover:text-accent-foreground">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Import
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
