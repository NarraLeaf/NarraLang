import { OperatorType } from "@/core/lexer/Operator";
import { TokensTypeOf, TokenType } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { IdentifierNode, ObjectExpressionNode } from "./Expression";
import { parsePrimary } from "./parsePrimary";
import { ParseExpressionOptions, consumeOperator, createTrace } from "./shared";

// Parse object pattern for identifier mode: { a, b: c, ...rest }
export function parseObjectPattern(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
): ExpressionNode {
    const lb = iterator.popToken()!; // consume '{'
    const properties: ExpressionNode[] = [];
    const nextDepth = (options.depth ?? 0) + 1;

    if (consumeOperator(iterator, OperatorType.RightBrace)) {
        const node: ObjectExpressionNode = {
            type: NodeType.ObjectExpression,
            trace: { start: lb.start, end: lb.end },
            properties,
        };
        return node;
    }

    while (true) {
        const look = iterator.peekToken();
        if (!look) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Unclosed object pattern", look);
        }

        // Spread property: ...rest
        if (look.type === TokenType.Operator && look.value === OperatorType.Ellipsis) {
            const spread = parsePrimary(iterator, { ...options, depth: nextDepth, identifier: true });
            if (!spread) {
                const w = iterator.peekToken();
                throw new ParserError(ParserErrorType.ExpectedExpression, "Expected pattern after '...' in object", w ?? look);
            }
            properties.push(spread);
        } else {
            // key [: valuePattern]
            let keyNode: IdentifierNode | null = null;
            const keyTok = iterator.peekToken();
            if (keyTok && keyTok.type === TokenType.Identifier) {
                const tok = iterator.popToken()! as TokensTypeOf<TokenType.Identifier>;
                keyNode = {
                    type: NodeType.Identifier,
                    trace: { start: tok.start, end: tok.end },
                    name: tok.value,
                };
            } else if (keyTok && keyTok.type === TokenType.String) {
                const tok = iterator.popToken()!;
                keyNode = {
                    type: NodeType.StringExpression,
                    trace: { start: tok.start, end: tok.end },
                    children: [],
                    value: (tok as any).value,
                } as any;
            } else {
                throw new ParserError(ParserErrorType.UnexpectedToken, "Expected identifier or string as object pattern key", keyTok ?? null);
            }

            // Optional ':' value pattern
            const maybeColon = iterator.peekToken();
            if (maybeColon && maybeColon.type === TokenType.Operator && (maybeColon as any).value === OperatorType.Colon) {
                iterator.popToken();
                const valuePattern = parsePrimary(iterator, { ...options, depth: nextDepth, identifier: true });
                if (!valuePattern) {
                    const w = iterator.peekToken();
                    throw new ParserError(ParserErrorType.ExpectedExpression, "Expected pattern after ':' in object", w ?? maybeColon);
                }
                // Store as a 2-tuple [key, value]
                const pair: ExpressionNode & { elements: ExpressionNode[] } = {
                    type: NodeType.TupleExpression,
                    trace: { start: (keyNode as any).trace.start, end: (valuePattern as any).trace?.end ?? (keyNode as any).trace.end },
                    children: [keyNode, valuePattern],
                    elements: [keyNode, valuePattern],
                } as any;
                properties.push(pair);
            } else {
                // shorthand: {a} -> [Identifier(a), Identifier(a)]
                const pair: ExpressionNode & { elements: ExpressionNode[] } = {
                    type: NodeType.TupleExpression,
                    trace: { start: (keyNode as any).trace.start, end: (keyNode as any).trace.end },
                    children: [keyNode, keyNode],
                    elements: [keyNode, keyNode],
                } as any;
                properties.push(pair);
            }
        }

        const sep = iterator.peekToken();
        if (sep && sep.type === TokenType.Operator && (sep as any).value === OperatorType.Comma) {
            iterator.popToken();
            continue;
        }
        break;
    }

    const rb = iterator.peekToken();
    if (!rb || rb.type !== TokenType.Operator || (rb as any).value !== OperatorType.RightBrace) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected '}' to close object pattern", rb ?? null);
    }
    iterator.popToken();

    const node: ExpressionNode & { properties: ExpressionNode[] } = {
        type: NodeType.ObjectExpression,
        trace: createTrace(lb, rb),
        children: properties,
        properties,
    };
    return node;
}
