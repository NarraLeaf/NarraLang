import { ExpressionNode } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import type { Tokens } from "@/core/lexer/TokenType";
import { TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions } from "./shared";

// Parse: argument list inside parentheses. Returns list of expressions and last consumed token
export function parseArgumentList(
    iterator: ParserIterator, 
    options: ParseExpressionOptions,
    parseExpression: (iterator: ParserIterator, options?: ParseExpressionOptions) => ExpressionNode | null
): { args: ExpressionNode[]; last: Tokens | null } {
    const args: ExpressionNode[] = [];
    let last: Tokens | null = null;

    // Empty argument list: immediately ")"
    const maybeRight = iterator.peekToken();
    if (maybeRight && maybeRight.type === TokenType.Operator && (maybeRight as any).value === OperatorType.RightParenthesis) {
        last = iterator.popToken();
        return { args, last };
    }

    while (true) {
        const expr = parseExpression(iterator, {
            ...options,
            // Stop on comma or right parenthesis for each argument
            stopOn: [
                { type: TokenType.Operator, value: OperatorType.Comma },
                { type: TokenType.Operator, value: OperatorType.RightParenthesis },
            ],
        });
        if (!expr) {
            const t = iterator.peekToken();
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected argument expression", t ?? null);
        }
        args.push(expr);

        const sep = iterator.peekToken();
        if (sep && sep.type === TokenType.Operator && (sep as any).value === OperatorType.Comma) {
            last = iterator.popToken();
            continue; // next argument
        }

        const end = iterator.peekToken();
        if (end && end.type === TokenType.Operator && (end as any).value === OperatorType.RightParenthesis) {
            last = iterator.popToken();
            break;
        }

        // Neither comma nor right parenthesis
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ',' or ')' after argument", end ?? null);
    }

    return { args, last };
}
