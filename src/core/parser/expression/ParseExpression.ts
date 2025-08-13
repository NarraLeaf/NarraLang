import { ExpressionNode } from "../Node";
import { ParserIterator } from "../ParserIterator";
import type { Tokens as _Tokens } from "@/core/lexer/TokenType";
import { TokenType } from "@/core/lexer/TokenType";

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
};


export function parseExpression(_iterator: ParserIterator, _options?: ParseExpressionOptions): ExpressionNode | null {
    throw new Error("Not implemented");
}
