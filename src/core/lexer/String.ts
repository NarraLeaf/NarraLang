import { NamedColor, NamedColors } from "../utils/constant";
import { PauseConfig, WordConfig } from "../utils/narraleaf-react";
import { HexString } from "../utils/type";
import { parseIdentifier } from "./Identifier";
import { LexerError } from "./LexerError";
import { LexerIterator } from "./LexerIterator";
import { parseNumberLiteral } from "./Literal";
import { EscapeCharacter, HexColorCharacter, HexDigitCharacter, IdentifierCharacter, IdentifierStartCharacter, LanguageCharacter, UnicodeCodePointCharacter, WhiteSpace } from "./Operator";
import type { Tokens } from "./TokenType";

export enum StringTokenType {
    String,
    Expression,
    Tag,
    CloseTag,
}

export type StringToken =
    | { type: StringTokenType.String, value: string }
    | { type: StringTokenType.Expression, value: Tokens[] }
    | { type: StringTokenType.Tag, value: StringTag }
    | { type: StringTokenType.CloseTag };
export const QuotationMarks = ["\"", "'"];

/* Tag */
export enum StringTagType {
    HexColor,
    NamedColor,
    Bold,
    Italic,
    Pause,
    Word,
}
export enum TagOperatorType {
    LeftAngleBracket,
    RightAngleBracket,
    Equals,
    LeftBrace,
    RightBrace,
    Hash,
    Slash,
}
export const TagOperators: {
    [K in TagOperatorType]: string | string[];
} = {
    [TagOperatorType.LeftAngleBracket]: "<",
    [TagOperatorType.RightAngleBracket]: ">",
    [TagOperatorType.Equals]: "=",
    [TagOperatorType.LeftBrace]: "{",
    [TagOperatorType.RightBrace]: "}",
    [TagOperatorType.Hash]: "#",
    [TagOperatorType.Slash]: "/",
}

/* Escape */
const EscapeMap: Record<string, string> = {
    "n": "\n",
    "r": "\r",
    "t": "\t",
    "b": "\b",
    "\\": "\\",
    "\"": "\"",
    "'": "'",
    "{": "{",
    "}": "}",
    "<": "<",
    ">": ">",
}

export type StringTag = RawStringTag & {
    properties: Record<string, string | number> | null,
    closed: boolean,
};
export type RawStringTag =
    | { type: StringTagType.HexColor, value: HexString }
    | { type: StringTagType.NamedColor, value: NamedColor }
    | { type: StringTagType.Bold, value: null }
    | { type: StringTagType.Italic, value: null }
    | { type: StringTagType.Pause, value: null }
    | { type: StringTagType.Word, value: null };

export interface StringParserConfig {
    EOL: string[],
}

export function parseStringTokens(
    iterator: LexerIterator,
    { EOL }: StringParserConfig,
    parseTokenFn: (iterator: LexerIterator) => Tokens | LexerError | null,
): StringToken[] | LexerError | null {
    const tokens: StringToken[] = [];
    const getEOL = (char: string): number | null => {
        for (const eol of EOL) {
            const peeked = iterator.peek(eol.length);
            if (peeked === eol) return eol.length;
        }
        return null;
    };

    let stringCache: string = "";

    while (!iterator.isDone()) {
        const currentChar = iterator.getCurrentChar();
        const eolLength = getEOL(currentChar);
        if (eolLength) {
            iterator.next(eolLength); // skip EOL
            return tokens;
        }

        if (![
            TagOperators[TagOperatorType.LeftAngleBracket],
            TagOperators[TagOperatorType.LeftBrace],
        ].includes(currentChar)) {
            stringCache += currentChar;
            iterator.next(); // skip currentChar
            continue;
        } else {
            if (stringCache.length) { // push cache before pushing other tokens
                tokens.push({
                    type: StringTokenType.String,
                    value: stringCache,
                });
                stringCache = "";
            }
        }

        if (currentChar === TagOperators[TagOperatorType.LeftAngleBracket]) {
            const token = tryParseTag(iterator);
            if (!token) return null;

            tokens.push(token);
            continue;
        }

        if (currentChar === TagOperators[TagOperatorType.LeftBrace]) {
            const expressionTokens: Tokens[] = [];
            let closed = false;

            while (!iterator.isDone()) {
                const currentChar = iterator.getCurrentChar();
                if (currentChar === TagOperators[TagOperatorType.RightBrace]) {
                    iterator.next(); // skip "}"
                    closed = true;
                    break;
                }

                const token = parseTokenFn(iterator);
                if (!token) continue;

                if (LexerError.isLexerError(token)) {
                    return null;
                }

                expressionTokens.push(token);
            }

            if (!closed) return null;

            tokens.push({
                type: StringTokenType.Expression,
                value: expressionTokens,
            });
            continue;
        }

        throw new SyntaxError(`Unexpected token when parsing string: ${currentChar}`);
    }

    return null;
}

