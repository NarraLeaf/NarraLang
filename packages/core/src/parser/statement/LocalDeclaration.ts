import { ParserIterator } from "../ParserIterator";
import { LocalDeclarationNode, VariableDeclarationNode } from "./Statement";
import { NodeType } from "../Node";
import { TokenType } from "@/core/lexer/TokenType";
import { KeywordType } from "@/core/lexer/Keyword";
import { ParserError, ParserErrorType } from "../ParserError";
import { trace } from "../Trace";
import { parseVariableDeclaration } from "./VariableDeclaration";
import { ParseStatementOptions } from "./ParseStatement";

/**
 * Parse local variable declaration (local set ...)
 */
export function parseLocalDeclaration(iterator: ParserIterator, _opts: Required<ParseStatementOptions>): LocalDeclarationNode {
    const startToken = iterator.popToken()!; // consume 'local'
    
    // Expect 'set' keyword next
    const setToken = iterator.getCurrentToken();
    if (!setToken || setToken.type !== TokenType.Keyword || setToken.value !== KeywordType.Set) {
        throw new ParserError(
            ParserErrorType.ExpectedKeyword,
            "Expected 'set' after 'local'",
            setToken
        );
    }

    // Parse as regular variable declaration
    const varDecl = parseVariableDeclaration(iterator) as VariableDeclarationNode;
    
    return {
        type: NodeType.LocalDeclaration,
        declarations: varDecl.declarations,
        trace: trace(startToken.start, varDecl.trace.end),
    };
}
