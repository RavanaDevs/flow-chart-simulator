import { flow } from "./build-flow";
import { FlowGraph } from "../graph/types";

export const FIXTURES: Record<string, FlowGraph> = {
  hello: flow()
    .start("1")
    .output("2", `"Hello"`)
    .stop("3")
    .connect("1", "2")
    .connect("2", "3")
    .build(),

  sum1To10: flow()
    .start("1")
    .process("2", "sum = 0")
    .process("3", "i = 1")
    .ifNode("4", "i <= 10")
    .process("5", "sum = sum + i")
    .process("6", "i = i + 1")
    .output("7", "sum")
    .stop("8")
    .connect("1", "2")
    .connect("2", "3")
    .connect("3", "4")
    .connect("4", "5", "true")
    .connect("5", "6")
    .connect("6", "4")
    .connect("4", "7", "false")
    .connect("7", "8")
    .build(),

  countdown: flow()
    .start("1")
    .input("2", "n", "number")
    .ifNode("3", "n > 0")
    .output("4", "n")
    .process("5", "n = n - 1")
    .stop("6")
    .connect("1", "2")
    .connect("2", "3")
    .connect("3", "4", "true")
    .connect("4", "5")
    .connect("5", "3")
    .connect("3", "6", "false")
    .build(),

  divideByZero: flow()
    .start("1")
    .input("2", "n", "number")
    .process("3", "x = 10 / n")
    .stop("4")
    .connect("1", "2")
    .connect("2", "3")
    .connect("3", "4")
    .build(),

  infiniteLoop: flow()
    .start("1")
    .process("2", "x = 1")
    .ifNode("3", "true")
    .stop("4")
    .connect("1", "2")
    .connect("2", "3")
    .connect("3", "2", "true")
    .connect("3", "4", "false")
    .build(),
};
