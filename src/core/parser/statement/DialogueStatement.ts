import { Tokens, TokensTypeOf, TokenType } from "@/core/lexer/TokenType";
import { parseExpression } from "../expression/ParseExpression";
import { parseRichString } from "../expression/parseRichString";
import { NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { createParserIterator } from "../ParserIterator";
import { trace } from "../Trace";
import { DialogueStatementNode } from "./Statement";
import { NullExpression } from "../expression/helper";

export function createDialogueStatement(token: TokensTypeOf<TokenType.Dialogue> | TokensTypeOf<TokenType.MultiLineDialogue>): DialogueStatementNode {
    if (token.type === TokenType.Dialogue) {
        const { character, content } = token.value;
        const characterName = parseExpression(createParserIterator(character));
        if (!characterName) {
            throw new ParserError(
                ParserErrorType.ExpectedExpression,
                "Expected character name after ':'",
                token
            );
        }

        const dialogue = parseRichString(content);

        return {
            type: NodeType.DialogueExpression,
            character: characterName,
            dialogue,
            trace: trace(token.start, token.end),
        };
    } else if (token.type === TokenType.MultiLineDialogue) {
        const { character, content } = token.value;
        const characterName = parseExpression(createParserIterator(character));
        if (!characterName) {
            throw new ParserError(
                ParserErrorType.ExpectedExpression,
                "Expected character name after ':'",
                token
            );
        }

        const dialogue = content.map(parseRichString);

        return {
            type: NodeType.DialogueExpression,
            character: characterName,
            dialogue,
            trace: trace(token.start, token.end),
        };
    }

    throw new ParserError(
        ParserErrorType.UnexpectedToken,
        "Expected dialogue or multi-line dialogue, got unknown token type: " + ((token as Tokens)?.type ?? "unknown"),
        token
    );
}

export function createNarrativeDialogue(token: TokensTypeOf<TokenType.String>): DialogueStatementNode {
    const parsed = parseRichString(token.value);

    return {
        type: NodeType.DialogueExpression,
        character: NullExpression(token.start),
        dialogue: parsed,
        trace: trace(token.start, token.end),
    };
}
