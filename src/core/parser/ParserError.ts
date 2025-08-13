import { Tokens } from "../lexer/TokenType";


export enum ParserErrorType {
    ExpectedVariableDeclaration = "ExpectedVariableDeclaration",
    ExpectedIdentifier = "ExpectedIdentifier",

    UnexpectedToken = "UnexpectedToken",
    ExpectedExpression = "ExpectedExpression",
    InvalidVariableDeclaration = "InvalidVariableDeclaration",
}

export class ParserError extends Error {
    public type: ParserErrorType;
    /**
     * An ParserError without a position means that the error is at the end of the file.
     */
    public pos: { start: number; end: number } | null;

    constructor(type: ParserErrorType, message: string, pos?: Tokens | { start: number; end: number } | null) {
        super(message);

        this.name = "ParserError";
        this.type = type;
        this.pos = pos ? { start: pos.start, end: pos.end } : null;
    }

    public setPos(pos?: Tokens | { start: number; end: number } | null): this {
        if (pos) {
            this.pos = { start: pos.start, end: pos.end };
        }

        return this;
    }
}
