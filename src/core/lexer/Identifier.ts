import { IdentifierCharacter, IdentifierStartCharacter } from "./Operator";
import type { LexerIterator } from "./LexerIterator";
import { TokenType, TokenTrace } from "./TokenType";
import { LexerError, LexerErrorType } from "./LexerError";


export function parseIdentifier(iterator: LexerIterator): {
    type: TokenType.Identifier,
    value: string,
} & TokenTrace | LexerError {
    const startIndex = iterator.getIndex();
    const currentChar = iterator.getCurrentChar();

    if (!IdentifierStartCharacter.test(currentChar)) {
        return new LexerError(LexerErrorType.UnexpectedToken, `Unexpected token when parsing identifier: ${JSON.stringify(currentChar)}`, iterator.getIndex());
    }

    let identifier = "";
    const success = iterator.nextUntil((char) => {
        if (IdentifierCharacter.test(char)) {
            identifier += char;
            return false;
        }
        return true;
    });

    if (!success) {
        return new LexerError(LexerErrorType.UnknownError, "Unknown error when parsing identifier.", iterator.getIndex());
    }

    return { type: TokenType.Identifier, value: identifier, start: startIndex, end: iterator.getIndex() - 1 };
}

export function flowLiteral(iterator: LexerIterator, whiteList: string[] = []): string | null {
    return iterator.peekUntil((char) => {
        if (whiteList.includes(char)) {
            return false;
        }
        return !IdentifierCharacter.test(char);
    });
}
