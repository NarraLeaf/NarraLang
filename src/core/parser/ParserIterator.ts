import { Tokens } from "../lexer/TokenType";
import { ParserContextStack } from "./ctx/ParserContext";
import { ParsedNode } from "./Node";

type ParserIteratorResult = [node: ParsedNode, token: Tokens];

export type ParserIterator = {
    getParsed(): ParserIteratorResult[];
    getContext(): ParserContextStack;
    getTokens(): Tokens[];

    push(node: ParsedNode, token: Tokens): void;
    popParsed(): ParserIteratorResult | null;
    popParsedIf(fn: (node: ParserIteratorResult) => boolean): ParserIteratorResult | null;
    peekParsed(offset?: number): ParserIteratorResult | null;

    getCurrentToken(): Tokens | null;
    peekToken(offset?: number): Tokens | null;
    popToken(): Tokens | null;
    popTokenIf(fn: (token: Tokens) => boolean): Tokens | null;
    consume(node: ParsedNode): void;

    getResult(): ParsedNode[];
};

export function createParserIterator(tokens: Tokens[]): ParserIterator {
    const cache = [...tokens];
    const ctx = new ParserContextStack();
    const result: ParserIteratorResult[] = [];

    let currentToken: Tokens | null = null;
    const updateCurrentToken = () => {
        currentToken = cache.at(-1) ?? null;
    };

    const getParsed = () => { return result; };
    const getContext = () => { return ctx; };
    const getTokens = () => { return cache; };

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
    const peekToken = (offset: number = 1) => { return cache.at(-offset) ?? null; };
    const popToken = () => { return cache.pop() ?? null; };
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
    const consume = (node: ParsedNode) => {
        if (!currentToken) {
            throw new Error("No current token");
        }

        result.push([node, currentToken]);
        updateCurrentToken();
    };

    const getResult = () => {
        return result.map(([node]) => node);
    };

    return {
        getParsed,
        getContext,
        getTokens,
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
    };
}
