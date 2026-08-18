import { FlowGraph, FlowNode, FlowEdge, NodeId } from "./types";
import { Program, CompiledNode, CompileResult } from "./program";
import { Diagnostic } from "../errors/diagnostic";
import { Expr } from "../lang/ast";
import { parseExpression, parseProcess, parseIdentifier } from "../lang/parser";

export function compile(graph: FlowGraph): CompileResult {
  const diagnostics: Diagnostic[] = [];

  const addDiag = (diag: Diagnostic) => {
    diagnostics.push(diag);
  };

  const startNodes = graph.nodes.filter((n) => n.kind === "start");
  if (startNodes.length === 0) {
    addDiag({
      code: "NO_START",
      params: { count: 0 },
      severity: "error",
    });
    return { ok: false, diagnostics };
  } else if (startNodes.length > 1) {
    for (const sn of startNodes) {
      addDiag({
        code: "MULTIPLE_START",
        params: { count: startNodes.length },
        severity: "error",
        nodeId: sn.id,
      });
    }
    return { ok: false, diagnostics };
  }

  const startNode = startNodes[0];

  // Map edges by source
  const edgesBySource = new Map<NodeId, FlowEdge[]>();
  for (const edge of graph.edges) {
    const list = edgesBySource.get(edge.source) ?? [];
    list.push(edge);
    edgesBySource.set(edge.source, list);
  }

  // Reachability analysis (BFS from start)
  const reachableSet = new Set<NodeId>();
  const queue: NodeId[] = [startNode.id];
  reachableSet.add(startNode.id);

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const outgoing = edgesBySource.get(currId) ?? [];
    for (const edge of outgoing) {
      if (!reachableSet.has(edge.target)) {
        reachableSet.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  // Emit UNREACHABLE_NODE warning for nodes not reached from start
  for (const node of graph.nodes) {
    if (!reachableSet.has(node.id)) {
      addDiag({
        code: "UNREACHABLE_NODE",
        params: { nodeKind: node.kind },
        severity: "warning",
        nodeId: node.id,
      });
    }
  }

  // Check if any stop node is reachable
  const hasReachableStop = Array.from(reachableSet).some((id) => {
    const node = graph.nodes.find((n) => n.id === id);
    return node?.kind === "stop";
  });

  if (!hasReachableStop) {
    addDiag({
      code: "NO_REACHABLE_STOP",
      params: {},
      severity: "warning",
    });
  }

  // Parse each REACHABLE node's content and validate handle connections
  const parsedData = new Map<
    NodeId,
    | { kind: "start" }
    | { kind: "stop" }
    | { kind: "input"; varName: string }
    | { kind: "output"; expr: Expr }
    | { kind: "process"; target: string; expr: Expr }
    | { kind: "if"; cond: Expr }
  >();

  const outgoingMap = new Map<
    NodeId,
    {
      next?: { targetId: NodeId; edgeId: string };
      whenTrue?: { targetId: NodeId; edgeId: string };
      whenFalse?: { targetId: NodeId; edgeId: string };
    }
  >();

  for (const nodeId of reachableSet) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    // Parse text inside block
    if (node.kind === "start") {
      parsedData.set(node.id, { kind: "start" });
    } else if (node.kind === "stop") {
      parsedData.set(node.id, { kind: "stop" });
    } else if (node.kind === "input") {
      const pRes = parseIdentifier(node.data.varName);
      if (!pRes.ok) {
        addDiag({ ...pRes.error, severity: "error", nodeId: node.id });
      } else {
        parsedData.set(node.id, { kind: "input", varName: pRes.name });
      }
    } else if (node.kind === "output") {
      const pRes = parseExpression(node.data.source);
      if (!pRes.ok) {
        addDiag({ ...pRes.error, severity: "error", nodeId: node.id });
      } else {
        parsedData.set(node.id, { kind: "output", expr: pRes.expr });
      }
    } else if (node.kind === "process") {
      const pRes = parseProcess(node.data.source);
      if (!pRes.ok) {
        addDiag({ ...pRes.error, severity: "error", nodeId: node.id });
      } else {
        parsedData.set(node.id, {
          kind: "process",
          target: pRes.assignment.target,
          expr: pRes.assignment.value,
        });
      }
    } else if (node.kind === "if") {
      const pRes = parseExpression(node.data.source);
      if (!pRes.ok) {
        addDiag({ ...pRes.error, severity: "error", nodeId: node.id });
      } else {
        parsedData.set(node.id, { kind: "if", cond: pRes.expr });
      }
    }

    // Validate handle connections for reachable node
    const outgoing = edgesBySource.get(node.id) ?? [];

    if (node.kind === "stop") {
      continue;
    }

    if (node.kind === "if") {
      const trueEdges = outgoing.filter((e) => e.sourceHandle === "true");
      const falseEdges = outgoing.filter((e) => e.sourceHandle === "false");

      if (trueEdges.length === 0) {
        addDiag({
          code: "UNCONNECTED_BRANCH",
          params: { branch: "true" },
          severity: "error",
          nodeId: node.id,
          handle: "true",
        });
      } else if (trueEdges.length > 1) {
        addDiag({
          code: "MULTIPLE_OUTGOING_EDGES",
          params: { handle: "true" },
          severity: "error",
          nodeId: node.id,
          handle: "true",
        });
      }

      if (falseEdges.length === 0) {
        addDiag({
          code: "UNCONNECTED_BRANCH",
          params: { branch: "false" },
          severity: "error",
          nodeId: node.id,
          handle: "false",
        });
      } else if (falseEdges.length > 1) {
        addDiag({
          code: "MULTIPLE_OUTGOING_EDGES",
          params: { handle: "false" },
          severity: "error",
          nodeId: node.id,
          handle: "false",
        });
      }

      if (trueEdges.length === 1 && falseEdges.length === 1) {
        outgoingMap.set(node.id, {
          whenTrue: {
            targetId: trueEdges[0].target,
            edgeId: trueEdges[0].id,
          },
          whenFalse: {
            targetId: falseEdges[0].target,
            edgeId: falseEdges[0].id,
          },
        });
      }
    } else {
      if (outgoing.length === 0) {
        addDiag({
          code: "DANGLING_OUTPUT",
          params: { nodeKind: node.kind },
          severity: "error",
          nodeId: node.id,
        });
      } else if (outgoing.length > 1) {
        addDiag({
          code: "MULTIPLE_OUTGOING_EDGES",
          params: {},
          severity: "error",
          nodeId: node.id,
        });
      } else {
        outgoingMap.set(node.id, {
          next: { targetId: outgoing[0].target, edgeId: outgoing[0].id },
        });
      }
    }
  }

  // Definite assignment warnings pass
  const assignedByNode = new Map<NodeId, Set<string>>();
  assignedByNode.set(startNode.id, new Set());

  let changed = true;
  let passes = 0;
  const maxPasses = graph.nodes.length + 1;

  while (changed && passes < maxPasses) {
    changed = false;
    passes++;

    for (const nodeId of reachableSet) {
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node) continue;
      const data = parsedData.get(nodeId);

      let inVars: Set<string>;

      if (nodeId === startNode.id) {
        inVars = new Set();
      } else {
        const predSets: Set<string>[] = [];

        for (const predId of reachableSet) {
          const links = outgoingMap.get(predId);
          if (!links) continue;

          const reachesMe =
            links.next?.targetId === nodeId ||
            links.whenTrue?.targetId === nodeId ||
            links.whenFalse?.targetId === nodeId;

          if (reachesMe && assignedByNode.has(predId)) {
            predSets.push(assignedByNode.get(predId)!);
          }
        }

        if (predSets.length === 0) {
          inVars = new Set();
        } else {
          inVars = new Set(predSets[0]);
          for (let i = 1; i < predSets.length; i++) {
            const currentSet = predSets[i];
            for (const v of Array.from(inVars)) {
              if (!currentSet.has(v)) {
                inVars.delete(v);
              }
            }
          }
        }
      }

      const outVars = new Set(inVars);
      if (data?.kind === "input") {
        outVars.add(data.varName);
      } else if (data?.kind === "process") {
        outVars.add(data.target);
      }

      const prevOut = assignedByNode.get(nodeId);
      if (
        !prevOut ||
        prevOut.size !== outVars.size ||
        Array.from(outVars).some((v) => !prevOut.has(v))
      ) {
        assignedByNode.set(nodeId, outVars);
        changed = true;
      }
    }
  }

  const getReferencedVars = (expr: Expr): { name: string; span: [number, number] }[] => {
    const list: { name: string; span: [number, number] }[] = [];
    const visit = (e: Expr) => {
      if (e.kind === "variable") {
        list.push({ name: e.name, span: e.span });
      } else if (e.kind === "unary") {
        visit(e.operand);
      } else if (e.kind === "binary") {
        visit(e.left);
        visit(e.right);
      }
    };
    visit(expr);
    return list;
  };

  for (const nodeId of reachableSet) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) continue;
    const data = parsedData.get(nodeId);
    if (!data) continue;

    const predSets: Set<string>[] = [];
    for (const predId of reachableSet) {
      const links = outgoingMap.get(predId);
      if (!links) continue;
      const reachesMe =
        links.next?.targetId === nodeId ||
        links.whenTrue?.targetId === nodeId ||
        links.whenFalse?.targetId === nodeId;
      if (reachesMe && assignedByNode.has(predId)) {
        predSets.push(assignedByNode.get(predId)!);
      }
    }

    let inVars: Set<string>;
    if (nodeId === startNode.id) {
      inVars = new Set();
    } else if (predSets.length === 0) {
      inVars = new Set();
    } else {
      inVars = new Set(predSets[0]);
      for (let i = 1; i < predSets.length; i++) {
        for (const v of Array.from(inVars)) {
          if (!predSets[i].has(v)) inVars.delete(v);
        }
      }
    }

    const exprsToTest: Expr[] = [];
    if (data.kind === "process" || data.kind === "output") {
      exprsToTest.push(data.expr);
    } else if (data.kind === "if") {
      exprsToTest.push(data.cond);
    }

    for (const expr of exprsToTest) {
      const refs = getReferencedVars(expr);
      for (const ref of refs) {
        if (!inVars.has(ref.name)) {
          addDiag({
            code: "VARIABLE_MAYBE_UNASSIGNED",
            params: { name: ref.name },
            severity: "warning",
            nodeId,
            span: ref.span,
          });
        }
      }
    }
  }

  const hasErrors = diagnostics.some((d) => d.severity === "error");
  if (hasErrors) {
    return { ok: false, diagnostics };
  }

  const compiledNodes: Record<NodeId, CompiledNode> = {};
  const order: NodeId[] = [];

  for (const nodeId of reachableSet) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) continue;
    const links = outgoingMap.get(nodeId);
    const data = parsedData.get(nodeId);
    if (!data) continue;

    order.push(nodeId);

    if (node.kind === "start") {
      compiledNodes[nodeId] = {
        kind: "start",
        id: nodeId,
        next: links!.next!.targetId,
        nextEdgeId: links!.next!.edgeId,
      };
    } else if (node.kind === "stop") {
      compiledNodes[nodeId] = {
        kind: "stop",
        id: nodeId,
      };
    } else if (node.kind === "input") {
      const inputNode = node as FlowNode & { kind: "input" };
      compiledNodes[nodeId] = {
        kind: "input",
        id: nodeId,
        varName: (data as { varName: string }).varName,
        valueType: inputNode.data.valueType,
        next: links!.next!.targetId,
        nextEdgeId: links!.next!.edgeId,
      };
    } else if (node.kind === "output") {
      compiledNodes[nodeId] = {
        kind: "output",
        id: nodeId,
        expr: (data as { expr: Expr }).expr,
        next: links!.next!.targetId,
        nextEdgeId: links!.next!.edgeId,
      };
    } else if (node.kind === "process") {
      compiledNodes[nodeId] = {
        kind: "process",
        id: nodeId,
        target: (data as { target: string }).target,
        expr: (data as { expr: Expr }).expr,
        next: links!.next!.targetId,
        nextEdgeId: links!.next!.edgeId,
      };
    } else if (node.kind === "if") {
      compiledNodes[nodeId] = {
        kind: "if",
        id: nodeId,
        cond: (data as { cond: Expr }).cond,
        whenTrue: links!.whenTrue!.targetId,
        trueEdgeId: links!.whenTrue!.edgeId,
        whenFalse: links!.whenFalse!.targetId,
        falseEdgeId: links!.whenFalse!.edgeId,
      };
    }
  }

  const warnings = diagnostics.filter((d) => d.severity === "warning");

  const program: Program = {
    entryId: startNode.id,
    nodes: compiledNodes,
    order,
    warnings,
  };

  return { ok: true, program };
}
