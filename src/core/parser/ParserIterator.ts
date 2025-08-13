import { Tokens, TokenType } from "../lexer/TokenType";
import { ParserContextStack } from "./ctx/ParserContext";
import { ParsedNode } from "./Node";

type ParserIteratorResult = [node: ParsedNode, token: Tokens];

export type ParserIterator = {
    getParsed(): ParserIteratorResult[];
    getContext(): ParserContextStack;
    getRemainingTokens(): Tokens[];

    push(node: ParsedNode, token: Tokens): void;
    popParsed(): ParserIteratorResult | null;
    popParsedIf(fn: (node: ParserIteratorResult) => boolean): ParserIteratorResult | null;
    peekParsed(offset?: number): ParserIteratorResult | null;

    getCurrentToken(): Tokens | null;
    peekToken(offset?: number): Tokens | null;
    popToken(): Tokens | null;
    popTokenIf(fn: (token: Tokens) => boolean): Tokens | null;
    consume(node?: ParsedNode): Tokens | null;

    getResult(): ParsedNode[];
    isDone(): boolean;
};

export function createParserIterator(tokens: Tokens[]): ParserIterator {
    const cache = [...tokens];
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
        // 1-based from current position for backward compatibility
        return cache[index + offset - 1] ?? null; 
    };
    const popToken = () => { 
        if (index >= cache.length) {
            return null;
        }
        const token = cache[index];
        index += 1;
        currentToken = cache[index] ?? null;
        return token ?? null;
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

    return {
        getParsed,
        getContext,
        getRemainingTokens,
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
