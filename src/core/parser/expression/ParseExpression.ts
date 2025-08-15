import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { OperatorBPMap, OperatorType } from "@/core/lexer/Operator";
import { isBinaryOperator } from "./BinaryExpression";
import { 
    ParseExpressionOptions, 
    StopTokenMatcher, 
    matchesStopOn, 
    peekOperatorType, 
    isRightAssociative,
    MAX_DEPTH 
} from "./shared";
import { parsePrimary } from "./parsePrimary";
import { parsePostfix } from "./parsePostfix";
import { parseTernaryExpression } from "./parseTernary";
import { TokenType } from "@/core/lexer/TokenType";

export type { StopTokenMatcher, ParseExpressionOptions };

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
    left = parsePostfix(iterator, left, { ...options, depth: nextDepth }, parseExpression);

    // 3) Pratt loop for infix and ternary
    while (true) {
        const look = iterator.peekToken();
        if (!look) break;
        if (matchesStopOn(look, stopOn)) break;

        // Ternary: condition ? a : b
        if (look.type === TokenType.Operator && (look as any).value === OperatorType.QuestionMark) {
            left = parseTernaryExpression(iterator, left, { ...options, depth: nextDepth }, parseExpression);
            continue;
        }

        // Binary operators
        const op = peekOperatorType(iterator);
        if (op === null || !isBinaryOperator(op)) break;

        const bp = OperatorBPMap[op as number] ?? 0;
        if (bp < minBP) break;

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
            trace: { start: (left as any).trace.start, end: (right as any).trace?.end ?? opTok.end },
            children: [left, right],
            operator: op,
            left,
            right,
        } as any;
    }

    return left;
}