function tryParseTag(iterator: LexerIterator): StringToken | null {
    const currentChar = iterator.getCurrentChar();
    if (currentChar !== TagOperators[TagOperatorType.LeftAngleBracket]) {
        return null;
    }
    iterator.next(); // skip "<"

    iterator.skipWhiteSpace(); // skip whitespace
    if (iterator.getCurrentChar() === TagOperators[TagOperatorType.Slash]) {
        if (iterator.peekChar() !== TagOperators[TagOperatorType.RightAngleBracket]) {
            return null;
        }
        iterator.next(); // skip "/"

        return iterator.consume({
            type: StringTokenType.CloseTag,
        }); // skip whitespace
    }

    const tagType = parseTagName(iterator);
    if (!tagType) return null;

    const properties = parseProperty(iterator);
    if (!properties) return null;

    const closed = iterator.getCurrentChar() === TagOperators[TagOperatorType.Slash];
    if (closed) iterator.next(); // skip "/"

    if (iterator.getCurrentChar() !== TagOperators[TagOperatorType.RightAngleBracket]) {
        return null;
    }
    iterator.next(); // skip ">"

    const tag: StringTag = {
        ...tagType,
        properties,
        closed,
    };
    return {
        type: StringTokenType.Tag,
        value: tag,
    };
}

function parseTagName(iterator: LexerIterator): RawStringTag | null {
    const currentChar = iterator.getCurrentChar();
    if (currentChar !== TagOperators[TagOperatorType.Hash]) {
        return null;
    }
    iterator.next(); // skip "#"

    if (currentChar === TagOperators[TagOperatorType.Hash]) {
        iterator.next(); // skip "#"
        const hexColor = iterator.peekUntil((char) => {
            if (!HexDigitCharacter.test(char)) {
                return true;
            }
            return false;
        });
        if (!hexColor?.length || !HexColorCharacter.test(hexColor)) return null;
        if (![
            ...WhiteSpace,
            TagOperators[TagOperatorType.RightAngleBracket],
            TagOperators[TagOperatorType.Slash],
        ].includes(iterator.getCurrentChar())) return null;

        iterator.next(hexColor.length); // skip hexColor

        return iterator.consume({ type: StringTagType.HexColor, value: `#${hexColor}` }); // skip whitespace
    }

    if (LanguageCharacter.test(currentChar)) {
        const tagName = iterator.peekUntil((char) => {
            if (!LanguageCharacter.test(char)) {
                return true;
            }
            return false;
        });
        if (!tagName?.length || !WhiteSpace.includes(iterator.getCurrentChar())) return null;

        const tagType = getTagType(tagName);
        if (!tagType) return null;
        iterator.next(tagName.length); // skip tagName

        if (![
            ...WhiteSpace,
            TagOperators[TagOperatorType.RightAngleBracket],
            TagOperators[TagOperatorType.Slash],
        ].includes(iterator.getCurrentChar())) return null;

        return tagType;
    }

    return null;
}

