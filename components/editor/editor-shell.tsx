"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { ReactFlowProvider } from "@xyflow/react";
import { Toolbar } from "./toolbar";
import { Palette } from "./palette";
import { TerminalPanel } from "../panels/terminal-panel";
import { VariablesPanel } from "../panels/variables-panel";
import { ProblemsPanel } from "../panels/problems-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useRunner } from "@/hooks/use-runner";
import { useFollowNode } from "@/hooks/use-follow-node";
import { useAutosave } from "@/hooks/use-autosave";
import { useGraphStore } from "@/stores/graph-store";
import { compile } from "@/lib/graph/compile";
import { useT } from "@/hooks/use-t";
import { Terminal as TerminalIcon, Variable, AlertCircle, PanelRightClose, PanelRightOpen } from "lucide-react";

import { useRunStore } from "@/stores/run-store";
import { cn } from "@/lib/utils";

// Client-only dynamic mount for ReactFlow Canvas
const FlowCanvas = dynamic(
  () => import("../flow/flow-canvas").then((mod) => mod.FlowCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-background text-xs font-semibold text-muted-foreground">
        Loading Flowchart Canvas...
      </div>
    ),
  }
);

export const EditorShell: React.FC = () => {
  const [speedMs, setSpeedMs] = useState(400);
  const [followNode, setFollowNode] = useState(true);
  const [activeTab, setActiveTab] = useState("output");

  const { nodes, edges } = useGraphStore();

  useRunner(speedMs);
  useAutosave();

  const cRes = useMemo(() => compile({ nodes, edges }), [nodes, edges]);
  const errorCount = useMemo(() => {
    if (!cRes.ok) return cRes.diagnostics.length;
    return cRes.program.warnings.length;
  }, [cRes]);

  return (
    <ReactFlowProvider>
      <InnerEditorShell
        speedMs={speedMs}
        setSpeedMs={setSpeedMs}
        followNode={followNode}
        setFollowNode={setFollowNode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        errorCount={errorCount}
      />
    </ReactFlowProvider>
  );
};

const InnerEditorShell: React.FC<{
  speedMs: number;
  setSpeedMs: (speed: number) => void;
  followNode: boolean;
  setFollowNode: (follow: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  errorCount: number;
}> = ({
  speedMs,
  setSpeedMs,
  followNode,
  setFollowNode,
  activeTab,
  setActiveTab,
  errorCount,
}) => {
  const { t } = useT();
  const status = useRunStore((s) => s.state.status);
  const isWatching = status !== "idle";
  const [isRailCollapsed, setIsRailCollapsed] = useState(true);

  useFollowNode(followNode);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top Action Toolbar */}
      <Toolbar
        speedMs={speedMs}
        setSpeedMs={setSpeedMs}
        followNode={followNode}
        setFollowNode={setFollowNode}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Block Palette — collapses when watching execution */}
        <div
          className={cn(
            "shrink-0 border-r border-border bg-card transition-all duration-300 overflow-hidden",
            isWatching ? "w-0 opacity-0 border-r-0" : "w-56 opacity-100"
          )}
        >
          <Palette />
        </div>

        {/* Resizable Canvas & Right Rail Split */}
        <div className="flex flex-1 overflow-hidden">
          {isRailCollapsed ? (
            <>
              <div className="flex-1">
                <FlowCanvas />
              </div>
              <div className="flex h-full w-10 shrink-0 flex-col items-center border-l border-border bg-card py-2">
                <button
                  type="button"
                  onClick={() => setIsRailCollapsed(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                  title="Expand record panel"
                >
                  <PanelRightOpen className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <ResizablePanelGroup orientation="horizontal">
              {/* Left Flow Canvas */}
              <ResizablePanel defaultSize={65} minSize={30}>
                <FlowCanvas />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Right Output Rail */}
              <ResizablePanel defaultSize={35} minSize={20}>
                <div className="flex h-full flex-col bg-card border-l border-border">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex h-full flex-col"
                  >
                    <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/40 p-0 h-10">
                      <TabsTrigger
                        value="output"
                        className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:bg-card"
                      >
                        <TerminalIcon className="mr-1.5 h-3.5 w-3.5" />
                        {t("tab.output")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="values"
                        className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:bg-card"
                      >
                        <Variable className="mr-1.5 h-3.5 w-3.5" />
                        {t("tab.values")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="checks"
                        className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:bg-card"
                      >
                        <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                        {t("tab.checks")}
                        {errorCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-1.5 px-1.5 py-0 text-[10px]"
                          >
                            {errorCount}
                          </Badge>
                        )}
                      </TabsTrigger>

                      <div className="ml-auto flex items-center pr-2">
                        <button
                          type="button"
                          onClick={() => setIsRailCollapsed(true)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                          title="Collapse record panel"
                        >
                          <PanelRightClose className="h-4 w-4" />
                        </button>
                      </div>
                    </TabsList>

                    <TabsContent value="output" className="flex-1 overflow-hidden m-0">
                      <TerminalPanel />
                    </TabsContent>
                    <TabsContent value="values" className="flex-1 overflow-hidden m-0">
                      <VariablesPanel />
                    </TabsContent>
                    <TabsContent value="checks" className="flex-1 overflow-hidden m-0">
                      <ProblemsPanel />
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </div>
    </div>
  );
};
