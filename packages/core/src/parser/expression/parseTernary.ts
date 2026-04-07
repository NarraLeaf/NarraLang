import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { TokenType } from "@/core/lexer/TokenType";
import { OperatorType } from "@/core/lexer/Operator";
import { ParseExpressionOptions } from "./shared";
import { parseExpression } from "./ParseExpression";
import { TernaryExpressionNode } from "./Expression";
import { KeywordType } from "@/core/lexer/Keyword";

// Parse ternary conditional expression: condition ? trueValue : falseValue
export function parseTernaryExpression(
    iterator: ParserIterator,
    left: ExpressionNode,
    options: ParseExpressionOptions,
): ExpressionNode {
    const qm = iterator.popToken()!; // consume '?'
    const nextDepth = (options.depth ?? 0) + 1;
    
    const trueExpr = parseExpression(iterator, { 
        ...options, 
        depth: nextDepth, 
        minBP: 0 
    });
    
    if (!trueExpr) {
        const w = iterator.getCurrentToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after '?'", w ?? qm);
    }
    
    const colon = iterator.getCurrentToken();
    if (!colon || colon.type !== TokenType.Operator || colon.value !== OperatorType.Colon) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected ':' in ternary expression", colon ?? null);
    }
    const colonTok = iterator.popToken()!;
    
    const falseExpr = parseExpression(iterator, { 
        ...options, 
        depth: nextDepth, 
        minBP: 0 
    });
    
    if (!falseExpr) {
        const w = iterator.getCurrentToken();
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after ':'", w ?? colonTok);
    }
    
    const node: TernaryExpressionNode = {
        type: NodeType.TernaryExpression,
        trace: { 
            start: left.trace.start, 
            end: falseExpr.trace?.end ?? colonTok.end 
        },
        condition: left,
        trueValue: trueExpr,
        falseValue: falseExpr,
    };
    
    return node;
}

export function parseIfElseTernaryExpression(
    iterator: ParserIterator,
    trueValue: ExpressionNode,
    options: ParseExpressionOptions,
): ExpressionNode {
    const ifTok = iterator.popToken()!; // consume 'if'
    const condition = parseExpression(iterator, { ...options, depth: 0, minBP: 0 });
    if (!condition) {
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after 'if'", ifTok);
    }

    const elseTok = iterator.popTokenIf((token) => token.type === TokenType.Keyword && token.value === KeywordType.Else);
    if (!elseTok) {
        throw new ParserError(ParserErrorType.UnexpectedToken, "Expected 'else' after 'if'", ifTok);
    }

    const falseValue = parseExpression(iterator, { ...options, depth: 0, minBP: 0 });
    if (!falseValue) {
        throw new ParserError(ParserErrorType.ExpectedExpression, "Expected expression after 'else'", elseTok);
    }

    const node: TernaryExpressionNode = {
        type: NodeType.TernaryExpression,
        trace: {
            start: ifTok.start,
            end: falseValue.trace.end,
        },
        condition,
        trueValue,
        falseValue,
    };

    return node;
}
