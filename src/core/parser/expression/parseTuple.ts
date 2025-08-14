import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions, consumeOperator, createTrace } from "./shared";

// Parse tuple expression or grouped expression: (a, b, c) or (single_expr)
export function parseTupleOrGroup(
    iterator: ParserIterator, 
    options: ParseExpressionOptions,
    parseExpression: (iterator: ParserIterator, options?: ParseExpressionOptions) => ExpressionNode | null
): ExpressionNode | null {
    const depth = options.depth ?? 0;
    const nextDepth = depth + 1;
    
    const lp = iterator.popToken()!; // consume '('

    // Lookahead for immediate right parenthesis, treat as empty tuple ()
    if (consumeOperator(iterator, OperatorType.RightParenthesis)) {
        const node: ExpressionNode & { elements: ExpressionNode[] } = {
            type: NodeType.TupleExpression,
            trace: { start: lp.start, end: lp.end },
            children: [],
            elements: [],
        };
        return node;
    }

    // Parse inner expression; allow tuple via commas
    const firstExpr = parseExpression(iterator, { ...options, depth: nextDepth });
    if (!firstExpr) {
        const w = iterator.peekToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after '('", w ?? lp);
    }

    // If next token is comma, parse as tuple
    const items: ExpressionNode[] = [firstExpr];
    while (true) {
        const comma = iterator.peekToken();
        if (comma && comma.type === TokenType.Operator && (comma as any).value === OperatorType.Comma) {
            iterator.popToken();
            const nextItem = parseExpression(iterator, { ...options, depth: nextDepth });
            if (!nextItem) {
                const w = iterator.peekToken();
                throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after ','", w ?? comma);
            }
            items.push(nextItem);
            continue;
        }
        break;
    }

    const rp = iterator.peekToken();
    if (!rp || rp.type !== TokenType.Operator || (rp as any).value !== OperatorType.RightParenthesis) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ')' to close group/tuple", rp ?? null);
    }
    iterator.popToken();

    if (items.length === 1) {
        // Grouping returns inner expression directly
        return { ...items[0] };
    }

    const node: ExpressionNode & { elements: ExpressionNode[] } = {
        type: NodeType.TupleExpression,
        trace: createTrace(lp, rp),
        children: [],
        elements: items,
    };
    return node;
}

// Parse tuple pattern for identifier mode: (p1, p2, ...)
export function parseTuplePattern(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
    parsePrimary: (iterator: ParserIterator, options: ParseExpressionOptions) => ExpressionNode | null
): ExpressionNode {
    const lp = iterator.popToken()!; // consume '('
    const elements: ExpressionNode[] = [];
    const nextDepth = (options.depth ?? 0) + 1;

    // empty tuple pattern: ()
    if (consumeOperator(iterator, OperatorType.RightParenthesis)) {
        const node: ExpressionNode & { elements: ExpressionNode[] } = {
            type: NodeType.TupleExpression,
            trace: { start: lp.start, end: lp.end },
            children: [],
            elements,
        };
        return node;
    }

    while (true) {
        const part = parsePrimary(iterator, { ...options, depth: nextDepth, identifier: true });
        if (!part) {
            const w = iterator.peekToken();
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected pattern inside tuple", w ?? lp);
        }
        elements.push(part);

        const sep = iterator.peekToken();
        if (sep && sep.type === TokenType.Operator && (sep as any).value === OperatorType.Comma) {
            iterator.popToken();
            continue;
        }
        break;
    }

    const rp = iterator.peekToken();
    if (!rp || rp.type !== TokenType.Operator || (rp as any).value !== OperatorType.RightParenthesis) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ')' to close tuple pattern", rp ?? null);
    }
    iterator.popToken();

    const node: ExpressionNode & { elements: ExpressionNode[] } = {
        type: NodeType.TupleExpression,
        trace: createTrace(lp, rp),
        children: elements,
        elements,
    };
    return node;
}
