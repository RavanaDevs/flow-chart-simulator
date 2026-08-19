import React, { useState } from "react";
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
  FilePlus2,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AUTOSAVE_KEY } from "@/hooks/use-autosave";
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
  const { nodes, edges, loadDocument, resetGraph } = useGraphStore();
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
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

  // Clearing the canvas must also drop the compiled Program and the autosave
  // slot, or a mid-run reset would keep executing a chart that no longer
  // exists and a reload would resurrect what the student just cleared.
  const handleNew = () => {
    resetGraph();
    resetRun();
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch {
      // private-mode or quota failures are not worth blocking the reset over
    }
    setConfirmNewOpen(false);
    toast.success("Canvas cleared. A fresh Start block is ready.");
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
            <option value={0}>Instant</option>
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
          <Dialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
            <DialogTrigger
              render={
                <Button size="sm" variant="outline" title="Clear the canvas" />
              }
            >
              <FilePlus2 className="mr-1.5 h-3.5 w-3.5" />
              New
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear the canvas?</DialogTitle>
                <DialogDescription>
                  This deletes every block and arrow in this flowchart, and
                  removes the saved copy in this browser. You will get a fresh
                  Start block. This cannot be undone — export first if you want
                  to keep it.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button variant="destructive" onClick={handleNew}>
                  Clear everything
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
