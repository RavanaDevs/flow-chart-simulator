import { RunError } from "./codes";

export type Severity = "error" | "warning";

export type Diagnostic = RunError & {
  severity: Severity;
  edgeId?: string;
  handle?: "true" | "false";
};
