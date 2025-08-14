import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions, matchesStopOn, createTrace } from "./shared";
import { parseArgumentList } from "./parseArguments";

// Parse: postfix chain - member access and function call
export function parsePostfix(
    iterator: ParserIterator, 
    left: ExpressionNode, 
    options: ParseExpressionOptions,
    parseExpression: (iterator: ParserIterator, options?: ParseExpressionOptions) => ExpressionNode | null
): ExpressionNode {
    while (true) {
        const t = iterator.peekToken();
        if (!t) break;
        if (matchesStopOn(t, options.stopOn)) break;

        // Member access: .identifier
        if (t.type === TokenType.Operator && (t as any).value === OperatorType.Dot) {
            const dot = iterator.popToken()!;
            const prop = iterator.peekToken();
            if (!prop || prop.type !== TokenType.Identifier) {
                throw new ParserError(ParserErrorType.ExpectedIdentifier, "Expected identifier after '.'", prop ?? dot);
            }
            const propTok = iterator.popToken()!;
            const property: ExpressionNode & { name: string } = {
                type: NodeType.Identifier,
                trace: { start: propTok.start, end: propTok.end },
                children: [],
                name: (propTok as any).value as string,
            };
            left = {
                type: NodeType.MemberExpression,
                trace: { start: (left as any).trace.start, end: propTok.end },
                children: [left, property],
                target: left,
                property,
            } as any;
            continue;
        }

        // Call: ( ...args )
        if (t.type === TokenType.Operator && (t as any).value === OperatorType.LeftParenthesis) {
            const lp = iterator.popToken()!;
            const { args, last } = parseArgumentList(iterator, { ...options }, parseExpression);
            const endTok = last ?? lp;
            left = {
                type: NodeType.CallExpression,
                trace: createTrace(lp, endTok),
                children: [left, ...args],
                callee: left,
                args,
            } as any;
            continue;
        }

        break;
    }
    return left;
}
