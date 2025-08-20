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
            
            iterator.next(); // skip EOS

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

    if (iterator.getCurrentChar() === "\"") {
        iterator.next(); // skip "
    } else {
        return new LexerError(LexerErrorType.UnexpectedToken, "Unexpected token when parsing dialogue.", iterator.getIndex());
    }

    const string = parseStringTokens(iterator, { EOS: ["\n", "\r", "\""] }, parseTokenFn);
    if (!string) {
        return new LexerError(LexerErrorType.StringParsingError, "Failed to parse string for dialogue.", iterator.getIndex());
    }
    if (LexerError.isLexerError(string)) {
        return string;
    }

    iterator.next(); // skip EOS

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
    let lineStartIndex = startIndex;
    while (lineStartIndex > 0) {
        const prevChar = text[lineStartIndex - 1];
        if (prevChar === "\n" || prevChar === "\r") {
            break;
        }
        lineStartIndex--;
    }

    let hasNonWhitespaceBefore = false;
    for (let i = lineStartIndex; i < startIndex; i++) {
        if (!WhiteSpace.includes(text[i])) {
            hasNonWhitespaceBefore = true;
            break;
        }
    }
    if (hasNonWhitespaceBefore) {
        return false;
    }

    // Find the colon position
    let colonIndex = -1;
    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];
        if (isNewLineAtIndex(iterator, i)) {
            return false;
        }
        if (char === Operators[OperatorType.Colon]) {
            colonIndex = i;
            break;
        }
    }
    if (colonIndex === -1 || colonIndex >= text.length - 1) {
        return false;
    }

    // Extra check: the content after the colon must be a double quote or { new line double quote
    let j = colonIndex + 1;
    while (j < text.length && WhiteSpace.includes(text[j])) j++;
    const afterColon = text[j];

    if (afterColon === "\"") {
        // OK: single line dialogue
    } else if (afterColon === "{") {
        let k = j + 1;
        while (k < text.length && WhiteSpace.includes(text[k])) k++;
        if (!isNewLineAtIndex(iterator, k)) return false; // { must be followed by a new line
        k++;
        while (k < text.length && WhiteSpace.includes(text[k])) k++;
        if (text[k] !== "\"") return false; // multi-line dialogue must start with a double quote
    } else {
        return false; // not a valid dialogue start
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
        const token = parseToken(tempIterator, { allowDialogue: false });
        if (LexerError.isLexerError(token)) {
            return false;
        }
        if (token === null) {
            continue;
        }
        tokenCount++;
        if (tokenCount > 1) {
            return false;
        }
    }

    return tokenCount === 1;
}
