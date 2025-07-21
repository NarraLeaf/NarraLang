import { LexerError } from "./LexerError";
import { createLexerIterator } from "./LexerIterator";
import { parseToken } from "./Token";
import type { Tokens } from "./TokenType";

export function lexer(raw: string): Tokens[] | LexerError {
    const iterator = createLexerIterator(raw);
    const tokens: Tokens[] = [];

    while (!iterator.isDone()) {
        const token = parseToken(iterator);
        if (!token) continue;

        if (LexerError.isLexerError(token)) {
            return token;
        }

        tokens.push(token);
    }

    return tokens;
}

export function toErrorMessage(error: LexerError, raw: string): string {
    const { line, offset, lineContent } = error.getLineInfo(raw);
    return `[Lexer Error] ${error.message} at line ${line}\n${lineContent}\n${" ".repeat(offset)}^`;
}
