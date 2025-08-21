import { Tokens } from "../lexer/TokenType";
import { ParsedNode, StatementNode } from "./Node";
import { createParserIterator, filterComment } from "./ParserIterator";
import { parseStatement } from "./statement";
import { ParserError } from "./ParserError";

/**
 * Parse options for parser
 */
export interface ParseOptions {
    /** Source code text for enhanced error reporting */
    sourceText?: string;
    /** Enable enhanced error reporting with line information */
    enhancedErrors?: boolean;
}

/**
 * Parse result containing AST and enhanced error handling
 */
export interface ParseResult {
    /** Parsed AST nodes */
    nodes: ParsedNode[];
    /** Source text used for parsing (for error reporting) */
    sourceText?: string;
    /** Create enhanced error from ParserError */
    createError?: (error: ParserError) => Error;
}

/**
 * Parse tokens into AST
 * @param tokens Array of tokens to parse
 * @param options Parse options including source text for error reporting
 * @returns Parse result with AST and error handling utilities
 */
export function parse(tokens: Tokens[], options?: ParseOptions): ParseResult {
    const { tokens: filteredTokens } = filterComment(tokens);
    const iterator = createParserIterator(filteredTokens);
    const result: StatementNode[] = [];

    // Create error helper if source text is provided
    const createError = options?.sourceText && options?.enhancedErrors
        ? (error: ParserError) => error.toError(options.sourceText!)
        : undefined;

    while (!iterator.isDone()) {
        try {
            const statement = parseStatement(iterator);
            if (statement) {
                result.push(statement);
            }
        } catch (error) {
            // Re-throw enhanced error if available
            if (ParserError.isParserError(error) && createError) {
                throw createError(error);
            }
            throw error;
        }
    }

    return {
        nodes: result,
        sourceText: options?.sourceText,
        createError,
    };
}

/**
 * Simple parse function that returns only the AST (backward compatibility)
 * @param tokens Array of tokens to parse
 * @returns Parsed AST nodes
 */
export function parseSimple(tokens: Tokens[]): ParsedNode[] {
    return parse(tokens).nodes;
}
