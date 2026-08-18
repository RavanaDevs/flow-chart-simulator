export type Value = number | string | boolean;

export type ValueType = "number" | "text" | "yes/no";

export function typeOf(val: Value): ValueType {
  if (typeof val === "number") return "number";
  if (typeof val === "string") return "text";
  if (typeof val === "boolean") return "yes/no";
  return "text";
}

export function formatValue(val: Value): string {
  if (typeof val === "number") {
    // Round to 10 significant digits to avoid float precision weirdness (0.30000000000000004)
    return Number(val.toPrecision(10)).toString();
  }
  if (typeof val === "boolean") {
    return val ? "true" : "false";
  }
  return val;
}
