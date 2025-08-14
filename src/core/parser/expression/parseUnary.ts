import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { TokenType } from "@/core/lexer/TokenType";
import { OperatorType, OperatorBPMap } from "@/core/lexer/Operator";
import { ParseExpressionOptions, createTrace } from "./shared";

// Parse unary LogicalNot: !expr
export function parseUnaryLogicalNot(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
    parseExpression: (iterator: ParserIterator, options?: ParseExpressionOptions) => ExpressionNode | null
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
        children: [rhs],
        condition: rhs,
    };
    return node;
}

// Parse rest expression: ...expr
export function parseRestExpression(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
    parseExpression: (iterator: ParserIterator, options?: ParseExpressionOptions) => ExpressionNode | null
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
        children: [value],
        value,
    };
    return node;
}
