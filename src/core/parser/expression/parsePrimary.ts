import { OperatorType } from "@/core/lexer/Operator";
import { TokensTypeOf, TokenType } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { IdentifierNode, LiteralNode, StringExpressionNode } from "./Expression";
import { parseArrayPattern } from "./parseArray";
import { parseObjectPattern } from "./parseObject";
import { parseTupleOrGroup, parseTuplePattern } from "./parseTuple";
import { parseRestExpression, parseUnaryLogicalNot } from "./parseUnary";
import { Atoms, ParseExpressionOptions } from "./shared";

// Parse: primary expression (identifier, literal, string, grouping, unary, rest)
export function parsePrimary(
    iterator: ParserIterator, 
    options: ParseExpressionOptions,
): ExpressionNode | null {
    const t = iterator.peekToken();
    if (!t) return null;

    // Identifier-only mode (pattern placeholder).
    if (options.identifier === true) {
        // Tuple pattern: (p1, p2, ...)
        if (t.type === TokenType.Operator && t.value === OperatorType.LeftParenthesis) {
            return parseTuplePattern(iterator, options);
        }

        // Array pattern: [p1, p2, ...rest]
        if (t.type === TokenType.Operator && t.value === OperatorType.LeftBracket) {
            return parseArrayPattern(iterator, options);
        }

        // Object pattern: { a, b: c, ...rest }
        if (t.type === TokenType.Operator && t.value === OperatorType.LeftBrace) {
            return parseObjectPattern(iterator, options);
        }

        // Fallback: single identifier pattern
        if (t.type === TokenType.Identifier) {
            const tok = iterator.popToken()! as TokensTypeOf<TokenType.Identifier>;
            const node: IdentifierNode = {
                type: NodeType.Identifier,
                trace: { start: tok.start, end: tok.end },
                name: tok.value,
            };
            return node;
        }

        throw new ParserError(ParserErrorType.ExpectedIdentifier, "Expected pattern (identifier/tuple/array/object)", t);
    }

    // Grouping: ( ... ) or call start (handled as postfix later)
    if (t.type === TokenType.Operator && t.value === OperatorType.LeftParenthesis) {
        return parseTupleOrGroup(iterator, options);
    }

    // Rest expression: ...expr
    if (t.type === TokenType.Operator && t.value === OperatorType.Ellipsis) {
        return parseRestExpression(iterator, options);
    }

    // Unary LogicalNot: !expr
    if (t.type === TokenType.Operator && t.value === OperatorType.LogicalNot) {
        return parseUnaryLogicalNot(iterator, options);
    }

    // Simple atoms: identifier and literals
    if (Atoms.includes(t.type)) {
        const tok = iterator.popToken()!;
        if (tok.type === TokenType.Identifier) {
            const node: IdentifierNode = {
                type: NodeType.Identifier,
                trace: { start: tok.start, end: tok.end },
                name: tok.value,
            };
            return node;
        }
        if (tok.type === TokenType.String) {
            const node: StringExpressionNode = {
                type: NodeType.StringExpression,
                trace: { start: tok.start, end: tok.end },
                value: tok.value,
            };
            return node;
        }
        // Number / Boolean / Null as Literal
        const node: LiteralNode = {
            type: NodeType.Literal,
            trace: { start: tok.start, end: tok.end },
            value: (tok.type === TokenType.NumberLiteral
                ? ((tok as any).value as number)
                : tok.type === TokenType.BooleanLiteral
                ? ((tok as any).value as boolean)
                : null),
        };
        return node;
    }

    return null;
}
