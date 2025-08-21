import { NamedColor, NamedColors } from "../utils/constant";
import { HexString } from "../utils/type";
import { parseIdentifier } from "./Identifier";
import { LexerError, LexerErrorType } from "./LexerError";
import { LexerIterator } from "./LexerIterator";
import { parseNumberLiteral, parseBooleanLiteral } from "./Literal";
import { EscapeCharacter, HexColorCharacter, HexDigitCharacter, IdentifierStartCharacter, LanguageCharacter, UnicodeCodePointCharacter, WhiteSpace } from "./Operator";
import { EndOfFile, ParseTokenFn, type Tokens, TokenType } from "./TokenType";

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
    | { type: StringTokenType.CloseTag, value: Exclude<StringTagType, StringTagType.HexColor> | string | null };
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
};

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
};

export type StringTag = RawStringTag & {
    properties: Record<string, string | number | boolean> | null,
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
    EOS: (string | typeof EndOfFile)[],
}

export function parseStringTokens(
    iterator: LexerIterator,
    { EOS }: StringParserConfig,
    parseTokenFn: ParseTokenFn,
): StringToken[] | LexerError {
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
    };

    while (!iterator.isDone()) {
        const currentChar = iterator.getCurrentChar();
        if (EOS.includes(currentChar)) {
            pushCache();
            return tokens;
        }

        if (EscapeCharacter.test(currentChar)) {
            const escaped = tryEscape(iterator);
            if (LexerError.isLexerError(escaped)) return escaped;
            if (!escaped) return new LexerError(LexerErrorType.InvalidEscapeSequence, `Invalid escape sequence: ${currentChar}`, iterator.getIndex());

            stringCache += escaped.value;
            continue;
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
            if (LexerError.isLexerError(token)) return token;

            tokens.push(token);
            continue;
        }

        if (currentChar === TagOperators[TagOperatorType.LeftBrace]) {
            const expressionTokens: Tokens[] = [];
            let closed = false;

            iterator.next(); // skip "{", so it will not be parsed as an operator

            while (!iterator.isDone()) {
                const currentChar = iterator.getCurrentChar();
                if (currentChar === TagOperators[TagOperatorType.RightBrace]) {
                    iterator.next(); // skip "}"
                    closed = true;
                    break;
                }

                const token = parseTokenFn(iterator, { allowDialogue: false });
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

        return new LexerError(LexerErrorType.UnexpectedToken, `Unexpected token when parsing string: ${currentChar}`, iterator.getIndex());
    }

    if (EOS.includes(EndOfFile)) {
        return tokens;
    }

    return new LexerError(LexerErrorType.UnclosedString, `Unclosed string. ${EOS.map((eol) => JSON.stringify(eol)).join(", ")} expected, but found the end of script. StringCache: ${JSON.stringify(stringCache)}`, iterator.getIndex() - 1);
}

function tryParseTag(iterator: LexerIterator): StringToken | LexerError {
    const currentChar = iterator.getCurrentChar();
    if (currentChar !== TagOperators[TagOperatorType.LeftAngleBracket]) {
        return new LexerError(LexerErrorType.UnexpectedToken, `Unexpected token when parsing tag. Expected '<', but found ${currentChar}`, iterator.getIndex());
    }
    iterator.next(); // skip "<"

    iterator.skipWhiteSpace(); // skip whitespace
    if (iterator.getCurrentChar() === TagOperators[TagOperatorType.Slash]) {
        iterator.next(); // skip "/"
        iterator.skipWhiteSpace(); // skip whitespace

        // Parse optional tag name for close tag
        let tagName: string | null = null;
        if (LanguageCharacter.test(iterator.getCurrentChar())) {
            const parsedTagName = iterator.peekUntil((char) => {
                if (!LanguageCharacter.test(char)) {
                    return true;
                }
                return false;
            });
            if (parsedTagName?.length) {
                tagName = parsedTagName;
                iterator.next(parsedTagName.length); // skip tagName
                iterator.skipWhiteSpace(); // skip whitespace
            }
        }

        if (iterator.getCurrentChar() !== TagOperators[TagOperatorType.RightAngleBracket]) {
            return new LexerError(LexerErrorType.UnclosedTag, "Unclosed tag. Expected '>'.", iterator.getIndex());
        }
        iterator.next(); // skip ">"

        if (tagName) {
            const tagType = getTagType(tagName);
            if (!tagType) return new LexerError(LexerErrorType.UnknownTag, `Unknown tag: ${tagName}`, iterator.getIndex());

            if (tagType.type === StringTagType.HexColor) {
                return new LexerError(LexerErrorType.UnexpectedToken, `Unexpected token when parsing tag. Expected end of tag, but found ${iterator.getCurrentChar()}`, iterator.getIndex());
            }

            return {
                type: StringTokenType.CloseTag,
                value: tagType.type === StringTagType.NamedColor ? tagType.value : tagType.type,
            };
        }

        return {
            type: StringTokenType.CloseTag,
            value: null,
        };
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
        let hexColor = "";
        
        while (!iterator.isDone()) {
            const char = iterator.getCurrentChar();
            if (!HexDigitCharacter.test(char)) {
                break;
            }
            hexColor += char;
            iterator.next();
        }
        
        if (!hexColor.length) {
            return new LexerError(
                LexerErrorType.UnexpectedToken,
                `Unexpected token when parsing tag. Expected hex color, but found ${iterator.getCurrentChar()}`,
                iterator.getIndex()
            );
        }
        
        const fullHexColor = `#${hexColor}`;
        if (!HexColorCharacter.test(fullHexColor)) {
            return new LexerError(
                LexerErrorType.UnexpectedToken,
                `Invalid hex color format: ${fullHexColor}`,
                iterator.getIndex()
            );
        }
        
        if (![
            ...WhiteSpace,
            TagOperators[TagOperatorType.RightAngleBracket],
            TagOperators[TagOperatorType.Slash],
        ].includes(iterator.getCurrentChar())) {
            return new LexerError(
                LexerErrorType.UnexpectedToken,
                `Unexpected token when parsing tag. Expected end of tag, but found ${iterator.getCurrentChar()}`,
                iterator.getIndex()
            );
        }

        return { type: StringTagType.HexColor, value: fullHexColor as HexString };
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

function parseProperty(iterator: LexerIterator): Record<string, string | number | boolean> | LexerError {
    const properties: Record<string, string | number | boolean> = {};

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

            const shoudClose = iterator.getCurrentChar() === TagOperators[TagOperatorType.LeftBrace];
            if (shoudClose) {
                iterator.next(); // skip "{"
            }

            let parsedValue: number | string | boolean | null = parseNumberLiteral(iterator)?.value ?? null;
            if (parsedValue === null) {
                // Try parsing boolean literal
                const booleanToken = parseBooleanLiteral(iterator);
                if (booleanToken && booleanToken.type === TokenType.BooleanLiteral) {
                    parsedValue = booleanToken.value;
                }
            }
            if (parsedValue === null) {
                if (QuotationMarks.includes(iterator.getCurrentChar())) {
                    const quote = iterator.getCurrentChar();
                    const flowed = flowString(iterator, [quote], quote);

                    if (LexerError.isLexerError(flowed)) return flowed;
                    if (flowed === null) {
                        return new LexerError(LexerErrorType.StringParsingError, "Unclosed string in tag property.", iterator.getIndex());
                    }
                    parsedValue = flowed;
                }
            }
            if (parsedValue === null) return new LexerError(LexerErrorType.StringParsingError, "The tag property value is not a literal.", iterator.getIndex());

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

function flowString(iterator: LexerIterator, startChar: string[] | null, endChar: string): string | null | LexerError {
    let char: string = "";

    if (startChar && !startChar.includes(iterator.getCurrentChar())) {
        return new LexerError(LexerErrorType.UnknownError, `Unknown error when parsing string: ${iterator.getCurrentChar()}`, iterator.getIndex());
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
            if (LexerError.isLexerError(escaped)) return escaped;
            if (!escaped) return new LexerError(LexerErrorType.InvalidEscapeSequence, `Invalid escape sequence: ${currentChar}`, iterator.getIndex());

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
} | null | LexerError {
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
            return new LexerError(LexerErrorType.InvalidUnicodeCodePoint, `Invalid unicode code point: ${iterator.getCurrentChar()}`, iterator.getIndex());
        }
        iterator.next(); // skip "{"

        let codepoint = "";
        
        while (!iterator.isDone()) {
            const char = iterator.getCurrentChar();
            if (!UnicodeCodePointCharacter.test(char)) {
                break;
            }
            codepoint += char;
            iterator.next();
        }
        
        if (!codepoint.length || codepoint.length > 6) {
            return new LexerError(LexerErrorType.InvalidUnicodeCodePoint, `Invalid unicode code point: ${codepoint}`, iterator.getIndex());
        }

        if (iterator.getCurrentChar() !== TagOperators[TagOperatorType.RightBrace]) {
            return new LexerError(LexerErrorType.InvalidUnicodeCodePoint, `Invalid unicode code point: ${codepoint}`, iterator.getIndex());
        }
        iterator.next(); // skip "}"
        
        const codePointValue = parseInt(codepoint, 16);
        if (isNaN(codePointValue) || codePointValue > 0x10FFFF) {
            return new LexerError(LexerErrorType.InvalidUnicodeCodePoint, `Invalid unicode code point: ${codepoint}`, iterator.getIndex());
        }
        
        return { type: StringTokenType.String, value: String.fromCodePoint(codePointValue) };
    }

    return new LexerError(LexerErrorType.InvalidEscapeSequence, `Invalid escape sequence: ${currentChar}`, iterator.getIndex());
}

