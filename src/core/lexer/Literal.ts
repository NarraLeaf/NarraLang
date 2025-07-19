import { flowLiteral } from "./Identifier";
import { Keywords, KeywordType } from "./Keyword";
import { LexerIterator } from "./LexerIterator";
import { NoneLanguageCharacter, NumberCharacter, WhiteSpace } from "./Operator";
import { Tokens, TokenTrace, TokenType } from "./TokenType";

export function parseNumberLiteral(iterator: LexerIterator): {
    type: TokenType.NumberLiteral,
    value: number,
} & TokenTrace | null {
    const startIndex = iterator.getIndex();
    const currentChar = iterator.getCurrentChar();

    // Determine if current position can start a number literal
    const mayStartNumber = NumberCharacter.test(currentChar) ||
        (currentChar === "." && NumberCharacter.test(iterator.peekChar()));

    if (!mayStartNumber) return null;

    // Collect a maximal substring consisting of characters allowed in numeric literals
    let collected = "";
    const allowed = /[0-9eE+\-.]/;

    // Helper to peek character at relative offset
    const peekAt = (offset: number) => (offset === 0 ? iterator.getCurrentChar() : iterator.peekChar(offset));

    let offset = 0;
    while (true) {
        const ch = peekAt(offset);
        if (ch === undefined || !allowed.test(ch)) break;
        collected += ch;
        offset++;
    }

    // Validate collected string against number literal pattern
    const numberPattern = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
    if (!numberPattern.test(collected)) {
        return null; // Not a valid numeric literal
    }

    // Advance iterator to consume the collected characters
    if (offset > 1) {
        iterator.next(offset - 1);
    }

    // Consume the first character (or the only character when offset === 1) and return token
    return iterator.consume({
        type: TokenType.NumberLiteral,
        value: Number(collected),
        start: startIndex,
        end: iterator.getIndex() - 1,
    });
}

export function parseBooleanLiteral(iterator: LexerIterator): Tokens | null {
    const startIndex = iterator.getIndex();
    const currentChar = iterator.getCurrentChar();

    if (currentChar === "t" || currentChar === "f") {
        const peeked = flowLiteral(iterator);
        if (peeked === "true") {
            iterator.next(peeked.length);
            return { type: TokenType.BooleanLiteral, value: true, start: startIndex, end: startIndex + peeked.length - 1 };
        }
        if (peeked === "false") {
            iterator.next(peeked.length);
            return { type: TokenType.BooleanLiteral, value: false, start: startIndex, end: startIndex + peeked.length - 1 };
        }
    }

    return null;
}

export function parseNullLiteral(iterator: LexerIterator): Tokens | null {
    const startIndex = iterator.getIndex();
    const currentChar = iterator.getCurrentChar();

    if (currentChar === "n") {
        const peeked = flowLiteral(iterator);
        if (peeked === "null") {
            iterator.next(peeked.length);
            return { type: TokenType.NullLiteral, start: startIndex, end: startIndex + peeked.length - 1 };
        }
    }

    return null;
}

export function getPossibleKeywords(iterator: LexerIterator): KeywordType[] {
    const currentChar = iterator.getCurrentChar();
    const possibleKeywords: KeywordType[] = [];

    for (const [key, chars] of Object.entries(Keywords)) {
        const operator = Number(key) as KeywordType;
        // Always compare ONLY the first character of the keyword representation
        const firstChar = Array.isArray(chars)
            ? (chars[0] as string)[0]
            : (chars as string)[0];
        if (firstChar === currentChar) {
            possibleKeywords.push(operator);
        }
    }

    return possibleKeywords;
}

export function tryParseKeyword(possibleTypes: KeywordType[], iterator: LexerIterator): KeywordType | null {
    const matched: { type: KeywordType; length: number, consumed: number }[] = [];

    for (const type of possibleTypes) {
        const chars = Keywords[type];
        if (Array.isArray(chars)) {
            // Existing word-based matching logic remains unchanged
            const peeked: string[] = [];
            let cache = "", consumed = 0;

            iterator.peekUntil((char) => {
                const expected = chars[peeked.length];
                if (!expected.startsWith(cache)) return true; // stop: mismatch

                if (WhiteSpace.includes(char)) {
                    if (cache.length) peeked.push(cache);
                } else {
                    cache += char;
                }
                consumed++;

                if (cache.length >= expected.length) {
                    if (cache !== expected) return true; // stop: mismatch
                    peeked.push(cache);
                    cache = "";
                    
                    return false;
                }

                return false;
            });

            const isMatched =
                peeked.length === chars.length &&
                peeked.every((item, index) => item === chars[index]);

            if (isMatched) {
                matched.push({ type, length: chars.join("").length, consumed });
            }
        } else {
            const peeked = flowLiteral(
                iterator,
                [...chars].filter(char => NoneLanguageCharacter.test(char))
            );
            if (peeked === chars) {
                matched.push({ type, length: (chars as string).length, consumed: chars.length });
            }
        }
    }

    if (matched.length === 0) {
        return null;
    }

    // Prefer the keyword consuming the most characters
    const longest = matched.sort((a, b) => b.length - a.length)[0];

    // Advance cursor to consume the keyword (skip its full length)
    iterator.next(longest.consumed);

    return longest.type;
}

