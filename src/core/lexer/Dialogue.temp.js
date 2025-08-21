"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDialogue = parseDialogue;
exports.parseCharacterName = parseCharacterName;
exports.isDialogue = isDialogue;
const Comment_1 = require("./Comment");
const LexerError_1 = require("./LexerError");
const LexerIterator_1 = require("./LexerIterator");
const Operator_1 = require("./Operator");
const String_1 = require("./String");
const Token_1 = require("./Token");
const TokenType_1 = require("./TokenType");
function parseDialogue(iterator, parseTokenFn) {
    if (!isDialogue(iterator)) {
        return null;
    }
    const startIndex = iterator.getIndex();
    const character = parseCharacterName(iterator, parseTokenFn);
    if (LexerError_1.LexerError.isLexerError(character)) {
        return character;
    }
    iterator.skipWhiteSpace(); // skip whitespace before the dialogue content
    if (iterator.getCurrentChar() === Operator_1.Operators[Operator_1.OperatorType.LeftBrace]) {
        const content = [];
        iterator.next(); // skip "{"
        while (!iterator.isDone()) {
            const currentChar = iterator.getCurrentChar();
            if (Operator_1.WhiteSpace.includes(currentChar)) {
                iterator.next();
                continue;
            }
            if (currentChar === Operator_1.Operators[Operator_1.OperatorType.RightBrace]) {
                iterator.next(); // skip "}"
                break;
            }
            if ((0, Comment_1.isNewLine)(iterator)) {
                iterator.next(); // skip new line
                continue;
            }
            if (iterator.getCurrentChar() !== "\"") {
                return new LexerError_1.LexerError(LexerError_1.LexerErrorType.UnexpectedToken, "Unexpected token when parsing dialogue. Got '\"'", iterator.getIndex());
            }
            const string = (0, String_1.parseStringTokens)(iterator, { EOS: ["\n", "\r", "\""] }, parseTokenFn);
            if (LexerError_1.LexerError.isLexerError(string)) {
                return string;
            }
            iterator.next(); // skip EOS
            content.push(string);
        }
        return {
            type: TokenType_1.TokenType.MultiLineDialogue,
            value: {
                character,
                content,
            },
            start: startIndex,
            end: iterator.getIndex() - 1,
        };
    }
    if (iterator.getCurrentChar() === "\"") {
        iterator.next(); // skip "
    }
    else {
        return new LexerError_1.LexerError(LexerError_1.LexerErrorType.UnexpectedToken, "Unexpected token when parsing dialogue.", iterator.getIndex());
    }
    const string = (0, String_1.parseStringTokens)(iterator, { EOS: ["\n", "\r", "\""] }, parseTokenFn);
    if (!string) {
        return new LexerError_1.LexerError(LexerError_1.LexerErrorType.StringParsingError, "Failed to parse string for dialogue.", iterator.getIndex());
    }
    if (LexerError_1.LexerError.isLexerError(string)) {
        return string;
    }
    iterator.next(); // skip EOS
    return {
        type: TokenType_1.TokenType.Dialogue,
        value: {
            character,
            content: string,
        },
        start: startIndex,
        end: iterator.getIndex() - 1,
    };
}
function parseCharacterName(iterator, parseTokenFn) {
    const charNameExpression = [];
    while (!iterator.isDone()) {
        const currentChar = iterator.getCurrentChar();
        if (Operator_1.WhiteSpace.includes(currentChar)) {
            iterator.next();
            continue;
        }
        if ((0, Comment_1.isNewLine)(iterator)) {
            return new LexerError_1.LexerError(LexerError_1.LexerErrorType.UnexpectedNewLine, "Unexpected new line. This should not happen.", iterator.getIndex());
        }
        if (currentChar === Operator_1.Operators[Operator_1.OperatorType.Colon]) {
            iterator.next(); // skip ":"
            break;
        }
        const token = parseTokenFn(iterator, { allowDialogue: false });
        if (LexerError_1.LexerError.isLexerError(token)) {
            return token;
        }
        else if (token !== null) {
            charNameExpression.push(token);
        }
    }
    return charNameExpression;
}
function isDialogue(iterator) {
    const startIndex = iterator.getIndex();
    const text = iterator.getRaw();
    // check if the text is on its own line
    let lineStartIndex = startIndex;
    while (lineStartIndex > 0) {
        const prevChar = text[lineStartIndex - 1];
        if (prevChar === "\n" || prevChar === "\r") {
            break;
        }
        lineStartIndex--;
    }
    let hasNonWhitespaceBefore = false;
    for (let i = lineStartIndex; i < startIndex; i++) {
        if (!Operator_1.WhiteSpace.includes(text[i])) {
            hasNonWhitespaceBefore = true;
            break;
        }
    }
    if (hasNonWhitespaceBefore) {
        return false;
    }
    // Find the colon position
    let colonIndex = -1;
    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];
        if ((0, Comment_1.isNewLineAtIndex)(iterator, i)) {
            return false;
        }
        if (char === Operator_1.Operators[Operator_1.OperatorType.Colon]) {
            colonIndex = i;
            break;
        }
    }
    if (colonIndex === -1 || colonIndex >= text.length - 1) {
        return false;
    }
    // Extra check: the content after the colon must be a double quote or { new line double quote
    let j = colonIndex + 1;
    while (j < text.length && Operator_1.WhiteSpace.includes(text[j]))
        j++;
    const afterColon = text[j];
    if (afterColon === "\"") {
        // OK: single line dialogue
    }
    else if (afterColon === "{") {
        // Validate multi-line dialogue format
        if (!validateMultiLineDialogue(text, j, iterator)) {
            return false;
        }
    }
    else {
        return false; // not a valid dialogue start
    }
    // Check if there's exactly one token before the colon
    const charNameText = text.slice(startIndex, colonIndex);
    const tempIterator = (0, LexerIterator_1.createLexerIterator)(charNameText);
    let tokenCount = 0;
    while (!tempIterator.isDone()) {
        const currentChar = tempIterator.getCurrentChar();
        if (Operator_1.WhiteSpace.includes(currentChar)) {
            tempIterator.next();
            continue;
        }
        const token = (0, Token_1.parseToken)(tempIterator, { allowDialogue: false });
        if (LexerError_1.LexerError.isLexerError(token)) {
            return false;
        }
        if (token === null) {
            continue;
        }
        tokenCount++;
        if (tokenCount > 1) {
            return false;
        }
    }
    return tokenCount === 1;
}
/**
 * Validates multi-line dialogue format to ensure each line only contains one pair of double quotes
 * and no other symbols outside the quotes (except whitespace)
 */
