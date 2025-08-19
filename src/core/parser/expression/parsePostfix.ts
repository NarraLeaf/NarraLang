import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { TokensTypeOf, TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions, matchesStopOn, createTrace, resetBP } from "./shared";
import { parseArgumentList } from "./parseArguments";
import { CallExpressionNode, IdentifierNode, MemberExpressionNode } from "./Expression";
import { parseExpression } from "./ParseExpression";

// Parse: postfix chain - member access and function call
export function parsePostfix(
    iterator: ParserIterator, 
    left: ExpressionNode, 
    options: ParseExpressionOptions,
): ExpressionNode {
    let parsed: MemberExpressionNode | CallExpressionNode | null = null;

    while (true) {
        const t = iterator.getCurrentToken();
        if (!t) break;
        if (matchesStopOn(t, options.stopOn)) break;

        // Member access: .identifier
        if (t.type === TokenType.Operator && t.value === OperatorType.Dot) {
            const dot = iterator.popToken()!;
            const prop = iterator.getCurrentToken();
            if (!prop || prop.type !== TokenType.Identifier) {
                throw new ParserError(ParserErrorType.ExpectedIdentifier, "Expected identifier after '.'", prop ?? dot);
            }
            const propTok = iterator.popToken()! as TokensTypeOf<TokenType.Identifier>;
            const property: IdentifierNode = {
                type: NodeType.Identifier,
                trace: { start: propTok.start, end: propTok.end },
                name: propTok.value,
            };

            parsed = {
                type: NodeType.MemberExpression,
                trace: { start: left.trace.start, end: propTok.end },
                target: left,
                property,
                computed: false,
            } satisfies MemberExpressionNode;
            continue;
        }

        // Computed member access: [expression]
        if (t.type === TokenType.Operator && t.value === OperatorType.LeftBracket) {
            const lb = iterator.popToken()!;
            const property = parseExpression(iterator, resetBP({
                ...options,
                stopOn: [
                    { type: TokenType.Operator, value: OperatorType.RightBracket },
                ],
                depth: (options.depth ?? 0) + 1,
            }));
            if (!property) {
                throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression in computed member access", iterator.getCurrentToken() ?? lb);
            }
            
            const rb = iterator.getCurrentToken();
            if (!rb || rb.type !== TokenType.Operator || rb.value !== OperatorType.RightBracket) {
                throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ']' after computed member access", rb ?? null);
            }
            const rbTok = iterator.popToken()!;

            parsed = {
                type: NodeType.MemberExpression,
                trace: { start: left.trace.start, end: rbTok.end },
                target: left,
                property,
                computed: true,
            } satisfies MemberExpressionNode;
            continue;
        }

        // Call: ( ...args )
        if (t.type === TokenType.Operator && t.value === OperatorType.LeftParenthesis) {
            const lp = iterator.popToken()!;
            const { args, last } = parseArgumentList(iterator, { ...options });
            const endTok = last ?? lp;
            
            parsed = {
                type: NodeType.CallExpression,
                trace: createTrace(lp, endTok),
                callee: left,
                args,
            } satisfies CallExpressionNode;
            continue;
        }

        break;
    }

    return parsed ?? left;
}
