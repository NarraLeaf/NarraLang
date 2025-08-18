import { ParserIterator } from "../ParserIterator";
import { ReturnStatementNode } from "./Statement";
import { NodeType, ExpressionNode } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { trace } from "../Trace";
import { ParserContextType } from "../ctx/ParserContextType";
import { TokenType } from "@/core/lexer/TokenType";
import { parseExpression } from "../expression/ParseExpression";

/**
 * Parse return statement
 */
export function parseReturnStatement(iterator: ParserIterator): ReturnStatementNode {
    // Validate context - return can only be used in functions
    if (!iterator.getContext().has(ParserContextType.Function)) {
        throw new ParserError(
            ParserErrorType.InvalidContext,
            "return can only be used in functions",
            iterator.getCurrentToken()
        );
    }

    const startToken = iterator.popToken()!; // consume 'return'
    
    // Parse optional return value
    let value: ExpressionNode | null = null;
    const nextToken = iterator.getCurrentToken();
    if (nextToken && nextToken.type !== TokenType.NewLine) {
        value = parseExpression(iterator, {
            stopOn: [{ type: TokenType.NewLine }]
        });
    }
    
    return {
        type: NodeType.ReturnStatement,
        value,
        trace: trace(startToken.start, value?.trace.end ?? startToken.end),
    };
}
