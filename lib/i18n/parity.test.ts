import { describe, it, expect } from "vitest";
import enCatalog from "../../messages/en.json";
import siCatalog from "../../messages/si.json";
import { ErrorCode } from "../errors/codes";
import { UiKey } from "./ui-keys";

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
  "UNKNOWN_VARIABLE_DID_YOU_MEAN",
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
  "PARSE_TRAILING_COMMA",
  "PARSE_EMPTY_LIST_ITEM",
  "OUTPUT_EMPTY",
  "DUPLICATE_INPUT_NAME",
  "START_HAS_INBOUND",
  "STOP_HAS_OUTGOING",
  "IMPORT_NOT_AN_OBJECT",
  "IMPORT_UNSUPPORTED_VERSION",
  "IMPORT_BAD_NODES_ARRAY",
  "IMPORT_BAD_EDGES_ARRAY",
  "IMPORT_BAD_NODE",
  "IMPORT_BAD_NODE_ID",
  "IMPORT_UNKNOWN_KIND",
  "IMPORT_BAD_POSITION",
  "IMPORT_BAD_EDGE",
  "IMPORT_BAD_EDGE_IDS",
  "IMPORT_INVALID_JSON",
];

const ALL_UI_KEYS: UiKey[] = [
  "toolbar.run",
  "toolbar.step",
  "toolbar.stepBack",
  "toolbar.reset",
  "toolbar.speed",
  "toolbar.speedSlow",
  "toolbar.speedNormal",
  "toolbar.speedFast",
  "toolbar.speedInstant",
  "toolbar.follow",
  "toolbar.new",
  "toolbar.export",
  "toolbar.import",
  "toolbar.confirmNewTitle",
  "toolbar.confirmNewDescription",
  "toolbar.cancel",
  "toolbar.confirm",
  "palette.title",
  "palette.dragOrClick",
  "palette.alreadyOnCanvas",
  "palette.startDisabledTitle",
  "palette.block.start",
  "palette.block.startDesc",
  "palette.block.stop",
  "palette.block.stopDesc",
  "palette.block.input",
  "palette.block.inputDesc",
  "palette.block.output",
  "palette.block.outputDesc",
  "palette.block.process",
  "palette.block.processDesc",
  "palette.block.decision",
  "palette.block.decisionDesc",
  "palette.block.connector",
  "palette.block.connectorDesc",
  "block.start",
  "block.stop",
  "block.input",
  "block.output",
  "block.process",
  "block.decision",
  "block.connector",
  "block.typeInTerminal",
  "block.inputPlaceholder",
  "block.outputPlaceholder",
  "block.processPlaceholder",
  "block.conditionPlaceholder",
  "tab.terminal",
  "tab.variables",
  "tab.problems",
  "panel.terminal.empty",
  "panel.terminal.emptyDesc",
  "panel.terminal.clear",
  "panel.terminal.olderTruncated",
  "panel.terminal.promptFor",
  "panel.terminal.typeInputPlaceholder",
  "panel.terminal.sys.PROGRAM_FINISHED",
  "panel.terminal.sys.PROGRAM_RESET",
  "panel.terminal.sys.EDIT_DURING_RUN",
  "panel.terminal.sys.OUTPUT_TRUNCATED",
  "panel.variables.empty",
  "panel.variables.emptyDesc",
  "panel.variables.colName",
  "panel.variables.colType",
  "panel.variables.colValue",
  "panel.problems.empty",
  "panel.problems.emptyDesc",
  "toast.imported",
  "toast.importFailed",
  "toast.cleared",
  "toast.exported",
  "toast.inputPaused",
  "canvas.loading",
];

const CATALOGS = {
  en: enCatalog,
  si: siCatalog,
};

describe("i18n Catalogue Parity", () => {
  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    describe(`locale: ${locale}`, () => {
      it("has an entry with message and hint for every ErrorCode", () => {
        const errorKeys = Object.keys(catalog.errors);
        for (const code of ALL_ERROR_CODES) {
          expect(errorKeys).toContain(code);
          const entry = (catalog.errors as Record<string, { message: string; hint: string }>)[code];
          expect(entry).toBeDefined();
          expect(entry.message).toBeTruthy();
          expect(entry.hint).toBeTruthy();
        }
      });

      it("has no orphaned keys in errors", () => {
        const errorKeys = Object.keys(catalog.errors);
        for (const key of errorKeys) {
          expect(ALL_ERROR_CODES).toContain(key as ErrorCode);
        }
      });

      it("has a string entry for every UiKey", () => {
        const uiKeys = Object.keys(catalog.ui);
        for (const key of ALL_UI_KEYS) {
          expect(uiKeys).toContain(key);
          const text = (catalog.ui as Record<string, string>)[key];
          expect(text).toBeTruthy();
        }
      });

      it("has no orphaned keys in ui", () => {
        const uiKeys = Object.keys(catalog.ui);
        for (const key of uiKeys) {
          expect(ALL_UI_KEYS).toContain(key as UiKey);
        }
      });
    });
  }
});
