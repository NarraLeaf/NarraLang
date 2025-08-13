
import type { LexerIterator } from "./LexerIterator";

export enum OperatorType {
    Plus,                        // +
    Minus,                       // -
    Asterisk,                    // *
    Slash,                       // /
    Percent,                     // %
    Exponent,                    // ^
    LogicalEquals,               // =
    LogicalNotEqual,             // !=
    LogicalGreaterThan,          // >
    LogicalGreaterThanOrEqual,   // >=
    LogicalLessThan,             // <
    LogicalLessThanOrEqual,      // <=
    LogicalNot,                  // !
    Arrow,                       // =>
    Hash,                        // #

    LeftParenthesis,             // (
    RightParenthesis,            // )
    LeftBracket,                 // [
    RightBracket,                // ]
    LeftBrace,                   // {
    RightBrace,                  // }

    Comma,                       // ,
    Colon,                       // :
    Semicolon,                   // ;
    Dot,                         // .
    Ellipsis,                    // ...

    In,                          // in
    Is,                          // is
    And,                         // and
    Or,                          // or
    Not,                         // not
    EqualTo,                     // equal to
    GreaterThan,                 // greater than
    LessThan,                    // less than
    GreaterThanOrEqual,          // greater than or equal to
    LessThanOrEqual,             // less than or equal to

    QuestionMark,                // ?
    To,                          // to
    Nullish,                     // ??
}

export const Operators: {
    [K in OperatorType]: string | string[];
} = {
    [OperatorType.Plus]: "+",
    [OperatorType.Minus]: "-",
    [OperatorType.Asterisk]: "*",
    [OperatorType.Slash]: "/",
    [OperatorType.Percent]: "%",
    [OperatorType.Exponent]: "^",
    [OperatorType.LogicalEquals]: "=",
    [OperatorType.LogicalNotEqual]: "!=",
    [OperatorType.LogicalGreaterThan]: ">",
    [OperatorType.LogicalGreaterThanOrEqual]: ">=",
    [OperatorType.LogicalLessThan]: "<",
    [OperatorType.LogicalLessThanOrEqual]: "<=",
    [OperatorType.LogicalNot]: "!",
    [OperatorType.Arrow]: "=>",
    [OperatorType.Hash]: "#",

    [OperatorType.LeftParenthesis]: "(",
    [OperatorType.RightParenthesis]: ")",
    [OperatorType.LeftBracket]: "[",
    [OperatorType.RightBracket]: "]",
    [OperatorType.LeftBrace]: "{",
    [OperatorType.RightBrace]: "}",

    [OperatorType.Comma]: ",",
    [OperatorType.Colon]: ":",
    [OperatorType.Semicolon]: ";",
    [OperatorType.Dot]: ".",
    [OperatorType.Ellipsis]: "...",

    [OperatorType.In]: ["in"],
    [OperatorType.Is]: ["is"],
    [OperatorType.And]: ["and"],
    [OperatorType.Or]: ["or"],
    [OperatorType.Not]: ["not"],
    [OperatorType.EqualTo]: ["equal", "to"],
    [OperatorType.GreaterThan]: ["greater", "than"],
    [OperatorType.LessThan]: ["less", "than"],
    [OperatorType.GreaterThanOrEqual]: ["greater", "than", "or", "equal", "to"],
    [OperatorType.LessThanOrEqual]: ["less", "than", "or", "equal", "to"],

    [OperatorType.QuestionMark]: "?",
    [OperatorType.To]: "to",
    [OperatorType.Nullish]: "??",
};

export const OperatorBPMap: Record<
    number,
    number
> = {
    [OperatorType.Plus]: 10,
    [OperatorType.Minus]: 10,
    [OperatorType.Asterisk]: 20,
    [OperatorType.Slash]: 20,
    [OperatorType.Percent]: 20,
    [OperatorType.Exponent]: 30,

    [OperatorType.LogicalEquals]: 40,
    [OperatorType.LogicalNotEqual]: 40,
    [OperatorType.LogicalGreaterThan]: 40,
    [OperatorType.LogicalGreaterThanOrEqual]: 40,
    [OperatorType.LogicalLessThan]: 40,
    [OperatorType.LogicalLessThanOrEqual]: 40,

    [OperatorType.LogicalNot]: 40,

    [OperatorType.In]: 50,
    [OperatorType.Is]: 60,
    [OperatorType.And]: 70,
    [OperatorType.Or]: 70,
    [OperatorType.Not]: 70,
    [OperatorType.EqualTo]: 70,
    [OperatorType.GreaterThan]: 70,
    [OperatorType.LessThan]: 70,
    [OperatorType.GreaterThanOrEqual]: 70,
};

export const WhiteSpace = [" ", "\t"];
export const NoneLanguageCharacter = /[^\p{L}]/u;
export const LanguageCharacter = /[\p{L}]/u;
export const IdentifierCharacter = /[\p{L}\p{Nl}\p{Nd}\p{Pc}]/u;
export const IdentifierStartCharacter = /[\p{L}\p{Nl}\p{Pc}]/u;
export const NumberCharacter = /[\p{Nd}]/u;
export const EscapeCharacter = /\\/u;
export const UnicodeCodePointCharacter = /[0-9A-Fa-f]/;
export const HexColorCharacter = /^#(?:[0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
export const HexDigitCharacter = /[0-9A-Fa-f]/;

export function getPossibleOperators(iterator: LexerIterator): OperatorType[] {
    const currentChar = iterator.getCurrentChar();
    const possibleOperators: OperatorType[] = [];

    for (const [key, chars] of Object.entries(Operators)) {
        const operator = Number(key) as OperatorType;
        // Always compare ONLY the first character of the operator representation
        const firstChar = Array.isArray(chars)
            ? (chars[0] as string)[0]
            : (chars as string)[0];
        if (firstChar === currentChar) {
            possibleOperators.push(operator);
        }
    }

    return possibleOperators;
}

export function tryParseOperator(possibleTypes: OperatorType[], iterator: LexerIterator): OperatorType | null {
    const matched: { type: OperatorType; length: number, consumed: number }[] = [];

    for (const type of possibleTypes) {
        const chars = Operators[type];
        if (Array.isArray(chars)) {
            // Existing word-based matching logic remains unchanged
            const peeked: string[] = [];
            let cache = "", consumed = 0;

            iterator.peekUntil((char) => {
                const expected = chars[peeked.length];
                if (!expected || !expected.startsWith(cache)) return true; // stop: mismatch or end of array

                if (NoneLanguageCharacter.test(char)) {
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
            if (iterator.peek(chars.length) === chars) {
                matched.push({ type, length: (chars as string).length, consumed: chars.length });
            }
        }
    }

    if (matched.length === 0) {
        return null;
    }

    // Prefer the operator consuming the most characters
    const longest = matched.sort((a, b) => b.length - a.length)[0];

    // Advance cursor to consume the operator (skip its full length)
    iterator.next(longest.consumed);

    return longest.type;
}
