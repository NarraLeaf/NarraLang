import { OperatorType } from "@/core/lexer/Operator";
import { TokensTypeOf, TokenType } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { IdentifierNode, LiteralNode, StringExpressionNode, FunctionExpressionNode } from "./Expression";
import { parseArrayPattern, parseArrayLiteral } from "./parseArray";
import { parseObjectPattern, parseObjectLiteral } from "./parseObject";
import { parseBrackets, parseTuplePattern } from "./parseTuple";
import { parseRestExpression, parseUnaryLogicalNot, parseUnaryMinus } from "./parseUnary";
import { Atoms, ParseExpressionOptions, resetBP } from "./shared";
import { parseRichString } from "./parseRichString";
import { KeywordType } from "@/core/lexer/Keyword";
import { isLambdaExpression, parseLambdaExpression } from "./parseLambda";

// Parse: primary expression (identifier, literal, string, grouping, unary, rest)
export function parsePrimary(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
): ExpressionNode | null {
    const t = iterator.getCurrentToken();
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

    // Grouping: ( ... ) or lambda: (params) => expr or call start (handled as postfix later)
    if (t.type === TokenType.Operator && t.value === OperatorType.LeftParenthesis) {
        return parsePossibleLambda(iterator, resetBP(options));
    }

    // Rest expression: ...expr
    if (t.type === TokenType.Operator && t.value === OperatorType.Ellipsis) {
        return parseRestExpression(iterator, options);
    }

    // Unary LogicalNot: !expr
    if (t.type === TokenType.Operator && t.value === OperatorType.LogicalNot) {
        return parseUnaryLogicalNot(iterator, options);
    }

    // Unary Minus: -expr
    if (t.type === TokenType.Operator && t.value === OperatorType.Minus) {
        return parseUnaryMinus(iterator, options);
    }

    // Array literal: [1, 2, 3]
    if (t.type === TokenType.Operator && t.value === OperatorType.LeftBracket) {
        return parseArrayLiteral(iterator, resetBP(options));
    }

    // Object literal: {a: 1, b: 2}
    if (t.type === TokenType.Operator && t.value === OperatorType.LeftBrace) {
        return parseObjectLiteral(iterator, resetBP(options));
    }

    // Function expression: function(params) { ... } or lambda: (params) => expr
    if (t.type === TokenType.Keyword && t.value === KeywordType.Function) {
        return parseFunctionExpression(iterator, resetBP(options));
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
            const parsed = parseRichString(tok.value);
            const node: StringExpressionNode = {
                type: NodeType.StringExpression,
                trace: { start: tok.start, end: tok.end },
                value: parsed,
            };
            return node;
        }
        // Number / Boolean / Null as Literal
        const node: LiteralNode = {
            type: NodeType.Literal,
            trace: { start: tok.start, end: tok.end },
            value: (tok.type === TokenType.NumberLiteral
                ? tok.value
                : tok.type === TokenType.BooleanLiteral
                    ? tok.value
                    : null),
        };
        return node;
    }

    return null;
}

/**
 * Parse function expression: function(params) { body }
 * TODO: Implement when statement parsing is ready
 */
function parseFunctionExpression(
    iterator: ParserIterator,
    _options: ParseExpressionOptions,
): FunctionExpressionNode {
    const startToken = iterator.popToken()!; // consume 'function'

    // For now, return a placeholder
    // TODO: Parse parameters and body when ready
    return {
        type: NodeType.FunctionExpression,
        trace: { start: startToken.start, end: startToken.end },
        params: [],
        rest: null,
        body: [], // TODO: parse body statements
    };
}

/**
 * Parse possible lambda expression or grouping: (params) => expr or (expr)
 * Uses lookahead to distinguish between lambda and tuple/grouping
 */
function parsePossibleLambda(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
): ExpressionNode {
    // Note: Could save position for backtracking if needed in future

    // Try to parse as lambda first by checking for '=>' after closing parenthesis
    if (isLambdaExpression(iterator)) {
        return parseLambdaExpression(iterator, options);
    }

    // If not a lambda, parse as tuple/grouping
    const result = parseBrackets(iterator, options);
    if (!result) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected expression in parentheses",
            iterator.getCurrentToken()
        );
    }
    return result;
}
