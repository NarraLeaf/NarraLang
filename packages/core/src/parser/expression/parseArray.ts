import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions, consumeOperator, createTrace, resetBP } from "./shared";
import { parsePrimary } from "./parsePrimary";
import { parseExpression } from "./ParseExpression";
import { ArrayExpressionNode } from "./Expression";
import { trace } from "../Trace";

// Parse array literal: [expr1, expr2, ...exprN]
export function parseArrayLiteral(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
): ExpressionNode {
    const lb = iterator.popToken()!; // consume '['
    const elements: ExpressionNode[] = [];
    const nextDepth = (options.depth ?? 0) + 1;

    if (consumeOperator(iterator, OperatorType.RightBracket)) {
        const node: ArrayExpressionNode = {
            type: NodeType.ArrayExpression,
            trace: trace(lb.start, lb.end),
            elements,
        };
        return node;
    }

    let exit = false;
    while (!exit) {
        iterator.skipNewLine();
        
        const look = iterator.getCurrentToken();
        if (!look) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Unclosed array literal", look);
        }

        // Parse expression element
        const elem = parseExpression(iterator, resetBP({ ...options, depth: nextDepth }));
        if (!elem) {
            const w = iterator.getCurrentToken();
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression inside array", w ?? lb);
        }
        elements.push(elem);

        iterator.skipNewLine();

        const sep = iterator.getCurrentToken();
        if (sep && sep.type === TokenType.Operator && sep.value === OperatorType.Comma) {
            iterator.popToken();
            continue;
        }

        exit = true;
        break;
    }

    const rb = iterator.getCurrentToken();
    if (!rb || rb.type !== TokenType.Operator || rb.value !== OperatorType.RightBracket) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ']' to close array literal", rb ?? null);
    }
    iterator.popToken();

    const node: ArrayExpressionNode = {
        type: NodeType.ArrayExpression,
        trace: createTrace(lb, rb),
        elements,
    };
    return node;
}

// Parse array pattern for identifier mode: [p1, p2, ...rest]
export function parseArrayPattern(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
): ExpressionNode {
    const lb = iterator.popToken()!; // consume '['
    const elements: ExpressionNode[] = [];
    const nextDepth = (options.depth ?? 0) + 1;

    if (consumeOperator(iterator, OperatorType.RightBracket)) {
        const node: ArrayExpressionNode = {
            type: NodeType.ArrayExpression,
            trace: { start: lb.start, end: lb.end },
            elements,
        };
        return node;
    }

    while (true) {
        // Support rest element or normal pattern
        const look = iterator.getCurrentToken();
        if (!look) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Unclosed array pattern", look);
        }

        let elem: ExpressionNode | null = null;
        if (look.type === TokenType.Operator && look.value === OperatorType.Ellipsis) {
            // reuse existing rest parsing (it will parse pattern on the right)
            elem = parsePrimary(iterator, { ...options, depth: nextDepth, identifier: true });
        } else {
            elem = parsePrimary(iterator, { ...options, depth: nextDepth, identifier: true });
        }

        if (!elem) {
            const w = iterator.getCurrentToken();
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected pattern inside array", w ?? lb);
        }
        elements.push(elem);

        const sep = iterator.getCurrentToken();
        if (sep && sep.type === TokenType.Operator && sep.value === OperatorType.Comma) {
            iterator.popToken();
            continue;
        }
        break;
    }

    const rb = iterator.getCurrentToken();
    if (!rb || rb.type !== TokenType.Operator || rb.value !== OperatorType.RightBracket) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ']' to close array pattern", rb ?? null);
    }
    iterator.popToken();

    const node: ArrayExpressionNode = {
        type: NodeType.ArrayExpression,
        trace: createTrace(lb, rb),
        elements,
    };
    return node;
}
