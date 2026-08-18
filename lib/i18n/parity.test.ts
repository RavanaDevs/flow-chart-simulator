import { describe, it, expect } from "vitest";
import enCatalog from "../../messages/en.json";
import { ErrorCode } from "../errors/codes";

const ALL_ERROR_CODES: ErrorCode[] = [
  "LEX_UNKNOWN_CHARACTER",
  "LEX_UNTERMINATED_STRING",
  "PARSE_UNEXPECTED_TOKEN",
  "PARSE_TRAILING_INPUT",
  "PARSE_EXPECTED_IDENTIFIER",
  "PARSE_EXPECTED_EQUALS",
  "PROCESS_MISSING_EQUALS",
  "PROCESS_ASSIGN_TO_RESERVED",
  "UNKNOWN_VARIABLE",
  "DIVIDE_BY_ZERO",
  "TYPE_MISMATCH",
  "IF_NOT_BOOLEAN",
  "STEP_BUDGET_EXCEEDED",
  "INPUT_NOT_A_NUMBER",
  "NO_START",
  "MULTIPLE_START",
  "NO_STOP",
  "DANGLING_OUTPUT",
  "UNCONNECTED_BRANCH",
  "UNREACHABLE_NODE",
  "NO_REACHABLE_STOP",
  "VARIABLE_MAYBE_UNASSIGNED",
  "MULTIPLE_OUTGOING_EDGES",
];

describe("i18n Catalogue Parity", () => {
  it("has an en.json entry with message and hint for every ErrorCode", () => {
    const catalogKeys = Object.keys(enCatalog);
    for (const code of ALL_ERROR_CODES) {
      expect(catalogKeys).toContain(code);
      const entry = (enCatalog as Record<string, { message: string; hint: string }>)[code];
      expect(entry).toBeDefined();
      expect(entry.message).toBeTruthy();
      expect(entry.hint).toBeTruthy();
    }
  });

  it("has no orphaned keys in en.json", () => {
    const catalogKeys = Object.keys(enCatalog);
    for (const key of catalogKeys) {
      expect(ALL_ERROR_CODES).toContain(key as ErrorCode);
    }
  });
});
