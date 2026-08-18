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
        className={cn(
          "nodrag nowheel w-full rounded bg-background/80 px-2 py-1 text-center font-mono text-xs font-semibold shadow-inner outline-none ring-1 ring-border transition-colors focus:bg-background focus:ring-primary",
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
