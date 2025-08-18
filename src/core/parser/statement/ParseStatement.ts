import { ParserIterator } from "../ParserIterator";
import { StatementNode } from "../Node";
import { TokenType } from "@/core/lexer/TokenType";
import { KeywordType, Keywords } from "@/core/lexer/Keyword";
import { OperatorType } from "@/core/lexer/Operator";
import { ParserError, ParserErrorType } from "../ParserError";

// Import statement parsers
import { parseVariableDeclaration } from "./VariableDeclaration";
import { 
    parseFunctionDeclaration, 
    parseMacroDeclaration, 
    parseCleanupDeclaration 
} from "./FunctionDeclaration";
import { parseLocalDeclaration } from "./LocalDeclaration";
import { parseIfStatement } from "./IfStatement";
import { parseWhileStatement } from "./WhileStatement";
import { parseLoopStatement } from "./LoopStatement";
import { parseForEachStatement, parseForStatement } from "./ForStatement";
import { parseBreakStatement } from "./BreakStatement";
import { parseContinueStatement } from "./ContinueStatement";
import { parseReturnStatement } from "./ReturnStatement";
import { parseAwaitStatement } from "./AwaitStatement";
import { parseBlockStatement } from "./BlockStatement";
import { tryParseDialogueStatement } from "./DialogueStatement";
import { parseSugarOrExpressionStatement } from "./ExpressionStatement";

/**
 * Statement parsing options
 */
export interface ParseStatementOptions {
    /** Allow dialogue statements in this context */
    allowDialogue?: boolean;
    /** Current parsing depth to prevent infinite recursion */
    depth?: number;
    /** Maximum parsing depth */
    maxDepth?: number;
}

const DEFAULT_OPTIONS: Required<ParseStatementOptions> = {
    allowDialogue: true,
    depth: 0,
    maxDepth: 100,
};

/**
 * Main statement parser - dispatches to appropriate sub-parsers based on token type
 * 
 * This function handles the routing of different statement types in NarraLang:
 * - Variable declarations (set, const, var, local set)
 * - Function declarations (function, function!)
 * - Control flow statements (if, while, loop, for each, for...from...to)
 * - Control flow directives (break, continue, return, await)
 * - Sugar syntax statements (custom DSL syntax)
 * - Block statements ({ ... })
 * - Expression statements (function calls, assignments)
 */
export function parseStatement(iterator: ParserIterator, options?: ParseStatementOptions): StatementNode | null {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Prevent infinite recursion
    if (opts.depth > opts.maxDepth) {
        throw new ParserError(
            ParserErrorType.UnknownError,
            "Statement parsing depth exceeded maximum",
            iterator.getCurrentToken()
        );
    }

    const currentToken = iterator.getCurrentToken();
    if (!currentToken) {
        return null;
    }

    // Skip newlines and comments
    if (currentToken.type === TokenType.NewLine) {
        iterator.popToken();
        return parseStatement(iterator, { ...opts, depth: opts.depth + 1 });
    }

    // Handle keyword-based statements
    if (currentToken.type === TokenType.Keyword) {
        return parseKeywordStatement(iterator, opts);
    }

    // Handle block statements
    if (currentToken.type === TokenType.Operator && currentToken.value === OperatorType.LeftBrace) {
        return parseBlockStatement(iterator, opts);
    }

    // Handle dialogue statements (character: dialogue)
    if (opts.allowDialogue && currentToken.type === TokenType.Identifier) {
        const dialogueStatement = tryParseDialogueStatement(iterator, opts);
        if (dialogueStatement) {
            return dialogueStatement;
        }
    }

    // Handle sugar syntax statements and expression statements
    return parseSugarOrExpressionStatement(iterator, opts);
}

/**
 * Parse keyword-based statements
 */
function parseKeywordStatement(iterator: ParserIterator, opts: Required<ParseStatementOptions>): StatementNode {
    const token = iterator.getCurrentToken()!;
    if (token.type !== TokenType.Keyword) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected keyword token",
            token
        );
    }
    const keyword = token.value;

    switch (keyword) {
        // Variable declarations
        case KeywordType.Set:
        case KeywordType.Const:
        case KeywordType.Var:
            return parseVariableDeclaration(iterator);

        case KeywordType.Local:
            return parseLocalDeclaration(iterator, opts);

        // Function declarations
        case KeywordType.Function:
            return parseFunctionDeclaration(iterator);

        case KeywordType.Macro:
            return parseMacroDeclaration(iterator);

        case KeywordType.Cleanup:
            return parseCleanupDeclaration(iterator);

        // Control flow statements
        case KeywordType.If:
            return parseIfStatement(iterator, opts);

        case KeywordType.While:
            return parseWhileStatement(iterator, opts);

        case KeywordType.Loop:
            return parseLoopStatement(iterator, opts);

        case KeywordType.For:
            return parseForStatement(iterator, opts);

        case KeywordType.ForEach:
            return parseForEachStatement(iterator, opts);

        // Control flow directives
        case KeywordType.Break:
            return parseBreakStatement(iterator);

        case KeywordType.Continue:
            return parseContinueStatement(iterator);

        case KeywordType.Return:
            return parseReturnStatement(iterator);

        case KeywordType.Await:
            return parseAwaitStatement(iterator, opts);

        default:
            throw new ParserError(
                ParserErrorType.UnexpectedToken,
                `Unexpected keyword "${Keywords[keyword] || keyword}" at start of statement`,
                token
            );
    }
}

