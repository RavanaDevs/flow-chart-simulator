import { Span } from "../lang/tokens";

type Err<C extends string, P> = {
  code: C;
  params: P;
  span?: Span;
  nodeId?: string;
};

export type ErrorCode =
  | "LEX_UNKNOWN_CHARACTER"
  | "LEX_UNTERMINATED_STRING"
  | "PARSE_UNEXPECTED_TOKEN"
  | "PARSE_TRAILING_INPUT"
  | "PARSE_TRAILING_COMMA"
  | "PARSE_EMPTY_LIST_ITEM"
  | "OUTPUT_EMPTY"
  | "DUPLICATE_INPUT_NAME"
  | "START_HAS_INBOUND"
  | "STOP_HAS_OUTGOING"
  | "PARSE_EXPECTED_IDENTIFIER"
  | "PARSE_EXPECTED_EQUALS"
  | "PROCESS_MISSING_EQUALS"
  | "PROCESS_ASSIGN_TO_RESERVED"
  | "UNKNOWN_VARIABLE"
  | "UNKNOWN_VARIABLE_DID_YOU_MEAN"
  | "DIVIDE_BY_ZERO"
  | "TYPE_MISMATCH"
  | "IF_NOT_BOOLEAN"
  | "STEP_BUDGET_EXCEEDED"
  | "INPUT_NOT_A_NUMBER"
  | "NO_START"
  | "MULTIPLE_START"
  | "NO_STOP"
  | "DANGLING_OUTPUT"
  | "UNCONNECTED_BRANCH"
  | "UNREACHABLE_NODE"
  | "NO_REACHABLE_STOP"
  | "VARIABLE_MAYBE_UNASSIGNED"
  | "MULTIPLE_OUTGOING_EDGES"
  | "IMPORT_NOT_AN_OBJECT"
  | "IMPORT_UNSUPPORTED_VERSION"
  | "IMPORT_BAD_NODES_ARRAY"
  | "IMPORT_BAD_EDGES_ARRAY"
  | "IMPORT_BAD_NODE"
  | "IMPORT_BAD_NODE_ID"
  | "IMPORT_UNKNOWN_KIND"
  | "IMPORT_BAD_POSITION"
  | "IMPORT_BAD_EDGE"
  | "IMPORT_BAD_EDGE_IDS"
  | "IMPORT_INVALID_JSON";

export type RunError =
  | Err<"LEX_UNKNOWN_CHARACTER", { char: string }>
  | Err<"LEX_UNTERMINATED_STRING", Record<string, never>>
  | Err<"PARSE_UNEXPECTED_TOKEN", { found: string; expected: string }>
  | Err<"PARSE_TRAILING_INPUT", { extraText: string }>
  | Err<"PARSE_TRAILING_COMMA", Record<string, never>>
  | Err<"PARSE_EMPTY_LIST_ITEM", { index: number }>
  | Err<"OUTPUT_EMPTY", Record<string, never>>
  | Err<"DUPLICATE_INPUT_NAME", { name: string }>
  | Err<"START_HAS_INBOUND", Record<string, never>>
  | Err<"STOP_HAS_OUTGOING", Record<string, never>>
  | Err<"PARSE_EXPECTED_IDENTIFIER", { found: string }>
  | Err<"PARSE_EXPECTED_EQUALS", { found: string }>
  | Err<"PROCESS_MISSING_EQUALS", { src: string }>
  | Err<"PROCESS_ASSIGN_TO_RESERVED", { name: string }>
  | Err<"UNKNOWN_VARIABLE", { name: string }>
  | Err<"UNKNOWN_VARIABLE_DID_YOU_MEAN", { name: string; suggestion: string }>
  | Err<"DIVIDE_BY_ZERO", { op: "/" | "%" }>
  | Err<"TYPE_MISMATCH", { op: string; leftType: string; rightType: string }>
  | Err<"IF_NOT_BOOLEAN", { actualType: string }>
  | Err<"STEP_BUDGET_EXCEEDED", { budget: number; cycle: string[] }>
  | Err<"INPUT_NOT_A_NUMBER", { text: string }>
  | Err<"NO_START", Record<string, never>>
  | Err<"MULTIPLE_START", Record<string, never>>
  | Err<"NO_STOP", Record<string, never>>
  | Err<"DANGLING_OUTPUT", { nodeKind: string }>
  | Err<"UNCONNECTED_BRANCH", { branch: "true" | "false" }>
  | Err<"UNREACHABLE_NODE", { nodeKind: string }>
  | Err<"NO_REACHABLE_STOP", Record<string, never>>
  | Err<"VARIABLE_MAYBE_UNASSIGNED", { name: string }>
  | Err<"MULTIPLE_OUTGOING_EDGES", { handle?: string }>
  | Err<"IMPORT_NOT_AN_OBJECT", Record<string, never>>
  | Err<"IMPORT_UNSUPPORTED_VERSION", { version: string; maxVersion: number }>
  | Err<"IMPORT_BAD_NODES_ARRAY", Record<string, never>>
  | Err<"IMPORT_BAD_EDGES_ARRAY", Record<string, never>>
  | Err<"IMPORT_BAD_NODE", { index: number }>
  | Err<"IMPORT_BAD_NODE_ID", { index: number }>
  | Err<"IMPORT_UNKNOWN_KIND", { id: string; kind: string }>
  | Err<"IMPORT_BAD_POSITION", { id: string }>
  | Err<"IMPORT_BAD_EDGE", { index: number }>
  | Err<"IMPORT_BAD_EDGE_IDS", { index: number }>
  | Err<"IMPORT_INVALID_JSON", { error: string }>;
