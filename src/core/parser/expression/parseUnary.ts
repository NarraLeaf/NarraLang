import { OperatorBPMap, OperatorType } from "@/core/lexer/Operator";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { parseExpression } from "./ParseExpression";
import { ParseExpressionOptions, createTrace } from "./shared";
import { RestExpressionNode, UnaryExpressionNode } from "./Expression";

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
    
    const node: UnaryExpressionNode = {
        type: NodeType.UnaryExpression,
        trace: createTrace(opTok, rhs.trace.end),
        condition: rhs,
    };
    return node;
}

// Parse unary minus: -expr
export function parseUnaryMinus(
    iterator: ParserIterator,
    options: ParseExpressionOptions
): ExpressionNode {
    const opTok = iterator.popToken()!; // consume '-'
    const nextDepth = (options.depth ?? 0) + 1;
    
    const rhs = parseExpression(iterator, { 
        ...options, 
        depth: nextDepth, 
        minBP: 90  // High precedence for unary minus
    });
    
    if (!rhs) {
        const w = iterator.peekToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after unary '-'", w ?? opTok);
    }
    
    const node: UnaryExpressionNode = {
        type: NodeType.UnaryExpression,
        trace: createTrace(opTok, rhs.trace.end),
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
    
    const node: RestExpressionNode = {
        type: NodeType.RestExpression,
        trace: createTrace(el, value.trace.end),
        value,
    };
    return node;
}
