import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { TokensTypeOf, TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions, matchesStopOn, createTrace } from "./shared";
import { parseArgumentList } from "./parseArguments";
import { CallExpressionNode, IdentifierNode, MemberExpressionNode } from "./Expression";

// Parse: postfix chain - member access and function call
export function parsePostfix(
    iterator: ParserIterator, 
    left: ExpressionNode, 
    options: ParseExpressionOptions,
): ExpressionNode {
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

            left = {
                type: NodeType.MemberExpression,
                trace: { start: left.trace.start, end: propTok.end },
                target: left,
                property,
            } as MemberExpressionNode;
            continue;
        }

        // Call: ( ...args )
        if (t.type === TokenType.Operator && t.value === OperatorType.LeftParenthesis) {
            const lp = iterator.popToken()!;
            const { args, last } = parseArgumentList(iterator, { ...options });
            const endTok = last ?? lp;
            
            left = {
                type: NodeType.CallExpression,
                trace: createTrace(lp, endTok),
                callee: left,
                args,
            } as CallExpressionNode;
            continue;
        }

        break;
    }

    return left;
}
