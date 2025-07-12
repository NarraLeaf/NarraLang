import { OperatorType } from "./Operator";
import { KeywordType } from "./Keyword";
import type { StringToken } from "./String";

export enum TokenType {
    NewLine = "NewLine",
    Operator = "Operator",
    Identifier = "Identifier",
    NumberLiteral = "NumberLiteral",
    BooleanLiteral = "BooleanLiteral",
    NullLiteral = "NullLiteral",
    Keyword = "Keyword",
    String = "String",
}

export type Tokens =
    | { type: TokenType.NewLine }
    | { type: TokenType.Operator; value: OperatorType }
    | { type: TokenType.Identifier; value: string }
    | { type: TokenType.NumberLiteral; value: number }
    | { type: TokenType.BooleanLiteral; value: boolean }
    | { type: TokenType.NullLiteral }
    | { type: TokenType.Keyword; value: KeywordType }
    | { type: TokenType.String; value: StringToken[] };
