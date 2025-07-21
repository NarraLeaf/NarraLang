import { isNewLine, isNewLineAtIndex } from "./Comment";
import { LexerError, LexerErrorType } from "./LexerError";
import { LexerIterator, createLexerIterator } from "./LexerIterator";
import { Operators, OperatorType, WhiteSpace } from "./Operator";
import { parseStringTokens, StringToken } from "./String";
import { parseToken } from "./Token";
import { ParseTokenFn, Tokens, TokenTrace, TokenType } from "./TokenType";

export type DialogueToken = {
    character: Tokens[];
    content: StringToken[];
};
export type MultiLineDialogueToken = {
    character: Tokens[];
    content: StringToken[][];
};

export function parseDialogue(iterator: LexerIterator, parseTokenFn: ParseTokenFn): {
    type: TokenType.Dialogue;
    value: DialogueToken;
} & TokenTrace | {
    type: TokenType.MultiLineDialogue;
    value: MultiLineDialogueToken;
} & TokenTrace | LexerError | null {
    if (!isDialogue(iterator)) {
        return null;
    }

    const startIndex = iterator.getIndex();
    const character = parseCharacterName(iterator, parseTokenFn);
    if (LexerError.isLexerError(character)) {
        return character;
    }

    iterator.skipWhiteSpace(); // skip whitespace before the dialogue content

    if (iterator.getCurrentChar() === Operators[OperatorType.LeftBrace]) {
        const content: StringToken[][] = [];

        iterator.next(); // skip "{"

        while (!iterator.isDone()) {
            const currentChar = iterator.getCurrentChar();
            if (WhiteSpace.includes(currentChar)) {
                iterator.next();
                continue;
            }

            if (currentChar === Operators[OperatorType.RightBrace]) {
                iterator.next(); // skip "}"

                break;
            }

            if (isNewLine(iterator)) {
                iterator.next(); // skip new line
                continue;
            }

            const string = parseStringTokens(iterator, { EOS: ["\n", "\r"] }, parseTokenFn);
            if (LexerError.isLexerError(string)) {
                return string;
            }

            content.push(string);
        }

        return {
            type: TokenType.MultiLineDialogue,
            value: {
                character,
                content,
            },
            start: startIndex,
            end: iterator.getIndex() - 1,
        };
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
            iterator.next(); // skip ":"
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

    // check if the text is on its own line
    // Find the start of the current line by going backwards until we hit a newline or the beginning
    let lineStartIndex = startIndex;
    while (lineStartIndex > 0) {
        const prevChar = text[lineStartIndex - 1];
        if (prevChar === "\n" || prevChar === "\r") {
            break;
        }
        lineStartIndex--;
    }

    // Check if there are any non-whitespace characters before the current position on this line
    // Skip leading whitespace (indentation) but reject if there's actual content
    let hasNonWhitespaceBefore = false;
    for (let i = lineStartIndex; i < startIndex; i++) {
        if (!WhiteSpace.includes(text[i])) {
            hasNonWhitespaceBefore = true;
            break;
        }
    }
    
    if (hasNonWhitespaceBefore) {
        return false; // There's actual content before the dialogue start (not just indentation)
    }

    // Find the colon position
    let colonIndex = -1;
    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];

        // If we hit a newline before finding colon, it's not a dialogue
        if (isNewLineAtIndex(iterator, i)) {
            return false;
        }

        // Found colon
        if (char === Operators[OperatorType.Colon]) {
            colonIndex = i;
            break;
        }
    }

    // Must have found a colon and have content after it
    if (colonIndex === -1 || colonIndex >= text.length - 1) {
        return false;
    }

    // Check if there's exactly one token before the colon
    const charNameText = text.slice(startIndex, colonIndex);
    const tempIterator = createLexerIterator(charNameText);
    
    let tokenCount = 0;

    while (!tempIterator.isDone()) {
        const currentChar = tempIterator.getCurrentChar();
        
        if (WhiteSpace.includes(currentChar)) {
            tempIterator.next();
            continue;
        }

        // Try to parse a token
        const token = parseToken(tempIterator, { allowDialogue: false });
        if (LexerError.isLexerError(token)) {
            return false; // Invalid token
        }
        if (token === null) {
            continue;
        }

        tokenCount++;
        if (tokenCount > 1) {
            return false; // More than one token
        }
    }

    return tokenCount === 1;
}
