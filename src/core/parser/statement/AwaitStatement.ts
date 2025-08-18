import { ParserIterator } from "../ParserIterator";
import { AwaitStatementNode } from "./Statement";
import { NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { trace } from "../Trace";
import { ParseStatementOptions, parseStatement } from "./ParseStatement";

/**
 * Parse await statement
 */
export function parseAwaitStatement(iterator: ParserIterator, opts: Required<ParseStatementOptions>): AwaitStatementNode {
    const startToken = iterator.popToken()!; // consume 'await'
    
    // Parse the statement to await
    const body = parseStatement(iterator, { ...opts, depth: opts.depth + 1 });
    if (!body) {
        throw new ParserError(
            ParserErrorType.ExpectedStatement,
            "Expected statement after 'await'",
            iterator.getCurrentToken()
        );
    }
    
    return {
        type: NodeType.AwaitStatement,
        body,
        trace: trace(startToken.start, body.trace.end),
    };
}
