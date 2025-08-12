import { TokenType } from "@/core/lexer/TokenType";
import { ParserIterator } from "../ParserIterator";
import { VariableDeclaration, VariableDeclarationNode } from "./Statement";
import { KeywordType } from "@/core/lexer/Keyword";
import { ParserError, ParserErrorType } from "../ParserError";
import { OperatorType } from "@/core/lexer/Operator";
import { parseExpression } from "../expression/ParseExpression";
import { NodeType } from "../Node";
import { trace } from "../Trace";

// @todo: 
// add support for "to" keyword
// add support for dynamic left-hand side
// optional comma

export function parseVariableDeclaration(iterator: ParserIterator): VariableDeclarationNode {
    const currentToken = iterator.getCurrentToken();
    if (
        !currentToken
        || currentToken.type !== TokenType.Keyword
        || (
            currentToken.value !== KeywordType.Var
            && currentToken.value !== KeywordType.Set
            && currentToken.value !== KeywordType.Const
        )
    ) {
        throw new ParserError(
            ParserErrorType.ExpectedVariableDeclaration,
            "Expected variable declaration",
        ).setPos(currentToken);
    }

    const typeMap: Record<KeywordType.Var | KeywordType.Set | KeywordType.Const, VariableDeclarationNode["varType"]> = {
        [KeywordType.Var]: "var",
        [KeywordType.Set]: "set",
        [KeywordType.Const]: "const",
    };
    const type: VariableDeclarationNode["varType"] = typeMap[currentToken.value];

    const declarations: VariableDeclaration[] = [];
    let end: number | null = null;

    iterator.consume();
    while (!iterator.isDone() && iterator.getCurrentToken()?.type !== TokenType.NewLine) {
        const currentToken = iterator.getCurrentToken();
        if (!currentToken || currentToken.type !== TokenType.Identifier) {
            throw new ParserError(
                ParserErrorType.ExpectedIdentifier,
                "Expected identifier",
            ).setPos(currentToken);
        }

        const name = currentToken.value;
        iterator.consume();

        const commaToken = iterator.popTokenIf(token => 
            token.type === TokenType.Operator 
            && token.value === OperatorType.Comma
        );
        if (!commaToken) {
            throw new ParserError(
                ParserErrorType.UnexpectedToken,
                "Expected comma, but got " + (iterator.getCurrentToken()?.type || "end of file"),
            ).setPos(iterator.getCurrentToken());
        }

        const value = parseExpression(iterator);
        declarations.push({ name, value });

        if (iterator.isDone() || iterator.getCurrentToken()!.type === TokenType.NewLine) {
            end = value.trace.end;
        }
    }

    const start = currentToken.start;
    return { 
        type: NodeType.VariableDeclaration,
        varType: type,
        declarations,
        trace: trace(start, end ?? null),
    };
}
