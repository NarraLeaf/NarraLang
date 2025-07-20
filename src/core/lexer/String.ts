import { NamedColor, NamedColors } from "../utils/constant";
import { PauseConfig, WordConfig } from "../utils/narraleaf-react";
import { HexString } from "../utils/type";
import { parseIdentifier } from "./Identifier";
import { LexerError, LexerErrorType } from "./LexerError";
import { LexerIterator } from "./LexerIterator";
import { parseNumberLiteral } from "./Literal";
import { EscapeCharacter, HexColorCharacter, HexDigitCharacter, IdentifierCharacter, IdentifierStartCharacter, LanguageCharacter, UnicodeCodePointCharacter, WhiteSpace } from "./Operator";
import { ParseTokenFn, type Tokens } from "./TokenType";

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
    LeftAngleBracket,     // <
    RightAngleBracket,    // >
    Equals,               // =
    LeftBrace,            // {
    RightBrace,           // }
    Hash,                 // #
    Slash,                // /
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
    EOS: string[],
}

export function parseStringTokens(
    iterator: LexerIterator,
    { EOS }: StringParserConfig,
    parseTokenFn: ParseTokenFn,
): StringToken[] | LexerError | null {
    const tokens: StringToken[] = [];

    let stringCache: string = "";
    const pushCache = () => {
        if (stringCache.length) {
            tokens.push({
                type: StringTokenType.String,
                value: stringCache,
            });
            stringCache = "";
        }
    }

    while (!iterator.isDone()) {
        const currentChar = iterator.getCurrentChar();
        if (EOS.includes(currentChar)) {
            iterator.next(); // skip EOL
            pushCache();
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
            pushCache();
        }

        if (currentChar === TagOperators[TagOperatorType.LeftAngleBracket]) {
            const token = tryParseTag(iterator);
            if (!token || LexerError.isLexerError(token)) return token;

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
                    return token;
                }

                expressionTokens.push(token);
            }

            if (!closed) return new LexerError(LexerErrorType.UnclosedExpression, "Unclosed expression", iterator.getIndex());

            tokens.push({
                type: StringTokenType.Expression,
                value: expressionTokens,
            });
            continue;
        }

        throw new SyntaxError(`Unexpected token when parsing string: ${currentChar}`);
    }

    return new LexerError(LexerErrorType.UnclosedString, `Unclosed string. ${EOS.map((eol) => JSON.stringify(eol)).join(", ")} expected, but found the end of script. StringCache: ${JSON.stringify(stringCache)}`, iterator.getIndex() - 1);
}

function tryParseTag(iterator: LexerIterator): StringToken | LexerError | null {
    const currentChar = iterator.getCurrentChar();
    if (currentChar !== TagOperators[TagOperatorType.LeftAngleBracket]) {
        return null;
    }
    iterator.next(); // skip "<"

    iterator.skipWhiteSpace(); // skip whitespace
    if (iterator.getCurrentChar() === TagOperators[TagOperatorType.Slash]) {
        iterator.next(); // skip "/"
        iterator.skipWhiteSpace(); // skip whitespace

        if (iterator.getCurrentChar() !== TagOperators[TagOperatorType.RightAngleBracket]) {
            return new LexerError(LexerErrorType.UnclosedTag, "Unclosed tag. Expected '>'.", iterator.getIndex());
        }

        return iterator.consume({
            type: StringTokenType.CloseTag,
        }); // skip whitespace
    }

    const tagType = parseTagName(iterator);
    if (LexerError.isLexerError(tagType)) return tagType;

    const properties = parseProperty(iterator);
    if (LexerError.isLexerError(properties)) return properties;

    const closed = iterator.getCurrentChar() === TagOperators[TagOperatorType.Slash];
    if (closed) iterator.next(); // skip "/"

    if (iterator.getCurrentChar() !== TagOperators[TagOperatorType.RightAngleBracket]) {
        return new LexerError(LexerErrorType.UnclosedTag, "Unclosed tag. Expected '>'.", iterator.getIndex());
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

function parseTagName(iterator: LexerIterator): RawStringTag | LexerError {
    const currentChar = iterator.getCurrentChar();

    if (currentChar === TagOperators[TagOperatorType.Hash]) {
        iterator.next(); // skip "#"
        const hexColor = iterator.peekUntil((char) => {
            if (!HexDigitCharacter.test(char)) {
                return true;
            }
            return false;
        });
        if (!hexColor?.length || !HexColorCharacter.test(hexColor)) return new LexerError(
            LexerErrorType.UnexpectedToken,
            `Unexpected token when parsing tag. Expected hex color, but found ${iterator.getCurrentChar()}`,
            iterator.getIndex()
        );
        if (![
            ...WhiteSpace,
            TagOperators[TagOperatorType.RightAngleBracket],
            TagOperators[TagOperatorType.Slash],
        ].includes(iterator.getCurrentChar())) return new LexerError(
            LexerErrorType.UnexpectedToken,
            `Unexpected token when parsing tag. Expected end of tag, but found ${iterator.getCurrentChar()}`,
            iterator.getIndex()
        );

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
        if (!tagName?.length) return new LexerError(
            LexerErrorType.UnexpectedToken,
            `Unexpected token when parsing tag. Expected end of tag, but found ${iterator.getCurrentChar()}`,
            iterator.getIndex()
        );

        const tagType = getTagType(tagName);
        if (!tagType) return new LexerError(LexerErrorType.UnknownTag, `Unknown tag: ${tagName}`, iterator.getIndex());
        iterator.next(tagName.length); // skip tagName

        if (![
            ...WhiteSpace,
            TagOperators[TagOperatorType.RightAngleBracket],
            TagOperators[TagOperatorType.Slash],
        ].includes(iterator.getCurrentChar())) return new LexerError(
            LexerErrorType.UnexpectedToken,
            `Unexpected token when parsing tag. Expected end of tag, but found ${iterator.getCurrentChar()}`,
            iterator.getIndex()
        );

        return tagType;
    }

    return new LexerError(LexerErrorType.UnknownTag, `Unknown tag: ${currentChar}`, iterator.getIndex());
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

function parseProperty(iterator: LexerIterator): Record<string, string | number> | LexerError {
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
            if (LexerError.isLexerError(parsedIdentifier)) return parsedIdentifier;

            const identifier = parsedIdentifier.value;
            if (iterator.skipWhiteSpace() !== TagOperators[TagOperatorType.Equals]) {
                return new LexerError(LexerErrorType.UnexpectedToken, `Expected '=' after identifier, but found ${iterator.getCurrentChar()}`, iterator.getIndex());
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
            if (!parsedValue) return new LexerError(LexerErrorType.StringParsingError, `The tag property value is not a number or string.`, iterator.getIndex());

            if (shoudClose) {
                if (iterator.getCurrentChar() !== TagOperators[TagOperatorType.RightBrace]) {
                    return new LexerError(LexerErrorType.UnclosedTag, "Unclosed tag. Expected '}'.", iterator.getIndex());
                }
                iterator.next(); // skip "}"
            }

            properties[identifier] = parsedValue;
        } else {
            return new LexerError(
                LexerErrorType.UnexpectedToken,
                `Unexpected token when parsing tag. Expected identifier, but found ${iterator.getCurrentChar()}`,
                iterator.getIndex()
            );
        }
    }

    return properties;
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

