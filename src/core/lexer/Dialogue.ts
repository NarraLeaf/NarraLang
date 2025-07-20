import { isNewLine, isNewLineAtIndex } from "./Comment";
import { LexerError, LexerErrorType } from "./LexerError";
import { LexerIterator } from "./LexerIterator";
import { Operators, OperatorType, WhiteSpace } from "./Operator";
import { parseStringTokens, StringToken } from "./String";
import { ParseTokenFn, Tokens, TokenTrace, TokenType } from "./TokenType";

export type DialogueToken = {
    character: Tokens[];
    content: StringToken[];
};

export function parseDialogue(iterator: LexerIterator, parseTokenFn: ParseTokenFn): {
    type: TokenType.Dialogue;
    value: DialogueToken;
} & TokenTrace | LexerError | null {
    if (!isDialogue(iterator)) {
        return null;
    }

    const startIndex = iterator.getIndex();
    const character = parseCharacterName(iterator, parseTokenFn);
    if (LexerError.isLexerError(character)) {
        return character;
    }

    const string = parseStringTokens(iterator, { EOS: ["\n", "\r"] }, parseTokenFn);
    if (!string) {
        return new LexerError(LexerErrorType.StringParsingError, "Failed to parse string for dialogue.", iterator.getIndex());
    }
    if (LexerError.isLexerError(string)) {
        return string;
    }

    return {
        type: TokenType.Dialogue,
        value: {
            character,
            content: string,
        },
        start: startIndex,
        end: iterator.getIndex() - 1,
    };
}

export function parseCharacterName(iterator: LexerIterator, parseTokenFn: ParseTokenFn): Tokens[] | LexerError {
    const charNameExpression: Tokens[] = [];

    while (!iterator.isDone()) {
        const currentChar = iterator.getCurrentChar();
        if (WhiteSpace.includes(currentChar)) {
            iterator.next();
            continue;
        }
        if (isNewLine(iterator)) {
            return new LexerError(LexerErrorType.UnexpectedNewLine, "Unexpected new line. This should not happen.", iterator.getIndex());
        }
        if (currentChar === Operators[OperatorType.Colon]) {
            iterator.next();
            break;
        }

        const token = parseTokenFn(iterator, { allowDialogue: false });
        if (LexerError.isLexerError(token)) {
            return token;
        } else if (token !== null) {
            charNameExpression.push(token);
        }
    }

    return charNameExpression;
}

export function isDialogue(iterator: LexerIterator): boolean {
    const startIndex = iterator.getIndex();
    const text = iterator.getRaw();

    // Find the colon position
    let colonIndex = -1;
    let hasCharName = false;

    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];

        // If we hit a newline before finding colon, it's not a dialogue
        if (isNewLineAtIndex(iterator, i)) {
            return false;
        }

        // Found colon
        if (char === Operators[OperatorType.Colon]) {
            if (!hasCharName) {
                return false; // No character name before colon
            }
            colonIndex = i;
            break;
        }

        // Check if we have a character name (non-whitespace characters)
        if (!WhiteSpace.includes(char)) {
            hasCharName = true;
        }
    }

    // Must have found a colon and have content after it
    return colonIndex !== -1 && colonIndex < text.length - 1;
}
