import { IdentifierCharacter, IdentifierStartCharacter } from "./Operator";
import type { LexerIterator } from "./LexerIterator";
import type { Tokens } from "./Token";
import { TokenType } from "./Token";


export function parseIdentifier(iterator: LexerIterator): Tokens | null {
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

    return { type: TokenType.Identifier, value: identifier };
}

export function flowLiteral(iterator: LexerIterator, whiteList: string[] = []): string | null {
    return iterator.peekUntil((char) => {
        if (whiteList.includes(char)) {
            return false;
        }
        return !IdentifierCharacter.test(char);
    });
}

