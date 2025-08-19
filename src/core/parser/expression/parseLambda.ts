import { OperatorType } from "@/core/lexer/Operator";
import { TokenType } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { FunctionExpressionNode } from "./Expression";
import { ParseExpressionOptions } from "./shared";
import { parseExpression } from "./ParseExpression";
import { BlockStatementNode, parseBlockStatement } from "../statement";
import { trace } from "../Trace";
import { parseFunctionParams } from "../shared/parseParams";
import { ParserFunctionContext } from "../ctx/Contexts";

/**
 * Check if the upcoming tokens form a lambda expression pattern
 * Looks for: ( ... ) =>
 */
export function isLambdaExpression(iterator: ParserIterator): boolean {
    let offset = 1; // Start after the current '(' token
    let parenCount = 1; // We've already seen the opening '('

    // Find the matching closing parenthesis
    while (true) {
        const token = iterator.peekToken(offset);
        if (!token) return false; // Reached end of input

        if (token.type === TokenType.Operator) {
            if (token.value === OperatorType.LeftParenthesis) {
                parenCount++;
            } else if (token.value === OperatorType.RightParenthesis) {
                parenCount--;
                if (parenCount === 0) {
                    // Found the matching closing parenthesis
                    // Check if the next token is '=>'
                    const nextToken = iterator.peekToken(offset + 1);
                    const isArrow = nextToken?.type === TokenType.Operator &&
                        nextToken.value === OperatorType.Arrow;

                    return isArrow;
                }
            }
        }
        offset++;

        // Safety check to prevent infinite loop
        if (offset > 100) {
            return false;
        }
    }
}



/**
 * Parse lambda expression: (params) => expr
 * Uses shared parameter parsing logic from function declarations
 */
export function parseLambdaExpression(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
    multipleParams: boolean,
): FunctionExpressionNode {
    const startToken = iterator.getCurrentToken()!; // The '(' token

    // Parse parameters using shared logic
    const { params, rest } = multipleParams ? parseFunctionParams(iterator) : parseSingleParam(iterator);

    // Consume the '=>'
    const arrowToken = iterator.popToken();
    if (!arrowToken || arrowToken.type !== TokenType.Operator || arrowToken.value !== OperatorType.Arrow) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected '=>' in lambda expression",
            arrowToken
        );
    }

    const currentToken = iterator.getCurrentToken();
    if (!currentToken) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Unexpected end of file in lambda expression",
            null
        );
    }

    const body: ExpressionNode | BlockStatementNode | null = currentToken.type === TokenType.Operator && currentToken.value === OperatorType.LeftBrace
        ? iterator.getContext().context(new ParserFunctionContext(), () => {
            return parseBlockStatement(iterator, {
                allowDialogue: false,
                depth: 0,
                maxDepth: 100,
            });
        })
        : parseExpression(iterator, options);
    if (!body) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Unexpected end of file in lambda expression",
            null
        );
    }

    return {
        type: NodeType.FunctionExpression,
        trace: trace(startToken.start, body.trace.end),
        params,
        rest,
        name: null,
        body,
    };
}

function parseSingleParam(iterator: ParserIterator): ReturnType<typeof parseFunctionParams> {
    const current = iterator.popToken();
    if (!current) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Unexpected end of file in lambda expression",
            null
        );
    }

    if (current.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected identifier in lambda expression",
            current
        );
    }

    return {
        params: [{ name: current.value, defaultValue: null }],
        rest: null,
    };
}
