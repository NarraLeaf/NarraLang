import { OperatorType } from "@/core/lexer/Operator";
import type { Tokens, TokensTypeOf } from "@/core/lexer/TokenType";
import { TokenType } from "@/core/lexer/TokenType";
import { ParserIterator } from "../ParserIterator";
import { KeywordType } from "@/core/lexer/Keyword";

// Comments in English
export type StopTokenMatcher = {
    type: TokenType;
    /** Optional subtype, e.g. OperatorType, KeywordType, etc. */
    value?: unknown;
};

export type ParseExpressionOptions = {
    /**
     * Stop when upcoming token matches any of these. Effective at top-level (outside () [] {})
     * by default; nested structures handle their own stops.
     */
    stopOn?: StopTokenMatcher[];

    /** Minimal binding power for Pratt parsing. */
    minBP?: number;

    /**
     * True if the expression is expected to be an identifier.  
     * Destructing assignment is supported.
     */
    identifier?: boolean;

    depth?: number;
};

// Basic atom token types that can start an expression without prefix operators
export const Atoms: TokenType[] = [
    TokenType.Identifier,
    TokenType.BooleanLiteral,
    TokenType.NullLiteral,
    TokenType.NumberLiteral,
    TokenType.String,
];

// Utility: match current token with stopOn definitions at this level
export function matchesStopOn(token: Tokens | null, stopOn?: StopTokenMatcher[]): boolean {
    if (!token || !stopOn || stopOn.length === 0) return false;
    return stopOn.some((matcher) => {
        if (token.type !== matcher.type) return false;
        if (typeof matcher.value === "undefined") return true;
        return (token as TokensTypeOf<TokenType.Operator>).value === matcher.value;
    });
}

// Utility: create trace object from tokens
export function createTrace(start: Tokens, end: Tokens | number | null) {
    return { start: start.start, end: end ? (typeof end === "number" ? end : end.end) : start.end } as const;
}

// Utility: try to consume a specific operator
export function consumeOperator(iterator: ParserIterator, type: OperatorType): Tokens | null {
    const t = iterator.getCurrentToken();
    if (t && t.type === TokenType.Operator && t.value === type) {
        return iterator.popToken();
    }
    return null;
}

// Utility: peek operator type if next token is an operator
export function peekOperatorType(iterator: ParserIterator): OperatorType | null {
    const t = iterator.getCurrentToken();
    if (!t || t.type !== TokenType.Operator) return null;
    return (t as TokensTypeOf<TokenType.Operator>).value as OperatorType;
}

export function peekKeywordType(iterator: ParserIterator): KeywordType | null {
    const t = iterator.getCurrentToken();
    if (!t || t.type !== TokenType.Keyword) return null;
    return (t as TokensTypeOf<TokenType.Keyword>).value as KeywordType;
}

// Utility: associativity, true means right-associative
export function isRightAssociative(op: OperatorType): boolean {
    switch (op) {
        case OperatorType.Exponent:
            return true;
        default:
            return false;
    }
}

export function resetBP(options: ParseExpressionOptions): ParseExpressionOptions {
    return {
        ...options,
        minBP: 0,
    };
}

export const MAX_DEPTH = 256;
