import { TokenType } from "@/core/lexer/TokenType";
import { ParserIterator } from "../ParserIterator";
import { VariableDeclaration, VariableDeclarationNode } from "./Statement";
import { KeywordType } from "@/core/lexer/Keyword";
import { ParserError, ParserErrorType } from "../ParserError";
import { OperatorType } from "@/core/lexer/Operator";
import { parseExpression } from "../expression/ParseExpression";
import { NodeType } from "../Node";
import { trace } from "../Trace";
import { ParserContextType } from "../ctx/ParserContextType";

// @todo: support target destructuring

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

    // Guard: `var` must be declared within a procedure/function context
    if (type === "var" && !iterator.getContext().has(ParserContextType.Function)) {
        throw new ParserError(
            ParserErrorType.InvalidVariableDeclaration,
            "Cannot declare function variable outside of function",
        ).setPos(currentToken);
    }

    if (type !== "set" && iterator.getContext().has(ParserContextType.LocalDeclaration)) {
        throw new ParserError(
            ParserErrorType.InvalidVariableDeclaration,
            "Cannot declare function variable/constant using local declaration syntax",
        ).setPos(currentToken);
    }

    const declarations: VariableDeclaration[] = [];
    let end: number | null = null;

    iterator.consume(); // consume the keyword
    while (!iterator.isDone() && iterator.getCurrentToken()?.type !== TokenType.NewLine) {
        const left = parseExpression(iterator, {
            stopOn: [
                { type: TokenType.Operator, value: OperatorType.To },
                { type: TokenType.NewLine },
                { type: TokenType.Operator, value: OperatorType.Comma },
            ],
        });
        if (!left) {
            throw new ParserError(
                ParserErrorType.ExpectedExpression,
                "Expected left-hand side expression or identifier",
            ).setPos(iterator.getCurrentToken());
        }

        // Guard: `const` and `var` require an identifier on LHS
        if ((type === "const" || type === "var") && left.type !== NodeType.Identifier) {
            throw new ParserError(
                ParserErrorType.ExpectedIdentifier,
                "Expected identifier on the left-hand side",
            ).setPos(iterator.getCurrentToken());
        }

        iterator.popTokenIf(token => // Consume the "to" keyword
            token.type === TokenType.Operator && token.value === OperatorType.To
        );

        const value = parseExpression(iterator, {
            stopOn: [
                { type: TokenType.Operator, value: OperatorType.Comma },
                { type: TokenType.NewLine },
            ],
        });
        if (!value) {
            throw new ParserError(
                ParserErrorType.ExpectedExpression,
                "Expected right-hand side expression",
            ).setPos(iterator.getCurrentToken());
        }
        declarations.push({ left, value });

        const next = iterator.getCurrentToken();
        if (!next || next.type === TokenType.NewLine) {
            end = value.trace.end;
            break;
        }

        const consumedComma = iterator.popTokenIf(token => token.type === TokenType.Operator && token.value === OperatorType.Comma);
        if (consumedComma) {
            continue;
        }

        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected ',' or line break between declarations",
        ).setPos(next);
    }

    const start = currentToken.start;
    return { 
        type: NodeType.VariableDeclaration,
        varType: type,
        declarations,
        trace: trace(start, end ?? null),
    };
}
