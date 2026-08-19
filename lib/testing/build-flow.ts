import { FlowGraph, FlowNode, FlowEdge, InputValueType } from "../graph/types";

export class FlowBuilder {
  private nodes: FlowNode[] = [];
  private edges: FlowEdge[] = [];
  private edgeCounter = 1;

  public start(id = "start"): this {
    this.nodes.push({ id, kind: "start", position: { x: 0, y: 0 }, data: {} });
    return this;
  }

  public stop(id = "stop"): this {
    this.nodes.push({ id, kind: "stop", position: { x: 0, y: 0 }, data: {} });
    return this;
  }

  public process(id: string, source: string): this {
    this.nodes.push({ id, kind: "process", position: { x: 0, y: 0 }, data: { source } });
    return this;
  }

  /** `names` may be a comma-separated list, e.g. "age, score". */
  public input(id: string, names: string, valueType: InputValueType = "number"): this {
    this.nodes.push({ id, kind: "input", position: { x: 0, y: 0 }, data: { names, valueType } });
    return this;
  }

  public output(id: string, source: string): this {
    this.nodes.push({ id, kind: "output", position: { x: 0, y: 0 }, data: { source } });
    return this;
  }

  public connector(id: string): this {
    this.nodes.push({ id, kind: "connector", position: { x: 0, y: 0 }, data: {} });
    return this;
  }

  public ifNode(id: string, source: string): this {
    this.nodes.push({ id, kind: "if", position: { x: 0, y: 0 }, data: { source } });
    return this;
  }

  /**
   * `branch` is the shorthand fixtures use; it is translated to the physical
   * port a student would have dragged from.
   */
  public connect(
    source: string,
    target: string,
    branch: "true" | "false" | null = null,
    targetHandle: string = "port-top"
  ): this {
    const sourceHandle =
      branch === "true"
        ? "true-bottom"
        : branch === "false"
          ? "false-right"
          : "port-bottom";

    this.edges.push({
      id: `e${this.edgeCounter++}`,
      source,
      target,
      sourceHandle,
      targetHandle,
    });
    return this;
  }

  public build(): FlowGraph {
    return {
      nodes: this.nodes,
      edges: this.edges,
    };
  }
}

export function flow(): FlowBuilder {
  return new FlowBuilder();
}
