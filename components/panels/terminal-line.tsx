import React from "react";
import { TerminalLine as TLine } from "@/lib/run/state";
import { useT } from "@/hooks/use-t";
import { UiKey } from "@/lib/i18n/ui-keys";
import { AlertCircle, ChevronRight, Info } from "lucide-react";

type TerminalLineProps = {
  line: TLine;
};

export const TerminalLine: React.FC<TerminalLineProps> = ({ line }) => {
  const { t, resolveMessage } = useT();

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
          <span>
            {t("panel.terminal.promptFor", {
              varName: line.varName,
              valueType: line.valueType,
            })}
          </span>
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
            {t(`panel.terminal.sys.${line.code}` as UiKey)}
          </span>
        </div>
      );
  }
};
