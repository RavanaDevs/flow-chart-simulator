import React from "react";
import { useRunStore } from "@/stores/run-store";
import { typeOf, formatValue } from "@/lib/lang/values";
import { Badge } from "@/components/ui/badge";
import { Variable } from "lucide-react";

export const VariablesPanel: React.FC = () => {
  const variables = useRunStore((s) => s.state.variables);
  const entries = Object.entries(variables);

  return (
    <div className="h-full w-full overflow-y-auto bg-card p-3 select-text">
      {entries.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
          <Variable className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-xs font-medium">No variables defined yet</p>
          <p className="text-[11px] opacity-70">Variables created in Process or Input blocks will appear here</p>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-muted text-[10px] uppercase font-bold text-muted-foreground border-b border-border">
              <tr>
                <th className="p-2">Variable</th>
                <th className="p-2">Type</th>
                <th className="p-2">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map(([name, val]) => {
                const valType = typeOf(val);
                return (
                  <tr key={name} className="hover:bg-accent/40 transition-colors">
                    <td className="p-2 font-bold text-foreground">{name}</td>
                    <td className="p-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-sans font-semibold"
                      >
                        {valType}
                      </Badge>
                    </td>
                    <td className="p-2 font-semibold text-primary">
                      {formatValue(val)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
