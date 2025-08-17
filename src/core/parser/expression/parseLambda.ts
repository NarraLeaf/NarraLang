import { OperatorType } from "@/core/lexer/Operator";
import { TokenType } from "@/core/lexer/TokenType";
import { ExpressionNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import { FunctionExpressionNode } from "./Expression";
import { ParseExpressionOptions } from "./shared";
import { parseExpression } from "./ParseExpression";

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
 * Parse lambda parameter with optional default value
 * Supports: name, name = defaultValue, ...restParam
 * Reuses logic from FunctionDeclaration parsing
 */
function parseLambdaParam(iterator: ParserIterator): {
    name: string;
    defaultValue: ExpressionNode | null;
    isRest: boolean;
} {
    let isRest = false;

    iterator.skipNewLine();
    
    // Check for rest parameter (...)
    const restToken = iterator.getCurrentToken();
    if (restToken?.type === TokenType.Operator && restToken.value === OperatorType.Ellipsis) {
        iterator.popToken(); // consume ...
        isRest = true;
    }
    
    // Get parameter name
    const nameToken = iterator.popToken();
    if (!nameToken || nameToken.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.ExpectedIdentifier,
            "Expected parameter name",
            nameToken
        );
    }
    
    const name = nameToken.value;
    let defaultValue: ExpressionNode | null = null;
    
    // Check for default value (only for non-rest parameters)
    if (!isRest) {
        const equalsToken = iterator.getCurrentToken();
        if (equalsToken?.type === TokenType.Operator && equalsToken.value === OperatorType.LogicalEquals) {
            iterator.popToken(); // consume =
            defaultValue = parseExpression(iterator);
            if (!defaultValue) {
                throw new ParserError(
                    ParserErrorType.ExpectedExpression,
                    "Expected default value expression",
                    iterator.getCurrentToken()
                );
            }
        }
    }
    
    return { name, defaultValue, isRest };
}

/**
 * Parse lambda parameter list: (param1, param2 = default, ...rest)
 * Reuses and adapts logic from FunctionDeclaration parsing
 */
function parseLambdaParams(iterator: ParserIterator): {
    params: { name: string; defaultValue: ExpressionNode | null }[];
    rest: string | null;
} {
    const params: { name: string; defaultValue: ExpressionNode | null }[] = [];
    let rest: string | null = null;
    
    // Expect opening parenthesis
    const openParen = iterator.popToken();
    if (!openParen || openParen.type !== TokenType.Operator || openParen.value !== OperatorType.LeftParenthesis) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected '(' in lambda expression",
            openParen
        );
    }
    
    // Parse parameters
    while (true) {
        iterator.skipNewLine();
        
        const token = iterator.getCurrentToken();
        if (!token) {
            throw new ParserError(
                ParserErrorType.UnexpectedToken,
                "Unexpected end of file in lambda parameter list",
                null
            );
        }
        
        // Check for closing parenthesis
        if (token.type === TokenType.Operator && token.value === OperatorType.RightParenthesis) {
            iterator.popToken(); // consume )
            break;
        }
        
        // Parse parameter
        const param = parseLambdaParam(iterator);
        
        if (param.isRest) {
            if (rest !== null) {
                throw new ParserError(
                    ParserErrorType.UnknownError,
                    "Only one rest parameter is allowed",
                    token
                );
            }
            rest = param.name;
        } else {
            params.push({ name: param.name, defaultValue: param.defaultValue });
        }
        
        // Check for comma or end
        const nextToken = iterator.getCurrentToken();
        if (nextToken?.type === TokenType.Operator && nextToken.value === OperatorType.Comma) {
            iterator.popToken(); // consume comma
            continue;
        } else if (nextToken?.type === TokenType.Operator && nextToken.value === OperatorType.RightParenthesis) {
            iterator.popToken(); // consume )
            break;
        } else {
            throw new ParserError(
                ParserErrorType.UnexpectedToken,
                "Expected ',' or ')' in lambda parameter list, got " + (nextToken?.type || "end of file"),
                nextToken
            );
        }
    }
    
    return { params, rest };
}

/**
 * Parse lambda expression: (params) => expr
 * Uses shared parameter parsing logic from function declarations
 */
export function parseLambdaExpression(
    iterator: ParserIterator,
    options: ParseExpressionOptions,
): FunctionExpressionNode {
    const startToken = iterator.getCurrentToken()!; // The '(' token

    // Parse parameters using reusable logic
    const { params, rest } = parseLambdaParams(iterator);

    // Consume the '=>'
    const arrowToken = iterator.popToken();
    if (!arrowToken || arrowToken.type !== TokenType.Operator || arrowToken.value !== OperatorType.Arrow) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected '=>' in lambda expression",
            arrowToken
        );
    }

    // Parse the body expression
    const bodyExpression = parseExpression(iterator, options);
    if (!bodyExpression) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected expression after '=>' in lambda",
            iterator.getCurrentToken()
        );
    }

    return {
        type: NodeType.FunctionExpression,
        trace: { start: startToken.start, end: bodyExpression.trace.end },
        params,
        rest,
        body: [bodyExpression], // Lambda body is a single expression
    };
}
