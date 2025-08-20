import { OperatorType } from "@/core/lexer/Operator";
import { TokensTypeOf, TokenType } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { CallExpressionNode, IdentifierNode, MemberExpressionNode } from "./Expression";
import { parseArgumentList } from "./parseArguments";
import { parseExpression } from "./ParseExpression";
import { createTrace, matchesStopOn, ParseExpressionOptions, resetBP } from "./shared";

// Parse: postfix chain - member access and function call
export function parsePostfix(
    iterator: ParserIterator, 
    left: ExpressionNode, 
    options: ParseExpressionOptions,
): ExpressionNode {
    let parsed: ExpressionNode | null = left;

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

            const newNode: MemberExpressionNode = {
                type: NodeType.MemberExpression,
                trace: createTrace(dot, propTok),
                target: parsed,
                property,
                computed: false,
            };
            parsed = newNode;
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

            const newNode: MemberExpressionNode = {
                type: NodeType.MemberExpression,
                trace: createTrace(lb, rbTok),
                target: parsed,
                property,
                computed: true,
            };
            parsed = newNode;
            continue;
        }

        // Call: ( ...args )
        if (t.type === TokenType.Operator && t.value === OperatorType.LeftParenthesis) {
            const lp = iterator.popToken()!;
            const { args, last } = parseArgumentList(iterator, { ...options });
            const endTok = last ?? lp;
            
            const newNode: CallExpressionNode = {
                type: NodeType.CallExpression,
                trace: createTrace(lp, endTok),
                callee: parsed,
                args,
            };
            parsed = newNode;
            continue;
        }

        break;
    }

    return parsed ?? left;
}
