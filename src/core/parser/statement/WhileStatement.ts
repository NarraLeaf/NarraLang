import { ParserIterator } from "../ParserIterator";
import { WhileStatementNode } from "./Statement";
import { NodeType } from "../Node";
import { OperatorType } from "@/core/lexer/Operator";
import { ParserError, ParserErrorType } from "../ParserError";
import { parseExpression } from "../expression/ParseExpression";
import { trace } from "../Trace";
import { TokenType } from "@/core/lexer/TokenType";
import { ParserContextType } from "../ctx/ParserContextType";
import { ParseStatementOptions } from "./ParseStatement";
import { parseStatementBlock } from "./BlockStatement";

/**
 * Parse while loop statement
 */
export function parseWhileStatement(iterator: ParserIterator, opts: Required<ParseStatementOptions>): WhileStatementNode {
    // Validate context - while loops can only be used in functions
    if (!iterator.getContext().has(ParserContextType.Function)) {
        throw new ParserError(
            ParserErrorType.InvalidContext,
            "while loops can only be used in functions",
            iterator.getCurrentToken()
        );
    }

    const startToken = iterator.popToken()!; // consume 'while'
    
    // Parse condition
    const condition = parseExpression(iterator, {
        stopOn: [{ type: TokenType.Operator, value: OperatorType.LeftBrace }]
    });
    if (!condition) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected condition after 'while'",
            iterator.getCurrentToken()
        );
    }

    // Parse body block
    const body = parseStatementBlock(iterator, opts);
    
    return {
        type: NodeType.WhileStatement,
        condition,
        body,
        trace: trace(startToken.start, body[body.length - 1]?.trace.end ?? condition.trace.end),
    };
}
