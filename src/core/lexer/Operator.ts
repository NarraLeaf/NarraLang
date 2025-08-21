
import type { LexerIterator } from "./LexerIterator";

export enum OperatorType {
    Plus,                        // +
    Minus,                       // -
    Asterisk,                    // *
    Slash,                       // /
    Percent,                     // %
    Exponent,                    // **
    LogicalEquals,               // =
    LogicalNotEqual,             // !=
    LogicalGreaterThan,          // >
    LogicalGreaterThanOrEqual,   // >=
    LogicalLessThan,             // <
    LogicalLessThanOrEqual,      // <=
    LogicalNot,                  // !
    Not,                         // not
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

    Is,                          // is
    And,                         // and
    Or,                          // or

    QuestionMark,                // ?
    Nullish,                     // ??

    // Composite word operators (binary)
    IsNot,                       // is not
    IsEqualTo,                   // is equal to
    IsNotEqualTo,                // is not equal to
    IsGreaterThan,               // is greater than
    IsGreaterThanOrEqual,        // is greater than or equal to
    IsLessThan,                  // is less than
    IsLessThanOrEqual,           // is less than or equal to
    IsIn,                        // is in
}

export const Operators: {
    [K in OperatorType]: string | string[];
} = {
    [OperatorType.Plus]: "+",
    [OperatorType.Minus]: "-",
    [OperatorType.Asterisk]: "*",
    [OperatorType.Slash]: "/",
    [OperatorType.Percent]: "%",
    [OperatorType.Exponent]: "**",
    [OperatorType.LogicalEquals]: "=",
    [OperatorType.LogicalNotEqual]: "!=",
    [OperatorType.LogicalGreaterThan]: ">",
    [OperatorType.LogicalGreaterThanOrEqual]: ">=",
    [OperatorType.LogicalLessThan]: "<",
    [OperatorType.LogicalLessThanOrEqual]: "<=",
    [OperatorType.LogicalNot]: "!",
    [OperatorType.Not]: ["not"],
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

    [OperatorType.Is]: ["is"],
    [OperatorType.And]: ["and"],
    [OperatorType.Or]: ["or"],

    [OperatorType.QuestionMark]: "?",
    [OperatorType.Nullish]: "??",

    // Composite word operators (binary)
    [OperatorType.IsNot]: ["is", "not"],
    [OperatorType.IsEqualTo]: ["is", "equal", "to"],
    [OperatorType.IsNotEqualTo]: ["is", "not", "equal", "to"],
    [OperatorType.IsGreaterThan]: ["is", "greater", "than"],
    [OperatorType.IsGreaterThanOrEqual]: ["is", "greater", "than", "or", "equal", "to"],
    [OperatorType.IsLessThan]: ["is", "less", "than"],
    [OperatorType.IsLessThanOrEqual]: ["is", "less", "than", "or", "equal", "to"],
    [OperatorType.IsIn]: ["is", "in"],
};

export const OperatorBPMap: Record<
    number,
    number
> = {
    // Math operators
    [OperatorType.Exponent]: 80,
    [OperatorType.Asterisk]: 70,
    [OperatorType.Slash]: 70,
    [OperatorType.Percent]: 70,
    [OperatorType.Plus]: 60,
    [OperatorType.Minus]: 60,

    // Relational operators
    [OperatorType.LogicalGreaterThan]: 50,
    [OperatorType.LogicalGreaterThanOrEqual]: 50,
    [OperatorType.LogicalLessThan]: 50,
    [OperatorType.LogicalLessThanOrEqual]: 50,
    [OperatorType.Is]: 40,

    [OperatorType.LogicalEquals]: 40,
    [OperatorType.LogicalNotEqual]: 40,
    // Logical operators
    [OperatorType.And]: 35,
    [OperatorType.Nullish]: 33,
    [OperatorType.Or]: 30,

    // Ternary has very low precedence
    [OperatorType.QuestionMark]: 20,
    
    // Unary operators
    [OperatorType.LogicalNot]: 90,
    [OperatorType.Not]: 90,

    // Composite word operators (binary)
    [OperatorType.IsNot]: 40,
    [OperatorType.IsEqualTo]: 40,
    [OperatorType.IsNotEqualTo]: 40,
    [OperatorType.IsGreaterThan]: 50,
    [OperatorType.IsGreaterThanOrEqual]: 50,
    [OperatorType.IsLessThan]: 50,
    [OperatorType.IsLessThanOrEqual]: 50,
    [OperatorType.IsIn]: 50,
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