function getTagType(tagName: string): RawStringTag | null {
    if (NamedColors.includes(tagName)) {
        return { type: StringTagType.NamedColor, value: tagName as NamedColor };
    }

    if (tagName === "b") {
        return { type: StringTagType.Bold, value: null };
    }

    if (tagName === "i") {
        return { type: StringTagType.Italic, value: null };
    }

    if (tagName === "pause") {
        return { type: StringTagType.Pause, value: null };
    }

    if (tagName === "p") {
        return { type: StringTagType.Word, value: null };
    }

    return null;
}

function parseProperty(iterator: LexerIterator): Record<string, string | number> | null {
    const properties: Record<string, string | number> = {};

    while (!iterator.isDone()) {
        const currentChar = iterator.getCurrentChar();
        if (WhiteSpace.includes(currentChar)) {
            iterator.next(); // skip whitespace
            continue;
        }

        if ([
            TagOperators[TagOperatorType.RightAngleBracket],
            TagOperators[TagOperatorType.Slash],
        ].includes(currentChar)) {
            return properties;
        }

        if (IdentifierStartCharacter.test(currentChar)) {
            const parsedIdentifier = parseIdentifier(iterator);
            if (!parsedIdentifier) return null;

            const identifier = parsedIdentifier.value;
            if (iterator.skipWhiteSpace() !== TagOperators[TagOperatorType.Equals]) {
                return null;
            }
            iterator.next(); // skip "="

            let shoudClose = iterator.getCurrentChar() === TagOperators[TagOperatorType.LeftBrace];
            if (shoudClose) {
                iterator.next(); // skip "{"
            }

            let parsedValue: number | string | null = parseNumberLiteral(iterator)?.value ?? null;
            if (!parsedValue) {
                if (QuotationMarks.includes(iterator.getCurrentChar())) {
                    const quote = iterator.getCurrentChar();
                    parsedValue = flowString(iterator, [quote], quote);
                }
            }
            if (!parsedValue) return null;

            if (shoudClose) {
                if (iterator.getCurrentChar() !== TagOperators[TagOperatorType.RightBrace]) {
                    return null;
                }
                iterator.next(); // skip "}"
            }

            properties[identifier] = parsedValue;
        } else {
            return null;
        }
    }

    return null;
}

function flowString(iterator: LexerIterator, startChar: string[] | null, endChar: string): string | null {
    let char: string = "";

    if (startChar && !startChar.includes(iterator.getCurrentChar())) {
        return null;
    }
    if (startChar) {
        iterator.next(); // skip startChar
    }

    while (!iterator.isDone()) {
        const currentChar = iterator.getCurrentChar();
        if (currentChar === endChar) {
            iterator.next(); // skip endChar
            return char;
        }

        if (EscapeCharacter.test(currentChar)) {
            const escaped = tryEscape(iterator);
            if (!escaped) return null;

            char += escaped.value;
            continue;
        }

        char += currentChar;
        iterator.next();
    }

    return null;
}

function tryEscape(iterator: LexerIterator): {
    type: StringTokenType.String,
    value: string,
} | null {
    const currentChar = iterator.getCurrentChar();
    if (!EscapeCharacter.test(currentChar)) {
        return null;
    }
    iterator.next(); // skip "\"

    const head = iterator.getCurrentChar();
    if (head in EscapeMap) {
        const escaped = EscapeMap[head];
        return iterator.consume({ type: StringTokenType.String, value: escaped });
    }

    if (head === "u") {
        iterator.next(); // skip "u"
        if (iterator.getCurrentChar() !== TagOperators[TagOperatorType.LeftBrace]) {
            return null;
        }
        iterator.next(); // skip "{"

        const codepoint = iterator.peekUntil((char) => {
            if (!UnicodeCodePointCharacter.test(char)) {
                return true;
            }
            return false;
        });
        if (!codepoint?.length) return null;

        if (iterator.getCurrentChar() !== TagOperators[TagOperatorType.RightBrace]) {
            return null;
        }
        iterator.next(); // skip "}"
        return { type: StringTokenType.String, value: String.fromCodePoint(parseInt(codepoint, 16)) };
    }

    return null;
}

