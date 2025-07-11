import { parseIdentifier } from "./Identifier";
import { KeywordType } from "./Keyword";
import type { LexerIterator } from "./LexerIterator";
import { parseBooleanLiteral, parseNullLiteral, parseNumberLiteral } from "./Literal";
import { getPossibleOperators, IdentifierStartCharacter, OperatorType, tryParseOperator, WhiteSpace } from "./Operator";
import { StringToken } from "./String";

export enum TokenType {
    NewLine,
    Operator,
    Identifier,
    NumberLiteral,
    BooleanLiteral,
    NullLiteral,
    Keyword,
    String,
}

export type Tokens =
    | { type: TokenType.NewLine }
    | { type: TokenType.Operator, value: OperatorType }
    | { type: TokenType.Identifier, value: string }
    | { type: TokenType.NumberLiteral, value: number }
    | { type: TokenType.BooleanLiteral, value: boolean }
    | { type: TokenType.NullLiteral }
    | { type: TokenType.Keyword, value: KeywordType }
    | { type: TokenType.String, value: StringToken }

export function parseToken(iterator: LexerIterator): Tokens | null {
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

    throw new SyntaxError(`Unexpected token: ${currentChar}`);
}
