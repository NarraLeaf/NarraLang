import { ParserIterator } from "../ParserIterator";
import { IfStatementNode } from "./Statement";
import { NodeType } from "../Node";
import { OperatorType } from "@/core/lexer/Operator";
import { ParserError, ParserErrorType } from "../ParserError";
import { parseExpression } from "../expression/ParseExpression";
import { trace } from "../Trace";
import { TokenType } from "@/core/lexer/TokenType";
import { ParseStatementOptions } from "./ParseStatement";
import { parseStatementBlock } from "./BlockStatement";

/**
 * Parse if statement with optional else if and else clauses
 * 
 * Note: Currently implements basic if statement. 
 * Full if-else if-else chains should be handled by compound statements in higher-level parsers.
 */
export function parseIfStatement(iterator: ParserIterator, opts: Required<ParseStatementOptions>): IfStatementNode {
    const startToken = iterator.popToken()!; // consume 'if'
    
    // Parse condition
    const condition = parseExpression(iterator, {
        stopOn: [{ type: TokenType.Operator, value: OperatorType.LeftBrace }]
    });
    if (!condition) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected condition after 'if'",
            iterator.getCurrentToken()
        );
    }

    // Parse body block
    const body = parseStatementBlock(iterator, opts);
    
    return {
        type: NodeType.IfStatement,
        condition,
        body,
        trace: trace(startToken.start, body[body.length - 1]?.trace.end ?? condition.trace.end),
    };
}
