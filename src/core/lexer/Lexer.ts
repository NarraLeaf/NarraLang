import { createLexerIterator } from "./LexerIterator";
import { Tokens } from "./Token";


export function lexer(raw: string): Tokens[] {
    const iterator = createLexerIterator(raw);

    return [];
}

