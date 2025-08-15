import { KeywordType } from "@/core/lexer/Keyword";
import { OperatorBPMap, OperatorType } from "@/core/lexer/Operator";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { BinaryOperator, isBinaryOperator, isUnaryPrefixOnlyOperator } from "./BinaryExpression";
import { BinaryExpressionNode } from "./Expression";
import { parsePostfix } from "./parsePostfix";
import { parsePrimary } from "./parsePrimary";
import { parseIfElseTernaryExpression, parseTernaryExpression } from "./parseTernary";
import {
    isRightAssociative,
    matchesStopOn,
    MAX_DEPTH,
    ParseExpressionOptions,
    peekKeywordType,
    peekOperatorType,
    StopTokenMatcher
} from "./shared";

export type { ParseExpressionOptions, StopTokenMatcher };

export function parseExpression(iterator: ParserIterator, options?: ParseExpressionOptions): ExpressionNode | null {
    const depth = options?.depth ?? 0;
    if (depth > MAX_DEPTH) {
        throw new ParserError(
            ParserErrorType.UnknownError,
            "Expression too deep",
        );
    }

    // Normalize options for this level
    const minBP = options?.minBP ?? 0;
    const nextDepth = depth + 1;
    const stopOn = options?.stopOn;

    // 1) Parse primary
    let left = parsePrimary(iterator, { ...options, depth: nextDepth });
    if (!left) {
        const t = iterator.peekToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression", t ?? null);
    }

    // 2) Parse postfix chain (member access / calls)
    left = parsePostfix(iterator, left, { ...options, depth: nextDepth });

    // 3) Pratt loop for infix and ternary
    while (true) {
        const look = iterator.peekToken();
        if (!look) break;
        if (matchesStopOn(look, stopOn)) break;

        if (!left) {
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression", look ?? null);
        }

        // Get operator type and binding power
        const op = peekOperatorType(iterator);
        if (op === null) {
            const kw = peekKeywordType(iterator);
            if (kw === null) break;

            // Handle if-else ternary: a if b else c
            if (kw === KeywordType.If) {
                left = parseIfElseTernaryExpression(iterator, left, { ...options, depth: nextDepth });
                continue;
            }
            break;
        }

        const bp = OperatorBPMap[op as number] ?? 0;
        if (bp < minBP) break;

        // Handle ternary: condition ? a : b
        if (op === OperatorType.QuestionMark) {
            left = parseTernaryExpression(iterator, left, { ...options, depth: nextDepth });
            continue;
        }

        // Special handling for unary prefix-only operators used incorrectly as infix
        if (isUnaryPrefixOnlyOperator(op)) {
            const operatorStr = op === OperatorType.Ellipsis ? "..." :
                op === OperatorType.LogicalNot ? "!" :
                    "operator";
            throw new ParserError(
                ParserErrorType.UnknownError,
                `Unary prefix operator '${operatorStr}' cannot be used as infix operator. Use it as prefix: '${operatorStr}expr'`,
                look
            );
        }

        // Handle binary operators
        if (!isBinaryOperator(op)) break;

        // consume the operator
        const opTok = iterator.popToken()!;
        const rightMinBP = isRightAssociative(op) ? bp : bp + 1;
        const right = parseExpression(iterator, { ...options, depth: nextDepth, minBP: rightMinBP });
        if (!right) {
            const w = iterator.peekToken();
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected right-hand expression", w ?? opTok);
        }

        left = {
            type: NodeType.BinaryExpression,
            trace: { start: left.trace.start, end: right.trace.end },
            operator: op as BinaryOperator,
            left,
            right,
        } as BinaryExpressionNode;
    }

    return left;
}
