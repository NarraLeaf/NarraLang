import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions, Atoms } from "./shared";
import { parseTupleOrGroup, parseTuplePattern } from "./parseTuple";
import { parseArrayPattern } from "./parseArray";
import { parseObjectPattern } from "./parseObject";
import { parseUnaryLogicalNot, parseRestExpression } from "./parseUnary";

// Parse: primary expression (identifier, literal, string, grouping, unary, rest)
export function parsePrimary(
    iterator: ParserIterator, 
    options: ParseExpressionOptions,
    parseExpression: (iterator: ParserIterator, options?: ParseExpressionOptions) => ExpressionNode | null
): ExpressionNode | null {
    const t = iterator.peekToken();
    if (!t) return null;

    // Identifier-only mode (pattern placeholder).
    if (options.identifier === true) {
        // Tuple pattern: (p1, p2, ...)
        if (t.type === TokenType.Operator && (t as any).value === OperatorType.LeftParenthesis) {
            return parseTuplePattern(iterator, options, parsePrimary);
        }

        // Array pattern: [p1, p2, ...rest]
        if (t.type === TokenType.Operator && (t as any).value === OperatorType.LeftBracket) {
            return parseArrayPattern(iterator, options, parsePrimary);
        }

        // Object pattern: { a, b: c, ...rest }
        if (t.type === TokenType.Operator && (t as any).value === OperatorType.LeftBrace) {
            return parseObjectPattern(iterator, options, parsePrimary);
        }

        // Fallback: single identifier pattern
        if (t.type === TokenType.Identifier) {
            const tok = iterator.popToken()!;
            const node: ExpressionNode & { name: string } = {
                type: NodeType.Identifier,
                trace: { start: tok.start, end: tok.end },
                children: [],
                name: (tok as any).value as string,
            };
            return node;
        }

        throw new ParserError(ParserErrorType.ExpectedIdentifier, "Expected pattern (identifier/tuple/array/object)", t);
    }

    // Grouping: ( ... ) or call start (handled as postfix later)
    if (t.type === TokenType.Operator && (t as any).value === OperatorType.LeftParenthesis) {
        return parseTupleOrGroup(iterator, options, parseExpression);
    }

    // Rest expression: ...expr
    if (t.type === TokenType.Operator && (t as any).value === OperatorType.Ellipsis) {
        return parseRestExpression(iterator, options, parseExpression);
    }

    // Unary LogicalNot: !expr
    if (t.type === TokenType.Operator && (t as any).value === OperatorType.LogicalNot) {
        return parseUnaryLogicalNot(iterator, options, parseExpression);
    }

    // Simple atoms: identifier and literals
    if (Atoms.includes(t.type)) {
        const tok = iterator.popToken()!;
        if (tok.type === TokenType.Identifier) {
            const node: ExpressionNode & { name: string } = {
                type: NodeType.Identifier,
                trace: { start: tok.start, end: tok.end },
                children: [],
                name: (tok as any).value as string,
            };
            return node;
        }
        if (tok.type === TokenType.String) {
            const node: ExpressionNode & { value: unknown } = {
                type: NodeType.StringExpression,
                trace: { start: tok.start, end: tok.end },
                children: [],
                value: (tok as any).value,
            };
            return node;
        }
        // Number / Boolean / Null as Literal
        const node: ExpressionNode & { value: number | boolean | null } = {
            type: NodeType.Literal,
            trace: { start: tok.start, end: tok.end },
            children: [],
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
