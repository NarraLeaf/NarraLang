import { parseIdentifier } from "./Identifier";
import { LexerError } from "./LexerError";
import type { LexerIterator } from "./LexerIterator";
import { getPossibleKeywords, parseBooleanLiteral, parseNullLiteral, parseNumberLiteral, tryParseKeyword } from "./Literal";
import { getPossibleOperators, IdentifierStartCharacter, OperatorType, tryParseOperator, WhiteSpace } from "./Operator";
import { parseStringTokens, StringToken } from "./String";
import { TokenType, Tokens } from "./TokenType";

export function parseToken(iterator: LexerIterator): Tokens | LexerError | null {
    const currentChar = iterator.getCurrentChar();

    // Skip whitespace
    if (WhiteSpace.includes(currentChar)) {
        return iterator.next();
    }

    // NewLine
    if (currentChar === "\r") {
        // CRLF. Skip the current character (\r).
        if (iterator.peekChar() === "\n") {
            return iterator.next();
        }
        return iterator.consume({ type: TokenType.NewLine });
    }
    if (currentChar === "\n") {
        return iterator.consume({ type: TokenType.NewLine });
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
        if (operatorType) {
            return iterator.consume({ type: TokenType.Operator, value: operatorType });
        }
    }

    // Identifier
    if (IdentifierStartCharacter.test(currentChar)) {
        return parseIdentifier(iterator);
    }
    
    // Keyword
    const possibleKeywords = getPossibleKeywords(iterator);
    if (possibleKeywords.length > 0) {
        const keywordType = tryParseKeyword(possibleKeywords, iterator);
        if (keywordType) {
            return iterator.consume({ type: TokenType.Keyword, value: keywordType });
        }
    }

    // String
    const stringToken = parseStringTokens(iterator, { EOL: ["\r\n", "\n", "\r"] }, parseToken);
    if (stringToken) {
        if (LexerError.isLexerError(stringToken)) {
            return stringToken;
        }

        return {
            type: TokenType.String,
            value: stringToken,
        };
    }

    throw new SyntaxError(`Unexpected token: ${currentChar}`);
}
