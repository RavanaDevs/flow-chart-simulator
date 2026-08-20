import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGraphStore } from "@/stores/graph-store";
import { useRunStore } from "@/stores/run-store";
import { compile } from "@/lib/graph/compile";
import { useT } from "@/hooks/use-t";
import { LocaleToggle } from "./locale-toggle";
import { ThemeToggle } from "./theme-toggle";
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

import { useReactFlow } from "@xyflow/react";

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
  const { t, resolveMessage } = useT();
  const { nodes, edges, loadDocument, resetGraph } = useGraphStore();
  const [confirmNewOpen, setConfirmNewOpen] = useState(false);
  const { state, history, loadProgram, tick, stepBack, resetRun } = useRunStore();
  const { fitView } = useReactFlow();

  const handleReset = () => {
    resetRun();
    fitView({ duration: 400, padding: 0.2 });
  };

  const handleRun = () => {
    const cRes = compile({ nodes, edges });
    if (!cRes.ok) {
      const errRes = resolveMessage(cRes.diagnostics[0]);
      toast.error(errRes.message);
      return;
    }
    loadProgram(cRes.program);
    useRunStore.getState().tick();
  };

  const handleStep = () => {
    if (state.status === "idle") {
      const cRes = compile({ nodes, edges });
      if (!cRes.ok) {
        const errRes = resolveMessage(cRes.diagnostics[0]);
        toast.error(errRes.message);
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
    toast.success(t("toast.exported"));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = importDocument(content);
      if (!res.ok) {
        const { message } = resolveMessage(res.error);
        toast.error(t("toast.importFailed", { error: message }));
        return;
      }
      loadDocument(res.doc.nodes, res.doc.edges);
      resetRun();
      toast.success(t("toast.imported"));
    };
    reader.readAsText(file);
  };

  const handleNew = () => {
    resetGraph();
    resetRun();
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch {
      // private-mode or quota failures are not worth blocking the reset over
    }
    setConfirmNewOpen(false);
    toast.success(t("toast.cleared"));
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
          className="bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Play className="mr-1.5 h-4 w-4 fill-current" />
          {t("toolbar.run")}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleStep}
          disabled={isRunning || state.status === "finished" || state.status === "error"}
        >
          <StepForward className="mr-1.5 h-4 w-4" />
          {t("toolbar.step")}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={stepBack}
          disabled={history.length === 0 || isRunning}
          title={t("toolbar.stepBack")}
        >
          <Undo2 className="mr-1.5 h-4 w-4" />
          {t("toolbar.stepBack")}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          disabled={state.status === "idle" && history.length === 0}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          {t("toolbar.reset")}
        </Button>
      </div>

      {/* Speed & Viewport Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Gauge className="h-4 w-4" />
          <span>{t("toolbar.speed")}:</span>
          <select
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            className="rounded border border-border bg-background px-2 py-1 text-xs font-semibold"
          >
            <option value={800}>{t("toolbar.speedSlow")}</option>
            <option value={400}>{t("toolbar.speedNormal")}</option>
            <option value={150}>{t("toolbar.speedFast")}</option>
            <option value={0}>{t("toolbar.speedInstant")}</option>
          </select>
        </div>

        <Button
          size="sm"
          variant={followNode ? "secondary" : "ghost"}
          onClick={() => setFollowNode(!followNode)}
          title={t("toolbar.follow")}
          className="text-xs"
        >
          <Focus className="mr-1.5 h-4 w-4" />
          {t("toolbar.follow")}
        </Button>

        {/* Theme & Locale Toggles */}
        <ThemeToggle />
        <LocaleToggle />

        {/* Persistence Actions */}
        <div className="flex items-center gap-1.5 border-l border-border pl-3">
          <Dialog open={confirmNewOpen} onOpenChange={setConfirmNewOpen}>
            <DialogTrigger
              render={
                <Button size="sm" variant="outline" title={t("toolbar.confirmNewTitle")} />
              }
            >
              <FilePlus2 className="mr-1.5 h-3.5 w-3.5" />
              {t("toolbar.new")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("toolbar.confirmNewTitle")}</DialogTitle>
                <DialogDescription>
                  {t("toolbar.confirmNewDescription")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  {t("toolbar.cancel")}
                </DialogClose>
                <Button variant="destructive" onClick={handleNew}>
                  {t("toolbar.confirm")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t("toolbar.export")}
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
              {t("toolbar.import")}
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
