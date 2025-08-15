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
    while (!iterator.isDone()) {
        const left = parseExpression(iterator, {
            stopOn: [
                { type: TokenType.Keyword, value: KeywordType.To },
                { type: TokenType.NewLine },
                { type: TokenType.Operator, value: OperatorType.Comma },
            ],
            identifier: true,
        });
        // Guard: ensure LHS is a valid target form for declaration/assignment
        const allowedLhsForAny: NodeType[] = [
            NodeType.Identifier,
            NodeType.ArrayExpression,
            NodeType.ObjectExpression,
            NodeType.TupleExpression,
            NodeType.MemberExpression,
        ];
        if (!left || !allowedLhsForAny.includes(left.type)) {
            throw new ParserError(
                ParserErrorType.ExpectedExpression,
                "Expected left-hand side expression or identifier",
            ).setPos(iterator.getCurrentToken());
        }

        // Guard: `const` requires an identifier on LHS (no reference or destructuring)
        if (type === "const" && left.type !== NodeType.Identifier) {
            throw new ParserError(
                ParserErrorType.ExpectedIdentifier,
                "Expected identifier on the left-hand side",
            ).setPos(iterator.getCurrentToken());
        }

        // Guard: `var` cannot target a reference (member path). Destructuring is allowed.
        if (type === "var" && left.type === NodeType.MemberExpression) {
            throw new ParserError(
                ParserErrorType.InvalidVariableDeclaration,
                "Expected variable or destructuring on the left-hand side",
            ).setPos(iterator.getCurrentToken());
        }

        iterator.popTokenIf(token => // Consume the optional "to" operator
            token.type === TokenType.Keyword && token.value === KeywordType.To
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

        // Consume the comma
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
