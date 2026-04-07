import { NodeType } from "../Node";
import { trace } from "../Trace";
import { LiteralNode } from "./Expression";

export function NullExpression(start: number): LiteralNode {
    return {
        type: NodeType.Literal,
        trace: trace(start, start + 4),
        value: null,
    };
}