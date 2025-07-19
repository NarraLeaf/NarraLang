
export enum LexerErrorType {
    UnexpectedToken = "UnexpectedToken",
    UnclosedExpression = "UnclosedExpression",
    UnclosedString = "UnclosedString",
}

export class LexerError extends Error {
    public type: LexerErrorType;
    public index: number;

    public static isLexerError(error: unknown): error is LexerError {
        return error instanceof LexerError;
    }

    constructor(type: LexerErrorType, message: string, index: number) {
        super(message);

        this.name = "LexerError";
        this.type = type;
        this.index = index;
    }

    public getLine(raw: string): number {
        return raw.slice(0, this.index).split("\n").length;
    }

    public getInlineOffset(raw: string): number {
        return raw.slice(0, this.index).split("\n").at(-1)?.length ?? 0;
    }

    public getLineInfo(raw: string): {
        line: number;
        offset: number;
        lineContent: string;
    } {
        const line = this.getLine(raw);
        const offset = this.getInlineOffset(raw);
        const lineContent = raw.split("\n")[line];

        return {
            line,
            offset,
            lineContent,
        };
    }

    public toError(raw: string): Error {
        const { line, offset, lineContent } = this.getLineInfo(raw);
        const error = new Error(`${this.message} (line ${line}, offset ${offset})`);

        error.stack = `${error.stack}\n${lineContent}\n${" ".repeat(offset)}^`;
        error.name = this.type.toString();

        return error;
    }
}

