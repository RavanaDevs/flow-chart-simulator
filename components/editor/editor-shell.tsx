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
import { Terminal as TerminalIcon, Variable, AlertCircle } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState("terminal");

  const { nodes, edges } = useGraphStore();

  useRunner(speedMs);
  useAutosave();

  // Calculate diagnostic error count for Problems badge
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
        {/* Left Block Palette */}
        <div className="w-56 shrink-0 border-r border-border bg-card">
          <Palette />
        </div>

        {/* Resizable Canvas & Right Rail Split */}
        <div className="flex-1">
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
                      value="terminal"
                      className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:bg-card"
                    >
                      <TerminalIcon className="mr-1.5 h-3.5 w-3.5" />
                      Terminal
                    </TabsTrigger>
                    <TabsTrigger
                      value="variables"
                      className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:bg-card"
                    >
                      <Variable className="mr-1.5 h-3.5 w-3.5" />
                      Variables
                    </TabsTrigger>
                    <TabsTrigger
                      value="problems"
                      className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:bg-card"
                    >
                      <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                      Problems
                      {errorCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-1.5 px-1.5 py-0 text-[10px]"
                        >
                          {errorCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="terminal" className="flex-1 overflow-hidden m-0">
                    <TerminalPanel />
                  </TabsContent>
                  <TabsContent value="variables" className="flex-1 overflow-hidden m-0">
                    <VariablesPanel />
                  </TabsContent>
                  <TabsContent value="problems" className="flex-1 overflow-hidden m-0">
                    <ProblemsPanel />
                  </TabsContent>
                </Tabs>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};
