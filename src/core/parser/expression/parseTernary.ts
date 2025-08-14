import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions } from "./shared";

// Parse ternary conditional expression: condition ? trueValue : falseValue
export function parseTernaryExpression(
    iterator: ParserIterator,
    left: ExpressionNode,
    options: ParseExpressionOptions,
    parseExpression: (iterator: ParserIterator, options?: ParseExpressionOptions) => ExpressionNode | null
): ExpressionNode {
    const qm = iterator.popToken()!; // consume '?'
    const nextDepth = (options.depth ?? 0) + 1;
    
    const trueExpr = parseExpression(iterator, { 
        ...options, 
        depth: nextDepth, 
        minBP: 0 
    });
    
    if (!trueExpr) {
        const w = iterator.peekToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after '?'", w ?? qm);
    }
    
    const colon = iterator.peekToken();
    if (!colon || colon.type !== TokenType.Operator || (colon as any).value !== OperatorType.Colon) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ':' in ternary expression", colon ?? null);
    }
    const colonTok = iterator.popToken()!;
    
    const falseExpr = parseExpression(iterator, { 
        ...options, 
        depth: nextDepth, 
        minBP: 0 
    });
    
    if (!falseExpr) {
        const w = iterator.peekToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after ':'", w ?? colonTok);
    }
    
    const node: ExpressionNode & { 
        condition: ExpressionNode; 
        trueValue: ExpressionNode; 
        falseValue: ExpressionNode; 
    } = {
        type: NodeType.TernaryExpression,
        trace: { 
            start: (left as any).trace.start, 
            end: (falseExpr as any).trace?.end ?? colonTok.end 
        },
        children: [left, trueExpr, falseExpr],
        condition: left,
        trueValue: trueExpr,
        falseValue: falseExpr,
    };
    
    return node;
}
