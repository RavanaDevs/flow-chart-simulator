import React from "react";
import { cn } from "@/lib/utils";
import { Span } from "@/lib/lang/tokens";

type ExpressionFieldProps = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  errorSpan?: Span;
  className?: string;
};

/**
 * Edits block contents in place. The field carries no chrome of its own —
 * at rest it reads as plain text sitting on the block. A transparent bottom
 * border is always present so colouring it on focus causes no layout shift.
 */
export const ExpressionField: React.FC<ExpressionFieldProps> = ({
  value,
  onChange,
  placeholder,
  errorSpan,
  className,
}) => {
  return (
    <div className="relative inline-block w-full max-w-[150px]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className={cn(
          "nodrag nowheel w-full cursor-text border-b border-transparent bg-transparent px-1 py-0.5 text-center font-mono text-xs font-semibold text-foreground outline-none transition-colors",
          "placeholder:font-normal placeholder:text-muted-foreground/60",
          "hover:bg-foreground/5 focus:border-primary focus:bg-foreground/5",
          className
        )}
      />
      {errorSpan && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
          <div
            className="h-full bg-destructive underline decoration-wavy"
            style={{
              marginLeft: `${(errorSpan[0] / Math.max(1, value.length)) * 100}%`,
              width: `${
                ((errorSpan[1] - errorSpan[0]) / Math.max(1, value.length)) * 100
              }%`,
            }}
          />
        </div>
      )}
    </div>
  );
};
