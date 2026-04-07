import { WhiteSpace } from "./Operator";

export type LexerIterator = {
    /**
     * Get the character at the current cursor position.
     * @throws Error if the cursor is at the end of the input.
     */
    getCurrentChar(): string;

    /**
     * Peek a single character ahead of the cursor without consuming it.
     * @param offset How many characters ahead to peek (default: `1`).
     * @returns The character at `index + offset`.
     */
    peekChar(offset?: number): string;

    /**
     * Peek `n` characters starting from `index + offset` without consuming them.
     * @param n     Number of characters to peek.
     * @param offset Optional start offset relative to the current index (default: `0`).
     * @returns A substring of length `n`.
     */
    peek(n: number, offset?: number): string;

    /**
     * Return substring starting from `index + offset` **up to but excluding** the position
     * where the `stop` condition is met.
     *
     * The stop condition can be:
     * 1. A delimiter character (string of length ≥ 1)
     * 2. A predicate callback `(char, idx, collected) => boolean` returning `true` when the scan should stop.
     *
     * If the delimiter / predicate is not encountered the method returns `null`.
     * @param stop   Delimiter string **OR** predicate function.
     * @param offset Optional start offset relative to the current index (default: `0`).
     */
    peekUntil(stop: string | ((char: string, index: number, collected: string) => boolean), offset?: number): string | null;

    /**
     * Advance the cursor by `n` characters (default: `1`).
     * @param n How many characters to skip.
     */
    next(n?: number): null;

    /**
     * Advance the cursor **without consuming** the character where the `stop` condition is met.
     * Accepts the same stop conditions as `peekUntil`.
     * @param stop Delimiter string **OR** predicate function.
     * @param eofAsSuccess Optional flag to treat EOF as a successful stop condition.
     * @returns `true` if the cursor was moved, otherwise `false`.
     */
    nextUntil(
        stop: string | ((char: string, index: number, collected: string) => boolean),
        eofAsSuccess?: boolean,
    ): boolean;

    /**
     * Determine whether the cursor has passed the end of the input.
     * @returns `true` if there are no more characters to read.
     */
    isDone(): boolean;

    /**
     * Consume the current character and return the given value.
     * @param value The value to return.
     * @returns The given value.
     */
    consume<T>(value: T): T;

    /**
     * Skip all whitespace characters.
     * @returns The current character after skipping whitespace.
     */
    skipWhiteSpace(): string;

    /**
     * Get the current index of the cursor.
     * @returns The current index of the cursor.
     */
    getIndex(): number;

    /**
     * Get the raw string.
     * @returns The raw string.
     */
    getRaw(): string;

    /**
     * Get the line content at the given line number.
     * @param n The line number to get.
     * @returns The line content at the given line number.
     */
    getLine(n: number): string;

    /**
     * Get the character at the given index.
     * @param index The index of the character to get.
     * @returns The character at the given index.
     */
    getCharAt(index: number): string;
};

export function createLexerIterator(raw: string): LexerIterator {
    let index = 0;

    const getCurrentChar = () => {
        if (index >= raw.length) throw new Error("Cursor is at the end of the input.");
        return raw[index];
    };
    const peekChar = (offset = 1) => raw[index + offset];
    const peek = (n: number, offset = 0) => raw.slice(index + offset, index + offset + n);
    const peekUntil = (
        stop: string | ((char: string, index: number, collected: string) => boolean),
        offset = 0,
    ): string | null => {
        const start = index + offset;

        if (typeof stop === "string") {
            const end = raw.indexOf(stop, start);
            return end === -1 ? null : raw.slice(start, end);
        }

        // Predicate version
        let i = start;
        while (i < raw.length) {
            const ch = raw[i];
            const collected = raw.slice(start, i);
            if (stop(ch, i, collected)) {
                return collected;
            }
            i++;
        }
        return raw.slice(start);
    };

    const next = (n: number = 1) => {
        index += n;
        return null;
    };
    const nextUntil = (stop: string | ((char: string, index: number, collected: string) => boolean), eofAsSuccess: boolean = true) => {
        const start = index;

        if (typeof stop === "string") {
            const end = raw.indexOf(stop, start);
            if (end === -1) {
                if (eofAsSuccess) {
                    index = raw.length;
                    return true;
                }
                return false;
            }
            index = end;
            return true;
        }

        let i = start;
        while (i < raw.length) {
            const collected = raw.slice(start, i);
            if (stop(raw[i], i, collected)) {
                index = i;
                return true;
            }
            i++;
        }
        if (eofAsSuccess) {
            index = raw.length;
            return true;
        }
        return false;
    };
    const isDone = () => index >= raw.length;
    const consume = <T>(value: T): T => {
        index++;
        return value;
    };
    const skipWhiteSpace = () => {
        while (WhiteSpace.includes(raw[index])) {
            index++;
        }
        return raw[index];
    };
    const getIndex = () => index;
    const getRaw = () => raw;
    const getLine = (n: number) => raw.slice(0, index).split("\n")[n];
    const getCharAt = (index: number) => raw[index];

    return {
        getCurrentChar,
        peekChar,
        peek,
        peekUntil,
        
        next,
        nextUntil,
        isDone,
        consume,
        skipWhiteSpace,
        getIndex,
        getRaw,
        getLine,
        getCharAt,
    };
}
