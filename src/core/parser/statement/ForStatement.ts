import { ParserIterator } from "../ParserIterator";
import { ForEachStatementNode, ForRangeStatementNode } from "./Statement";
import { NodeType } from "../Node";
import { OperatorType } from "@/core/lexer/Operator";
import { ParserError, ParserErrorType } from "../ParserError";
import { parseExpression } from "../expression/ParseExpression";
import { trace } from "../Trace";
import { TokenType } from "@/core/lexer/TokenType";
import { KeywordType } from "@/core/lexer/Keyword";
import { ParserContextType } from "../ctx/ParserContextType";
import { ParseStatementOptions } from "./ParseStatement";
import { parseStatementBlock } from "./BlockStatement";

/**
 * Parse for statement - dispatches to for each or for range
 */
export function parseForStatement(iterator: ParserIterator, opts: Required<ParseStatementOptions>): ForEachStatementNode | ForRangeStatementNode {
    // Look ahead to determine if this is "for each" or "for...from...to"
    const lookAhead = iterator.peekToken(1);
    if (lookAhead && lookAhead.type === TokenType.Keyword && lookAhead.value === KeywordType.ForEach) {
        return parseForEachStatement(iterator, opts);
    } else {
        return parseForRangeStatement(iterator, opts);
    }
}

/**
 * Parse for each statement (for each item in array { ... })
 */
export function parseForEachStatement(iterator: ParserIterator, opts: Required<ParseStatementOptions>): ForEachStatementNode {
    // Validate context - for each can only be used in functions
    if (!iterator.getContext().has(ParserContextType.Function)) {
        throw new ParserError(
            ParserErrorType.InvalidContext,
            "for each loops can only be used in functions",
            iterator.getCurrentToken()
        );
    }

    const startToken = iterator.popToken()!; // consume 'for'
    
    // Consume 'each'
    const eachToken = iterator.popToken();
    if (!eachToken || eachToken.type !== TokenType.Keyword || eachToken.value !== KeywordType.ForEach) {
        throw new ParserError(
            ParserErrorType.ExpectedKeyword,
            "Expected 'each' after 'for'",
            eachToken
        );
    }

    // Parse item variable name
    const itemToken = iterator.popToken();
    if (!itemToken || itemToken.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.ExpectedIdentifier,
            "Expected variable name after 'for each'",
            itemToken
        );
    }

    // Consume 'in'
    const inToken = iterator.popToken();
    if (!inToken || inToken.type !== TokenType.Keyword || inToken.value !== KeywordType.In) {
        throw new ParserError(
            ParserErrorType.ExpectedKeyword,
            "Expected 'in' after variable name",
            inToken
        );
    }

    // Parse target expression
    const target = parseExpression(iterator, {
        stopOn: [{ type: TokenType.Operator, value: OperatorType.LeftBrace }]
    });
    if (!target) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected iterable expression after 'in'",
            iterator.getCurrentToken()
        );
    }

    // Parse body block
    const body = parseStatementBlock(iterator, opts);
    
    return {
        type: NodeType.ForEachStatement,
        itemName: itemToken.value,
        target,
        body,
        trace: trace(startToken.start, body[body.length - 1]?.trace.end ?? target.trace.end),
    };
}

/**
 * Parse for range statement (for i from start to end { ... })
 */
export function parseForRangeStatement(iterator: ParserIterator, opts: Required<ParseStatementOptions>): ForRangeStatementNode {
    // Validate context - for range can only be used in functions
    if (!iterator.getContext().has(ParserContextType.Function)) {
        throw new ParserError(
            ParserErrorType.InvalidContext,
            "for range loops can only be used in functions",
            iterator.getCurrentToken()
        );
    }

    const startToken = iterator.popToken()!; // consume 'for'
    
    // Parse index variable name
    const indexToken = iterator.popToken();
    if (!indexToken || indexToken.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.ExpectedIdentifier,
            "Expected variable name after 'for'",
            indexToken
        );
    }

    // Consume 'from'
    const fromToken = iterator.popToken();
    if (!fromToken || fromToken.type !== TokenType.Keyword || fromToken.value !== KeywordType.From) {
        throw new ParserError(
            ParserErrorType.ExpectedKeyword,
            "Expected 'from' after variable name",
            fromToken
        );
    }

    // Parse start expression
    const start = parseExpression(iterator, {
        stopOn: [{ type: TokenType.Keyword, value: KeywordType.To }]
    });
    if (!start) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected start expression after 'from'",
            iterator.getCurrentToken()
        );
    }

    // Consume 'to'
    const toToken = iterator.popToken();
    if (!toToken || toToken.type !== TokenType.Keyword || toToken.value !== KeywordType.To) {
        throw new ParserError(
            ParserErrorType.ExpectedKeyword,
            "Expected 'to' after start expression",
            toToken
        );
    }

    // Parse end expression
    const end = parseExpression(iterator, {
        stopOn: [{ type: TokenType.Operator, value: OperatorType.LeftBrace }]
    });
    if (!end) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected end expression after 'to'",
            iterator.getCurrentToken()
        );
    }

    // Parse body block
    const body = parseStatementBlock(iterator, opts);
    
    return {
        type: NodeType.ForRangeStatement,
        indexName: indexToken.value,
        start,
        end,
        body,
        trace: trace(startToken.start, body[body.length - 1]?.trace.end ?? end.trace.end),
    };
}
