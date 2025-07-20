import { OperatorType } from "./Operator";
import { KeywordType } from "./Keyword";
import type { StringToken } from "./String";
import { LexerIterator } from "./LexerIterator";
import { LexerError } from "./LexerError";
import { DialogueToken } from "./Dialogue";

export enum TokenType {
    NewLine = "NewLine",
    Operator = "Operator",
    Identifier = "Identifier",
    NumberLiteral = "NumberLiteral",
    BooleanLiteral = "BooleanLiteral",
    NullLiteral = "NullLiteral",
    Keyword = "Keyword",
    String = "String",
    Comment = "Comment",
    Dialogue = "Dialogue",
}

export type TokensValue =
    | { type: TokenType.NewLine }
    | { type: TokenType.Operator; value: OperatorType }
    | { type: TokenType.Identifier; value: string }
    | { type: TokenType.NumberLiteral; value: number }
    | { type: TokenType.BooleanLiteral; value: boolean }
    | { type: TokenType.NullLiteral }
    | { type: TokenType.Keyword; value: KeywordType }
    | { type: TokenType.String; value: StringToken[] }
    | { type: TokenType.Comment; value: string }
    | { type: TokenType.Dialogue; value: DialogueToken };

export type TokenTrace = {
    start: number;
    end: number;
};

export type Tokens = TokensValue & TokenTrace;
export type ParseTokenFnOptions = Partial<{
    /**
     * Parsing a dialog involves parsing multiple future tokens.  
     * In order to prevent dialog parsing from being triggered in the process of parsing a dialog.  
     * We need to temporarily disable this policy.
     */
    allowDialogue: boolean;
}>;
export type ParseTokenFn = (iterator: LexerIterator, options?: ParseTokenFnOptions) => Tokens | LexerError | null;