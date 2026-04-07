import { ParserIterator } from "../ParserIterator";
import { ContinueStatementNode } from "./Statement";
import { NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { trace } from "../Trace";
import { ParserContextType } from "../ctx/ParserContextType";

/**
 * Parse continue statement
 */
export function parseContinueStatement(iterator: ParserIterator): ContinueStatementNode {
    // Validate context - continue can only be used in functions within loops
    if (!iterator.getContext().has(ParserContextType.Function)) {
        throw new ParserError(
            ParserErrorType.InvalidContext,
            "continue can only be used in functions",
            iterator.getCurrentToken()
        );
    }

    const token = iterator.popToken()!; // consume 'continue'
    
    return {
        type: NodeType.ContinueStatement,
        trace: trace(token.start, token.end),
    };
}
