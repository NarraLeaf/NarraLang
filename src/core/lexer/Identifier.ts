import { IdentifierCharacter, IdentifierStartCharacter } from "./Operator";
import type { LexerIterator } from "./LexerIterator";
import { TokenType, TokenTrace } from "./TokenType";


export function parseIdentifier(iterator: LexerIterator): {
    type: TokenType.Identifier,
    value: string,
} & TokenTrace | null {
    const startIndex = iterator.getIndex();
    const currentChar = iterator.getCurrentChar();

    if (!IdentifierStartCharacter.test(currentChar)) {
        return null;
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
        return null;
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
