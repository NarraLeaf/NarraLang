import { ParserIterator } from "../ParserIterator";
import { SugarCallStatementNode } from "./Statement";
import { NodeType, ExpressionNode } from "../Node";
import { OperatorType } from "@/core/lexer/Operator";
import { ParserError, ParserErrorType } from "../ParserError";
import { trace } from "../Trace";
import { TokenType } from "@/core/lexer/TokenType";
import { parseExpression } from "../expression/ParseExpression";
import { ParseStatementOptions } from "./ParseStatement";

/**
 * Try to parse dialogue statement (Character: "text")
 */
export function tryParseDialogueStatement(iterator: ParserIterator, _opts: Required<ParseStatementOptions>): SugarCallStatementNode | null {
    const characterToken = iterator.getCurrentToken();
    if (!characterToken || characterToken.type !== TokenType.Identifier) {
        return null;
    }

    // Look ahead for colon
    const colonToken = iterator.peekToken(1);
    if (!colonToken || colonToken.type !== TokenType.Operator || colonToken.value !== OperatorType.Colon) {
        return null;
    }

    // Parse as dialogue statement
    iterator.popToken(); // consume character name
    iterator.popToken(); // consume colon

    // Parse dialogue text expression
    const text = parseExpression(iterator, {
        stopOn: [{ type: TokenType.NewLine }]
    });
    if (!text) {
        throw new ParserError(
            ParserErrorType.ExpectedExpression,
            "Expected dialogue text after ':'",
            iterator.getCurrentToken()
        );
    }

    return {
        type: NodeType.SugarCallStatement,
        name: "dialogue",
        args: [
            { type: NodeType.Literal, value: characterToken.value, trace: trace(characterToken.start, characterToken.end) } as ExpressionNode,
            text
        ],
        modifiers: {},
        trace: trace(characterToken.start, text.trace.end),
    };
}
