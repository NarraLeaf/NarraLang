import { Tokens, TokenType } from "../lexer/TokenType";
import { ParserContextStack } from "./ctx/ParserContext";
import { ParsedNode } from "./Node";

type ParserIteratorResult = [node: ParsedNode, token: Tokens];

/**
 * Saved parser state for backtracking
 */
export type ParserIteratorState = {
    index: number;
    resultLength: number;
};

export type ParserIterator = {
    getParsed(): ParserIteratorResult[];
    getContext(): ParserContextStack;
    getRemainingTokens(): Tokens[];
    getPreviousToken(): Tokens | null;

    push(node: ParsedNode, token: Tokens): void;
    popParsed(): ParserIteratorResult | null;
    popParsedIf(fn: (node: ParserIteratorResult) => boolean): ParserIteratorResult | null;
    peekParsed(offset?: number): ParserIteratorResult | null;

    getCurrentToken(): Tokens | null;
    peekToken(offset?: number): Tokens | null;
    popToken(ignores?: TokenType[]): Tokens | null;
    popTokenIf(fn: (token: Tokens) => boolean): Tokens | null;
    consume(node?: ParsedNode): Tokens | null;

    getResult(): ParsedNode[];
    isDone(): boolean;

    // Backtracking support for lookahead
    save(): ParserIteratorState;
    restore(state: ParserIteratorState): void;

    // utils
    skipNewLine(): void;
};

export function createParserIterator(tokens: Tokens[]): ParserIterator {
    const cache: Readonly<Tokens[]> = [...tokens];
    const ctx = new ParserContextStack();
    const result: ParserIteratorResult[] = [];

    let index = 0;
    let currentToken: Tokens | null = cache[index] ?? null;

    const getParsed = () => { return result; };
    const getContext = () => { return ctx; };
    const getRemainingTokens = () => { return cache.slice(index); };

    const push = (node: ParsedNode, token: Tokens) => {
        result.push([node, token]);
    };
    const popParsed = () => {
        return result.pop() ?? null;
    };
    const popParsedIf = (fn: (node: ParserIteratorResult) => boolean) => {
        const last = result.at(-1);
        if (!last) {
            return null;
        }
        if (fn(last)) {
            return result.pop() ?? null;
        }

        return null;
    };
    const peekParsed = (offset: number = 1) => {
        return result.at(-offset) ?? null;
    };

    const getCurrentToken = () => { return currentToken; };
    const peekToken = (offset: number = 1) => {
        return cache[index + offset] ?? null; 
    };
    const popToken = (ignores?: TokenType[]) => { 
        if (index >= cache.length) {
            return null;
        }

        // If no ignores specified, use original simple logic
        if (!ignores || ignores.length === 0) {
            const token = cache[index];
            index += 1;
            currentToken = cache[index] ?? null;
            return token ?? null;
        }

        // Handle ignores case
        while (index < cache.length) {
            const token = cache[index];
            index += 1;

            if (!ignores.includes(token.type)) {
                currentToken = cache[index] ?? null;
                return token;
            }
        }

        // All remaining tokens were ignored, update currentToken to null
        currentToken = null;
        return null;
    };
    const popTokenIf = (fn: (token: Tokens) => boolean) => {
        const peek = peekToken();
        if (!peek) {
            return null;
        }
        if (fn(peek)) {
            return popToken();
        }

        return null;
    };
    const consume = (node?: ParsedNode) => {
        if (!currentToken) {
            throw new Error("No current token to consume");
        }

        const consumedToken = currentToken;

        if (node) {
            result.push([node, consumedToken]);
        }

        // Move to next token using pointer
        index += 1;
        currentToken = cache[index] ?? null;

        return consumedToken;
    };

    const getResult = () => {
        return result.map(([node]) => node);
    };

    const isDone = () => {
        return index >= cache.length;
    };

    const skipNewLine = () => {
        while (currentToken && currentToken.type === TokenType.NewLine) {
            popToken();
        }
    };

    const getPreviousToken = () => {
        if (index <= 0) {
            return null;
        }
        return cache[index - 1] ?? null;
    };

    /**
     * Save current parser state for backtracking
     * Returns a state object that can be used with restore()
     */
    const save = (): ParserIteratorState => {
        return {
            index,
            resultLength: result.length,
        };
    };

    /**
     * Restore parser state from a saved state
     * This allows backtracking when parsing fails or lookahead is needed
     */
    const restore = (state: ParserIteratorState) => {
        index = state.index;
        currentToken = cache[index] ?? null;
        // Truncate result array to saved length
        result.length = state.resultLength;
    };

    return {
        getParsed,
        getContext,
        getRemainingTokens,
        getPreviousToken,
        push,
        popParsed,
        popParsedIf,
        peekParsed,
        getCurrentToken,
        peekToken,
        popToken,
        popTokenIf,
        consume,
        getResult,
        isDone,
        save,
        restore,
        skipNewLine,
    };
}

export function filterComment(tokens: Tokens[]): {
    tokens: Tokens[];
    comments: Tokens[];
} {
    const comments: Tokens[] = [];
    const filteredTokens: Tokens[] = [];

    for (const token of tokens) {
        if (token.type === TokenType.Comment) {
            comments.push(token);
        } else {
            filteredTokens.push(token);
        }
    }
    return { tokens: filteredTokens, comments };
}
