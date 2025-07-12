import { LexerError } from "./LexerError";
import { createLexerIterator } from "./LexerIterator";
import { parseToken } from "./Token";
import type { Tokens } from "./TokenType";


export function lexer(raw: string): Tokens[] {
    const iterator = createLexerIterator(raw);
    const tokens: Tokens[] = [];

    while (!iterator.isDone()) {
        const token = parseToken(iterator);
        if (!token) continue;

        if (LexerError.isLexerError(token)) {
            const { line, offset, lineContent } = token.getLineInfo(raw);
            throw new LexerError(token.type, token.message, token.index);
        }

        tokens.push(token);
    }

    return tokens;
}

