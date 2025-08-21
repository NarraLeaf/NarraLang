import { LexerError } from "./LexerError";
import { LexerIterator } from "./LexerIterator";
import { Tokens, TokenType } from "./TokenType";


export function parseComment(iterator: LexerIterator): Tokens | LexerError | null {
    const startIndex = iterator.getIndex();
    const currentChar = iterator.getCurrentChar();

    if (currentChar !== "/" || iterator.peekChar() !== "/") {
        return null;
    }
    iterator.next(2);

    let comment = "";
    while (!iterator.isDone()) {
        const currentChar = iterator.getCurrentChar();
        if (isNewLine(iterator) > 0) {
            break;
        }
        comment += currentChar;
        iterator.next();
    }

    return { type: TokenType.Comment, value: comment, start: startIndex, end: iterator.getIndex() - 1 };
}

export function isNewLine(iterator: LexerIterator): number {
    const currentChar = iterator.getCurrentChar();
    return (
        currentChar === "\r"
        ? iterator.peekChar() === "\n" ? 2 : 1
        : currentChar === "\n" ? 1 : 0
    );
}

export function isNewLineAtIndex(iterator: LexerIterator, index: number): boolean {
    const text = iterator.getRaw();
    if (index >= text.length) {
        return false;
    }
    
    const currentChar = iterator.getCharAt(index);
    return currentChar === "\r" || currentChar === "\n";
}
