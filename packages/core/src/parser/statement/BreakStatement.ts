import { ParserIterator } from "../ParserIterator";
import { BreakStatementNode } from "./Statement";
import { NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { trace } from "../Trace";
import { ParserContextType } from "../ctx/ParserContextType";

/**
 * Parse break statement
 */
export function parseBreakStatement(iterator: ParserIterator): BreakStatementNode {
    // Validate context - break can only be used in functions within loops
    if (!iterator.getContext().has(ParserContextType.Function)) {
        throw new ParserError(
            ParserErrorType.InvalidContext,
            "break can only be used in functions",
            iterator.getCurrentToken()
        );
    }

    const token = iterator.popToken()!; // consume 'break'
    
    return {
        type: NodeType.BreakStatement,
        trace: trace(token.start, token.end),
    };
}
