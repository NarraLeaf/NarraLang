import { KeywordType } from "@/core/lexer/Keyword";
import { OperatorType } from "@/core/lexer/Operator";
import { TokensTypeOf, TokenType } from "@/core/lexer/TokenType";
import { NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { parseFunctionParams } from "../shared/parseParams";
import { parseBlockStatement } from "../statement";
import { trace } from "../Trace";
import { FunctionExpressionNode } from "./Expression";
import { ParseExpressionOptions } from "./shared";
import { ParserFunctionContext } from "../ctx/Contexts";

/**
 * Parse function expression: function(params) { body } or anonymous function: function() { body }
 * Supports both named and anonymous function expressions
 */
export function parseFunctionExpression(
    iterator: ParserIterator,
    _options: ParseExpressionOptions,
): FunctionExpressionNode {
    const startToken = iterator.popToken()!; // consume 'function'
    if (startToken.type !== TokenType.Keyword || startToken.value !== KeywordType.Function) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected 'function' keyword",
            startToken
        );
    }

    // Check if next token is '(' (anonymous function) or identifier (named function expression)
    const nextToken = iterator.getCurrentToken();
    if (!nextToken) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Unexpected end of file after 'function'",
            null
        );
    }

    let name: string | null = null;

    // Named function expression: function name(params) { body }
    if (nextToken.type === TokenType.Identifier) {
        const nameToken = iterator.popToken()! as TokensTypeOf<TokenType.Identifier>;
        name = nameToken.value;
    }
    // Anonymous function expression: function(params) { body }
    else if (nextToken.type === TokenType.Operator && nextToken.value === OperatorType.LeftParenthesis) {
        // name remains null for anonymous function
    } else {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected function name or parameter list after 'function'",
            nextToken
        );
    }

    // Parse parameters using shared logic
    const { params, rest } = parseFunctionParams(iterator);

    // Parse function body
    const currentToken = iterator.getCurrentToken();
    if (!currentToken) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Unexpected end of file in function expression",
            null
        );
    }

    // Function expression body should be a block statement
    if (currentToken.type !== TokenType.Operator || currentToken.value !== OperatorType.LeftBrace) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected '{' for function body",
            currentToken
        );
    }

    const body = iterator.getContext().context(new ParserFunctionContext(), () => {
        return parseBlockStatement(iterator, {
            allowDialogue: false,
            depth: 0,
            maxDepth: 100,
        });
    });

    const result: FunctionExpressionNode = {
        type: NodeType.FunctionExpression,
        trace: trace(startToken.start, body.trace.end),
        params,
        rest,
        name,
        body,
    };

    return result;
}
