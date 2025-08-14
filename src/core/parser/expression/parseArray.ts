import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions, consumeOperator, createTrace } from "./shared";

// Parse array pattern for identifier mode: [p1, p2, ...rest]
export function parseArrayPattern(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
    parsePrimary: (iterator: ParserIterator, options: ParseExpressionOptions) => ExpressionNode | null
): ExpressionNode {
    const lb = iterator.popToken()!; // consume '['
    const elements: ExpressionNode[] = [];
    const nextDepth = (options.depth ?? 0) + 1;

    if (consumeOperator(iterator, OperatorType.RightBracket)) {
        const node: ExpressionNode & { elements: ExpressionNode[] } = {
            type: NodeType.ArrayExpression,
            trace: { start: lb.start, end: lb.end },
            children: [],
            elements,
        };
        return node;
    }

    while (true) {
        // Support rest element or normal pattern
        const look = iterator.peekToken();
        if (!look) {
            throw new ParserError(ParserErrorType.UnexpectedToken, "Unclosed array pattern", look);
        }

        let elem: ExpressionNode | null = null;
        if (look.type === TokenType.Operator && (look as any).value === OperatorType.Ellipsis) {
            // reuse existing rest parsing (it will parse pattern on the right)
            elem = parsePrimary(iterator, { ...options, depth: nextDepth, identifier: true });
        } else {
            elem = parsePrimary(iterator, { ...options, depth: nextDepth, identifier: true });
        }

        if (!elem) {
            const w = iterator.peekToken();
            throw new ParserError(ParserErrorType.ExpectedExpression, "Expected pattern inside array", w ?? lb);
        }
        elements.push(elem);

        const sep = iterator.peekToken();
        if (sep && sep.type === TokenType.Operator && (sep as any).value === OperatorType.Comma) {
            iterator.popToken();
            continue;
        }
        break;
    }

    const rb = iterator.peekToken();
    if (!rb || rb.type !== TokenType.Operator || (rb as any).value !== OperatorType.RightBracket) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ']' to close array pattern", rb ?? null);
    }
    iterator.popToken();

    const node: ExpressionNode & { elements: ExpressionNode[] } = {
        type: NodeType.ArrayExpression,
        trace: createTrace(lb, rb),
        children: elements,
        elements,
    };
    return node;
}
