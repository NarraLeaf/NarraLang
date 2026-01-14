import { ParserIterator } from "../ParserIterator";
import { StatementNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { parseExpression } from "../expression/ParseExpression";
import { TokenType } from "@/core/lexer/TokenType";
import { ExpressionStatementNode } from "./Statement";
import { ParseStatementOptions } from "./ParseStatement";
import { IdentifierNode } from "../expression/Expression";
import { ExpressionNode } from "../Node";
import { couldBeSugarCall, parseSugarCallStatement } from "./SugarCallStatement";

/**
 * Parse sugar syntax or expression statement
 * 
 * This function distinguishes between:
 * 1. Sugar syntax statements: identifier followed by arguments/modifiers (e.g., "image John 'photo.png' pos (5,10)")
 * 2. Expression statements: standalone expressions (e.g., function calls, assignments)
 * 
 * Sugar syntax detection:
 * - Must start with an identifier (the sugar name)
 * - Must be followed by expressions (arguments) or modifiers
 * - Cannot be a function call (no immediate parentheses)
 * - Cannot be a member access (no immediate dot)
 */
export function parseSugarOrExpressionStatement(iterator: ParserIterator, _opts: Required<ParseStatementOptions>): StatementNode {
    // Save position to potentially rewind for sugar parsing
    const startPos = iterator.save();
    const startToken = iterator.getCurrentToken();
    
    if (!startToken) {
        throw new ParserError(
            ParserErrorType.ExpectedStatement,
            "Expected statement",
            null
        );
    }
    
    // Check if this could be sugar syntax (starts with identifier)
    if (startToken.type === TokenType.Identifier) {
        const sugarName = startToken.value;
        const startTrace = startToken.start;
        
        // Consume the identifier
        iterator.popToken();
        
        // Check if followed by arguments/modifiers (sugar syntax)
        if (couldBeSugarCall(iterator, { 
            type: NodeType.Identifier, 
            name: sugarName,
            trace: { start: startTrace, end: startToken.end }
        } as IdentifierNode)) {
            // Parse as sugar call
            return parseSugarCallStatement(iterator, sugarName, startTrace);
        }
        
        // Not sugar syntax, restore and parse as expression
        iterator.restore(startPos);
    }
    
    // Parse as regular expression statement
    const expr = parseExpression(iterator, {
        stopOn: [{ type: TokenType.NewLine }]
    });
    
    if (!expr) {
        throw new ParserError(
            ParserErrorType.ExpectedStatement,
            "Expected statement",
            iterator.getCurrentToken()
        );
    }

    return createExpressionStatement(expr);
}

/**
 * Parse a standalone expression statement
 * Used for expressions that should be evaluated as statements
 */
export function parseExpressionStatement(iterator: ParserIterator): ExpressionStatementNode {
    const expr = parseExpression(iterator, {
        stopOn: [{ type: TokenType.NewLine }]
    });
    
    if (!expr) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected expression",
            iterator.getCurrentToken()
        );
    }

    return createExpressionStatement(expr);
}

/**
 * Create an expression statement from an expression
 */
function createExpressionStatement(expr: ExpressionNode): ExpressionStatementNode {
    return {
        type: NodeType.ExpressionStatement,
        expression: expr,
        trace: expr.trace,
    };
}
