"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRunStore } from "@/stores/run-store";
import { useT } from "@/hooks/use-t";
import { CornerDownLeft, AlertCircle } from "lucide-react";

type BlockPromptProps = {
  nodeId: string;
};

export const BlockPrompt: React.FC<BlockPromptProps> = ({ nodeId }) => {
  const { t, resolveMessage } = useT();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const status = useRunStore((s) => s.state.status);
  const pendingInput = useRunStore((s) => s.state.pendingInput);
  const inputError = useRunStore((s) => s.state.inputError);
  const submitInput = useRunStore((s) => s.submitInput);

  const isCurrentPrompt =
    status === "awaiting-input" && pendingInput?.nodeId === nodeId;

  useEffect(() => {
    if (isCurrentPrompt) {
      // Focus immediately without scroll-jacking
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [isCurrentPrompt, pendingInput?.varName, pendingInput?.index]);

  if (!isCurrentPrompt || !pendingInput) {
    return null;
  }

  const { varName, type, index, total } = pendingInput;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() === "" && type === "number") return;
    submitInput(value);
    setValue("");
  };

  const resolvedError = inputError ? resolveMessage(inputError) : null;

  return (
    <div
      aria-live="assertive"
      className="nodrag nowheel absolute -top-3 left-full ml-4 z-50 flex w-56 flex-col gap-2 rounded-xl border border-primary/30 bg-card p-3 shadow-xl backdrop-blur"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-primary">
          {varName}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {type}
          </span>
          {total > 1 && (
            <span className="font-semibold">
              {index + 1}/{total}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor={`block-input-${nodeId}`} className="sr-only">
          {varName}
        </label>
        <div className="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-primary/40">
          <input
            id={`block-input-${nodeId}`}
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode={type === "number" ? "decimal" : "text"}
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
            placeholder={t("panel.terminal.typeInputPlaceholder", { type })}
          />
          <button
            type="submit"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground transition-all hover:opacity-90"
            title="Submit input"
          >
            <CornerDownLeft className="h-3 w-3" />
          </button>
        </div>
      </form>

      {resolvedError && (
        <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 p-1.5 text-[11px] text-destructive">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{resolvedError.message}</span>
        </div>
      )}
    </div>
  );
};
