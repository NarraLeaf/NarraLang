import { ExpressionNode } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import type { Tokens } from "@/core/lexer/TokenType";
import { TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions, resetBP } from "./shared";
import { parseExpression } from "./ParseExpression";

// Parse: argument list inside parentheses. Returns list of expressions and last consumed token
export function parseArgumentList(
    iterator: ParserIterator, 
    options: ParseExpressionOptions,
): { args: ExpressionNode[]; last: Tokens | null } {
    const args: ExpressionNode[] = [];
    let last: Tokens | null = null;

    // Empty argument list: immediately ")"
    const maybeRight = iterator.getCurrentToken();
    if (maybeRight && maybeRight.type === TokenType.Operator && maybeRight.value === OperatorType.RightParenthesis) {
        last = iterator.popToken();
        return { args, last };
    }

    while (true) {
        const expr = parseExpression(iterator, resetBP({
            ...options,
            // Stop on comma or right parenthesis for each argument
            stopOn: [
                { type: TokenType.Operator, value: OperatorType.Comma },
                { type: TokenType.Operator, value: OperatorType.RightParenthesis },
            ],
        }));
        if (!expr) {
            const t = iterator.getCurrentToken();
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected argument expression", t ?? null);
        }
        args.push(expr);

        const sep = iterator.getCurrentToken();
        if (sep && sep.type === TokenType.Operator && sep.value === OperatorType.Comma) {
            last = iterator.popToken();
            continue; // next argument
        }

        const end = iterator.getCurrentToken();
        if (end && end.type === TokenType.Operator && end.value === OperatorType.RightParenthesis) {
            last = iterator.popToken();
            break;
        }

        // Neither comma nor right parenthesis
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ',' or ')' after argument", end ?? null);
    }

    return { args, last };
}
