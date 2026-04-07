import { KeywordType } from "@/core/lexer/Keyword";
import { OperatorType } from "@/core/lexer/Operator";
import { TokenType } from "@/core/lexer/TokenType";

type TokenMatcherCharacteristic = {
    [TokenType.NewLine]: never;
    [TokenType.Operator]: OperatorType;
    [TokenType.Identifier]: string;
    [TokenType.NumberLiteral]: never;
    [TokenType.BooleanLiteral]: never;
    [TokenType.NullLiteral]: never;
    [TokenType.Keyword]: KeywordType;
    [TokenType.String]: never;
    [TokenType.Comment]: never;
    [TokenType.Dialogue]: never;
    [TokenType.MultiLineDialogue]: never;
};

export type MatcherDefinition<T extends TokenType = TokenType> = {
    tokenType: T;
} & (TokenMatcherCharacteristic[T] extends never ? {
    value?: never;
} : {
    value: TokenMatcherCharacteristic[T];
})
