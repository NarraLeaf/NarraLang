import { isNewLine, parseComment } from "./Comment";
import { parseDialogue } from "./Dialogue";
import { parseIdentifier } from "./Identifier";
import { Keywords } from "./Keyword";
import { LexerError, LexerErrorType } from "./LexerError";
import type { LexerIterator } from "./LexerIterator";
import { getPossibleKeywords, parseBooleanLiteral, parseNullLiteral, parseNumberLiteral, tryParseKeyword } from "./Literal";
import { getPossibleOperators, IdentifierStartCharacter, Operators, tryParseOperator, WhiteSpace } from "./Operator";
import { parseStringTokens, QuotationMarks } from "./String";
import { ParseTokenFn, ParseTokenFnOptions, Tokens, TokenType } from "./TokenType";

const defaultOptions: ParseTokenFnOptions = {
    allowDialogue: true,
};
const buildTokenParser = (options: ParseTokenFnOptions): ParseTokenFn => {
    return (iterator, opt) => parseToken(iterator, { ...options, ...opt });
};

export function parseToken(iterator: LexerIterator, opt?: ParseTokenFnOptions): Tokens | LexerError | null {
    const options = { ...defaultOptions, ...opt };
    const parser = buildTokenParser(options);
    const currentChar = iterator.getCurrentChar();
    const startIndex = iterator.getIndex();

    // Skip whitespace
    if (WhiteSpace.includes(currentChar)) {
        return iterator.next();
    }

    // Comment
    const commentToken = parseComment(iterator);
    if (commentToken) {
        return commentToken;
    }

    // NewLine
    const newLine = isNewLine(iterator);
    if (newLine > 0) {
        iterator.next(newLine);
        return { type: TokenType.NewLine, start: startIndex, end: startIndex + newLine - 1 };
    }

    // Dialogue
    if (options.allowDialogue) {
        const dialogueToken = parseDialogue(iterator, parser);
        if (dialogueToken) {
            return dialogueToken;
        }
    }

    // Number Literal
    const numberToken = parseNumberLiteral(iterator);
    if (numberToken) {
        return numberToken;
    }

    // Boolean Literal
    const booleanToken = parseBooleanLiteral(iterator);
    if (booleanToken) {
        return booleanToken;
    }

    // Null Literal
    const nullToken = parseNullLiteral(iterator);
    if (nullToken) {
        return nullToken;
    }

    // Operator
    const possibleOperators = getPossibleOperators(iterator);
    if (possibleOperators.length > 0) {
        const operatorType = tryParseOperator(possibleOperators, iterator);
        if (operatorType !== null) {
            return { type: TokenType.Operator, value: operatorType, start: startIndex, end: startIndex + Operators[operatorType].length - 1 };
        }
    }

    // Keyword
    const possibleKeywords = getPossibleKeywords(iterator);
    if (possibleKeywords.length > 0) {
        const keywordType = tryParseKeyword(possibleKeywords, iterator);
        if (keywordType !== null) {
            return {
                type: TokenType.Keyword,
                value: keywordType,
                start: startIndex,
                end: startIndex + Keywords[keywordType].length - 1,
            };
        }
    }

    // Identifier
    if (IdentifierStartCharacter.test(currentChar)) {
        return parseIdentifier(iterator);
    }

    // String
    if (QuotationMarks.includes(currentChar)) {
        const quotationMark = currentChar;
        iterator.next(); // Skip the quotation mark.

        const stringToken = parseStringTokens(iterator, { EOS: [quotationMark] }, parser);
        if (stringToken) {
            if (LexerError.isLexerError(stringToken)) {
                return stringToken;
            }

            return {
                type: TokenType.String,
                value: stringToken,
                start: startIndex,
                end: iterator.getIndex() - 1,
            };
        }
    }

    return new LexerError(LexerErrorType.UnexpectedToken, `Unexpected token: ${JSON.stringify(currentChar)}`, iterator.getIndex());
}
