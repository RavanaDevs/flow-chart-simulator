import React from "react";
import { TerminalLine as TLine } from "@/lib/run/state";
import { resolveMessage } from "@/lib/i18n/resolve";
import { AlertCircle, ChevronRight, Info } from "lucide-react";

type TerminalLineProps = {
  line: TLine;
};

export const TerminalLine: React.FC<TerminalLineProps> = ({ line }) => {
  switch (line.kind) {
    case "output":
      return (
        <div className="font-mono text-sm font-semibold text-foreground leading-relaxed">
          {line.text}
        </div>
      );

    case "prompt":
      return (
        <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          <ChevronRight className="h-3.5 w-3.5 text-primary" />
          <span>Please enter value for <strong className="text-foreground">{line.varName}</strong> ({line.valueType}):</span>
        </div>
      );

    case "echo":
      return (
        <div className="pl-3 border-l-2 border-primary/50 font-mono text-xs font-medium text-muted-foreground">
          {line.text}
        </div>
      );

    case "error": {
      const { message, hint } = resolveMessage(line.error);
      return (
        <div className="my-1.5 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 font-mono text-xs text-destructive">
          <div className="flex items-start gap-2 font-semibold">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
          {hint && (
            <div className="mt-1 pl-6 text-[11px] font-normal opacity-90 leading-normal">
              💡 {hint}
            </div>
          )}
        </div>
      );
    }

    case "system":
      return (
        <div className="flex items-center gap-1.5 py-0.5 font-mono text-xs italic text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>
            {line.code === "PROGRAM_FINISHED" && "Program finished execution."}
            {line.code === "PROGRAM_RESET" && "Program state reset."}
            {line.code === "EDIT_DURING_RUN" && "Flowchart edited — reset program execution."}
            {line.code === "OUTPUT_TRUNCATED" && "[Output log truncated to 2000 lines]"}
          </span>
        </div>
      );
  }
};
