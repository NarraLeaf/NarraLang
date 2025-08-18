import { ParserIterator } from "../ParserIterator";
import { LoopStatementNode } from "./Statement";
import { NodeType } from "../Node";
import { OperatorType } from "@/core/lexer/Operator";
import { ParserError, ParserErrorType } from "../ParserError";
import { parseExpression } from "../expression/ParseExpression";
import { trace } from "../Trace";
import { TokenType } from "@/core/lexer/TokenType";
import { ParseStatementOptions } from "./ParseStatement";
import { parseStatementBlock } from "./BlockStatement";
import { LiteralNode } from "../expression/Expression";

/**
 * Parse loop statement (loop N times { ... })
 * Note: 'times' and 'time' are treated as optional identifiers, not keywords
 */
export function parseLoopStatement(iterator: ParserIterator, opts: Required<ParseStatementOptions>): LoopStatementNode {
    const startToken = iterator.popToken()!; // consume 'loop'
    
    // Parse times expression (must be a number literal according to docs)
    const times = parseExpression(iterator, {
        stopOn: [
            { type: TokenType.Operator, value: OperatorType.LeftBrace },
            { type: TokenType.Identifier, value: "times" },
            { type: TokenType.Identifier, value: "time" }
        ]
    });
    if (!times) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected number after 'loop'",
            iterator.getCurrentToken()
        );
    }

    if (times.type !== NodeType.Literal || (
        times.type === NodeType.Literal && typeof (times as LiteralNode).value !== "number"
    )) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected number in loop configuration, got a " + (
                times.type === NodeType.Literal ? typeof (times as LiteralNode).value : times.type
            ),
            iterator.getCurrentToken()
        );
    }

    // Optional 'times' or 'time' identifier (not keywords)
    const nextToken = iterator.getCurrentToken();
    if (nextToken && 
        nextToken.type === TokenType.Identifier && 
        (nextToken.value === "times" || nextToken.value === "time")) {
        iterator.popToken(); // consume the optional 'times'/'time'
    }

    // Parse body block
    const body = parseStatementBlock(iterator, opts);
    
    return {
        type: NodeType.LoopStatement,
        times,
        body,
        trace: trace(startToken.start, body[body.length - 1]?.trace.end ?? times.trace.end),
    };
}
