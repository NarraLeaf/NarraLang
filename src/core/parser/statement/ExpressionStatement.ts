import { ParserIterator } from "../ParserIterator";
import { StatementNode } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { parseExpression } from "../expression/ParseExpression";
import { TokenType } from "@/core/lexer/TokenType";
import { SugarCallStatementNode } from "./Statement";
import { NodeType } from "../Node";
import { ParseStatementOptions } from "./ParseStatement";

/**
 * Parse sugar syntax or expression statement
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

    // For now, wrap expressions as sugar call statements
    // TODO: Implement proper expression statement handling
    const result: SugarCallStatementNode = {
        type: NodeType.SugarCallStatement,
        name: "expression",
        args: [expr],
        modifiers: {},
        trace: expr.trace,
    };
    return result;
}