function validateMultiLineDialogue(text, braceIndex, iterator) {
    let k = braceIndex + 1;
    // Skip whitespace after opening brace
    while (k < text.length && Operator_1.WhiteSpace.includes(text[k]))
        k++;
    // Must be followed by a new line
    if (!(0, Comment_1.isNewLineAtIndex)(iterator, k))
        return false;
    k++;
    // Process each line within the braces
    while (k < text.length) {
        // Skip leading whitespace on the line
        while (k < text.length && Operator_1.WhiteSpace.includes(text[k]))
            k++;
        // Check for closing brace
        if (text[k] === Operator_1.Operators[Operator_1.OperatorType.RightBrace]) {
            break; // Valid end of multi-line dialogue
        }
        // Each content line must start with a double quote
        if (text[k] !== "\"") {
            return false;
        }
        k++; // Skip opening quote
        let foundClosingQuote = false;
        // Find the closing quote on this line
        while (k < text.length && !(0, Comment_1.isNewLineAtIndex)(iterator, k)) {
            if (text[k] === "\"") {
                foundClosingQuote = true;
                k++; // Skip closing quote
                break;
            }
            k++;
        }
        if (!foundClosingQuote) {
            return false; // No closing quote found on this line
        }
        // Validate that there are no non-whitespace characters after the closing quote on this line
        while (k < text.length && !(0, Comment_1.isNewLineAtIndex)(iterator, k)) {
            if (!Operator_1.WhiteSpace.includes(text[k])) {
                return false; // Found non-whitespace character after closing quote
            }
            k++;
        }
        // Skip the new line character(s)
        if ((0, Comment_1.isNewLineAtIndex)(iterator, k)) {
            k++;
            // Handle \r\n case
            if (k < text.length && text[k - 1] === '\r' && text[k] === '\n') {
                k++;
            }
        }
    }
    return true;
}
