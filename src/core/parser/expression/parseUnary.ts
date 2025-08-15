import { OperatorBPMap, OperatorType } from "@/core/lexer/Operator";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { parseExpression } from "./parseExpression";
import { ParseExpressionOptions, createTrace } from "./shared";

// Parse unary LogicalNot: !expr
export function parseUnaryLogicalNot(
    iterator: ParserIterator,
    options: ParseExpressionOptions
): ExpressionNode {
    const opTok = iterator.popToken()!; // consume '!'
    const nextDepth = (options.depth ?? 0) + 1;
    
    const rhs = parseExpression(iterator, { 
        ...options, 
        depth: nextDepth, 
        minBP: OperatorBPMap[OperatorType.LogicalNot] 
    });
    
    if (!rhs) {
        const w = iterator.peekToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after '!'", w ?? opTok);
    }
    
    const node: ExpressionNode & { condition: ExpressionNode } = {
        // NOTE: current project defines UnaryExpressionNode shape unusual; keep minimal field
        type: NodeType.UnaryExpression,
        trace: createTrace(opTok, (rhs as any).trace ? { start: (rhs as any).trace.start, end: (rhs as any).trace.end } as any : opTok),
        condition: rhs,
    };
    return node;
}

// Parse rest expression: ...expr
export function parseRestExpression(
    iterator: ParserIterator,
    options: ParseExpressionOptions
): ExpressionNode {
    const el = iterator.popToken()!; // consume '...'
    const nextDepth = (options.depth ?? 0) + 1;
    
    const value = parseExpression(iterator, { 
        ...options, 
        depth: nextDepth, 
        minBP: 90  // bind tightly by default
    });
    
    if (!value) {
        const w = iterator.peekToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after '...'", w ?? el);
    }
    
    const node: ExpressionNode & { value: ExpressionNode } = {
        type: NodeType.RestExpression,
        trace: createTrace(el, (value as any).trace ? { start: (value as any).trace.start, end: (value as any).trace.end } as any : el),
        value,
    };
    return node;
}
