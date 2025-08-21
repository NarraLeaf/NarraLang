import { ParserIterator } from "../ParserIterator";
import { StatementNode, NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { parseExpression } from "../expression/ParseExpression";
import { TokenType } from "@/core/lexer/TokenType";
import { ExpressionStatementNode, SugarCallStatementNode } from "./Statement";
import { ParseStatementOptions } from "./ParseStatement";
import { IdentifierNode } from "../expression/Expression";
import { ExpressionNode } from "../Node";

/**
 * Parse sugar syntax or expression statement
 * 
 * This function distinguishes between:
 * 1. Sugar syntax statements: identifier followed by arguments (e.g., "image 'photo.png'")
 * 2. Expression statements: standalone expressions (e.g., function calls, assignments)
 */
export function parseSugarOrExpressionStatement(iterator: ParserIterator, _opts: Required<ParseStatementOptions>): StatementNode {
    // Try to parse as expression first
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

    // Check if this could be sugar syntax:
    // Sugar syntax pattern: identifier followed by arguments
    // Examples: "image 'photo.png'", "character name", "scene background"
    if (isSugarSyntax(expr)) {
        return createSugarCallStatement(expr);
    }

    // Otherwise, treat as expression statement
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
 * Check if an expression represents sugar syntax
 * Sugar syntax is typically: identifier + arguments pattern
 * Examples: "image 'file.png'", "character name", "scene location"
 */
function isSugarSyntax(expr: ExpressionNode): expr is IdentifierNode {
    // For now, we consider simple identifiers as potential sugar syntax
    // This is a heuristic that can be refined based on the DSL requirements
    
    // Simple identifier at the start could be sugar syntax
    if (expr.type === NodeType.Identifier) {
        return true;
    }
    
    // Function calls are typically not sugar syntax
    if (expr.type === NodeType.CallExpression) {
        return false;
    }
    
    // Member expressions are typically not sugar syntax
    if (expr.type === NodeType.MemberExpression) {
        return false;
    }
    
    // Binary expressions are typically not sugar syntax
    if (expr.type === NodeType.BinaryExpression) {
        return false;
    }
    
    // Default to expression statement for other types
    return false;
}

/**
 * Create a sugar call statement from an expression
 */
function createSugarCallStatement(expr: ExpressionNode): SugarCallStatementNode {
    // Extract the command name from the identifier
    let name = "unknown";
    if (expr.type === NodeType.Identifier) {
        const identifierNode = expr as IdentifierNode;
        name = identifierNode.name;
    }
    
    return {
        type: NodeType.SugarCallStatement,
        name,
        args: [], // Arguments would be parsed separately in a more complete implementation
        modifiers: {},
        trace: expr.trace,
    };
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
