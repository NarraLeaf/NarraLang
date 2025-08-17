import { OperatorType } from "@/core/lexer/Operator";
import { TokensTypeOf, TokenType } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { createParserIterator, ParserIterator } from "../ParserIterator";
import { IdentifierNode, ObjectExpressionNode, StringExpressionNode, TupleExpressionNode } from "./Expression";
import { parsePrimary } from "./parsePrimary";
import { ParseExpressionOptions, consumeOperator, createTrace, resetBP } from "./shared";
import { parseRichString } from "./parseRichString";
import { parseExpression } from "./ParseExpression";

// Parse object literal: { key: expr, key2: expr2 }
export function parseObjectLiteral(
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
        const look = iterator.getCurrentToken();
        if (!look) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Unclosed object literal", look);
        }

        if (look.type === TokenType.NewLine) {
            iterator.popToken();
            continue;
        }

        // key: expr
        let keyNode: IdentifierNode | StringExpressionNode | null = null;
        const keyTok = iterator.getCurrentToken();
        if (keyTok && keyTok.type === TokenType.Identifier) {
            const tok = iterator.popToken()! as TokensTypeOf<TokenType.Identifier>;
            keyNode = {
                type: NodeType.Identifier,
                trace: { start: tok.start, end: tok.end },
                name: tok.value,
            };
        } else if (keyTok && keyTok.type === TokenType.String) {
            const tok = iterator.popToken()! as TokensTypeOf<TokenType.String>;
            const parsed = parseRichString(tok.value);
            keyNode = {
                type: NodeType.StringExpression,
                trace: { start: tok.start, end: tok.end },
                value: parsed,
            };
        } else if (keyTok && keyTok.type === TokenType.Dialogue) {
            const tok = iterator.popToken()! as TokensTypeOf<TokenType.Dialogue>;
            const nameIterator = createParserIterator(tok.value.character);
            const name = parseExpression(nameIterator, resetBP({ ...options, depth: nextDepth }));
            if (!name) {
                throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after dialogue in object literal", tok);
            }

            const stringValue = parseRichString(tok.value.content);
            keyNode = {
                type: NodeType.StringExpression,
                trace: { start: tok.start, end: tok.end },
                value: stringValue,
            };
        } else {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Expected identifier or string as object literal key", keyTok ?? null);
        }

        // Required ':' for object literal
        const maybeColon = iterator.getCurrentToken();
        if (!maybeColon || maybeColon.type !== TokenType.Operator || maybeColon.value !== OperatorType.Colon) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ':' after object literal key", maybeColon ?? null);
        }
        iterator.popToken();

        const valueExpr = parseExpression(iterator, resetBP({ ...options, depth: nextDepth }));
        if (!valueExpr) {
            const w = iterator.getCurrentToken();
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after ':' in object literal", w ?? maybeColon);
        }

        // Store as a 2-tuple [key, value]
        const pair: TupleExpressionNode = {
            type: NodeType.TupleExpression,
            trace: { start: keyNode.trace.start, end: valueExpr.trace.end },
            elements: [keyNode, valueExpr],
        };
        properties.push(pair);

        iterator.skipNewLine();

        const sep = iterator.getCurrentToken();
        if (sep && sep.type === TokenType.Operator && sep.value === OperatorType.Comma) {
            iterator.popToken(); // consume ','
            continue;
        }
        break;
    }

    const rb = iterator.getCurrentToken();
    if (!rb || rb.type !== TokenType.Operator || rb.value !== OperatorType.RightBrace) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected '}' to close object literal", rb ?? null);
    }
    iterator.popToken();

    const node: ObjectExpressionNode = {
        type: NodeType.ObjectExpression,
        trace: createTrace(lb, rb),
        properties,
    };
    return node;
}

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
        const look = iterator.getCurrentToken();
        if (!look) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Unclosed object pattern", look);
        }

        // Spread property: ...rest
        if (look.type === TokenType.Operator && look.value === OperatorType.Ellipsis) {
            const spread = parsePrimary(iterator, { ...options, depth: nextDepth, identifier: true });
            if (!spread) {
                const w = iterator.getCurrentToken();
                throw new ParserError(ParserErrorType.ExpectedExpression, "Expected pattern after '...' in object", w ?? look);
            }
            properties.push(spread);
        } else {
            // key [: valuePattern]
            let keyNode: IdentifierNode | StringExpressionNode | null = null;
            const keyTok = iterator.getCurrentToken();
            if (keyTok && keyTok.type === TokenType.Identifier) {
                const tok = iterator.popToken()! as TokensTypeOf<TokenType.Identifier>;
                keyNode = {
                    type: NodeType.Identifier,
                    trace: { start: tok.start, end: tok.end },
                    name: tok.value,
                };
            } else if (keyTok && keyTok.type === TokenType.String) {
                const tok = iterator.popToken()! as TokensTypeOf<TokenType.String>;
                const parsed = parseRichString(tok.value);
                keyNode = {
                    type: NodeType.StringExpression,
                    trace: { start: tok.start, end: tok.end },
                    value: parsed,
                };
            } else {
                throw new ParserError(ParserErrorType.UnexpectedToken, "Expected identifier or string as object pattern key", keyTok ?? null);
            }

            // Optional ':' value pattern
            const maybeColon = iterator.getCurrentToken();
            if (maybeColon && maybeColon.type === TokenType.Operator && maybeColon.value === OperatorType.Colon) {
                iterator.popToken();
                const valuePattern = parsePrimary(iterator, { ...options, depth: nextDepth, identifier: true });
                if (!valuePattern) {
                    const w = iterator.getCurrentToken();
                    throw new ParserError(ParserErrorType.ExpectedExpression, "Expected pattern after ':' in object", w ?? maybeColon);
                }
                // Store as a 2-tuple [key, value]
                const pair: TupleExpressionNode = {
                    type: NodeType.TupleExpression,
                    trace: { start: keyNode.trace.start, end: valuePattern.trace.end },
                    elements: [keyNode, valuePattern],
                };
                properties.push(pair);
            } else {
                // shorthand: {a} -> [Identifier(a), Identifier(a)]
                const pair: TupleExpressionNode = {
                    type: NodeType.TupleExpression,
                    trace: { start: keyNode.trace.start, end: keyNode.trace.end },
                    elements: [keyNode, keyNode],
                };
                properties.push(pair);
            }
        }

        const sep = iterator.getCurrentToken();
        if (sep && sep.type === TokenType.Operator && sep.value === OperatorType.Comma) {
            iterator.popToken();
            continue;
        }
        break;
    }

    const rb = iterator.getCurrentToken();
    if (!rb || rb.type !== TokenType.Operator || rb.value !== OperatorType.RightBrace) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected '}' to close object pattern", rb ?? null);
    }
    iterator.popToken();

    const node: ObjectExpressionNode = {
        type: NodeType.ObjectExpression,
        trace: createTrace(lb, rb),
        properties,
    };
    return node;
}
