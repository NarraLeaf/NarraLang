import { ParserIterator } from "../ParserIterator";
import { BlockStatementNode } from "./Statement";
import { NodeType, StatementNode } from "../Node";
import { OperatorType } from "@/core/lexer/Operator";
import { ParserError, ParserErrorType } from "../ParserError";
import { trace } from "../Trace";
import { TokenType } from "@/core/lexer/TokenType";
import { ParseStatementOptions, parseStatement } from "./ParseStatement";

/**
 * Parse block statement ({ ... })
 */
export function parseBlockStatement(iterator: ParserIterator, opts: Required<ParseStatementOptions>): BlockStatementNode {
    const startToken = iterator.getCurrentToken()!;
    if (startToken.type !== TokenType.Operator || startToken.value !== OperatorType.LeftBrace) {
        throw new ParserError(
            ParserErrorType.ExpectedToken,
            "Expected '{'",
            startToken
        );
    }

    const body = parseStatementBlock(iterator, opts);
    
    return {
        type: NodeType.BlockStatement,
        body,
        trace: trace(startToken.start, body[body.length - 1]?.trace.end ?? startToken.end),
    };
}

/**
 * Parse a block of statements enclosed in braces
 */
export function parseStatementBlock(iterator: ParserIterator, opts: Required<ParseStatementOptions>): StatementNode[] {
    // Consume opening brace
    const openBrace = iterator.popToken();
    if (!openBrace || openBrace.type !== TokenType.Operator || openBrace.value !== OperatorType.LeftBrace) {
        throw new ParserError(
            ParserErrorType.ExpectedToken,
            "Expected '{'",
            openBrace
        );
    }

    const statements: StatementNode[] = [];
    
    // Parse statements until closing brace
    while (!iterator.isDone()) {
        iterator.skipNewLine();
        
        const currentToken = iterator.getCurrentToken();
        if (!currentToken) break;
        
        // Check for closing brace
        if (currentToken.type === TokenType.Operator && currentToken.value === OperatorType.RightBrace) {
            iterator.popToken(); // consume closing brace
            break;
        }
        
        // Parse statement
        const statement = parseStatement(iterator, { ...opts, depth: opts.depth + 1 });
        if (statement) {
            statements.push(statement);
        }
    }
    
    return statements;
}
