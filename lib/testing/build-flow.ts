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

  public input(id: string, varName: string, valueType: InputValueType = "number"): this {
    this.nodes.push({ id, kind: "input", position: { x: 0, y: 0 }, data: { varName, valueType } });
    return this;
  }

  public output(id: string, source: string): this {
    this.nodes.push({ id, kind: "output", position: { x: 0, y: 0 }, data: { source } });
    return this;
  }

  public ifNode(id: string, source: string): this {
    this.nodes.push({ id, kind: "if", position: { x: 0, y: 0 }, data: { source } });
    return this;
  }

  public connect(source: string, target: string, sourceHandle: "true" | "false" | null = null): this {
    this.edges.push({
      id: `e${this.edgeCounter++}`,
      source,
      target,
      sourceHandle,
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
