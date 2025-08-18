import { KeywordType } from "@/core/lexer/Keyword";
import { TokenType } from "@/core/lexer/TokenType";
import { NodeType } from "../Node";
import { ParserError, ParserErrorType } from "../ParserError";
import { ParserIterator } from "../ParserIterator";
import {
    FunctionDeclarationNode,
    MacroDeclarationNode,
    CleanupDeclarationNode,
} from "./Statement";
import { parseBlockStatement } from "./BlockStatement";
import { trace } from "../Trace";
import { parseFunctionParams, parseMacroParams } from "../shared/parseParams";
import { ParserCleanupContext, ParserFunctionContext, ParserMacroBodyContext } from "../ctx/Contexts";



/**
 * Parse regular function declaration: function name(params) { body }
 */
export function parseFunctionDeclaration(iterator: ParserIterator): FunctionDeclarationNode {
    const startToken = iterator.popToken(); // consume 'function'
    if (!startToken || startToken.type !== TokenType.Keyword || startToken.value !== KeywordType.Function) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected 'function' keyword",
            startToken
        );
    }
    
    // Get function name
    const nameToken = iterator.popToken();
    if (!nameToken || nameToken.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.ExpectedIdentifier,
            "Expected function name",
            nameToken
        );
    }
    
    const name = nameToken.value;
    
    // Parse parameters
    const { params, rest } = parseFunctionParams(iterator);
    
    // Parse function body
    const body = iterator.getContext().context(new ParserFunctionContext(), () => {
        return parseBlockStatement(iterator, {
            allowDialogue: false,
            depth: 0,
            maxDepth: 100,
        });
    });
    
    return {
        type: NodeType.FunctionDeclaration,
        trace: trace(startToken.start, body.trace.end),
        name,
        params,
        rest,
        body: body.body,
    };
}

/**
 * Parse macro function declaration: function! name(params, *modifiers) { body }
 */
export function parseMacroDeclaration(iterator: ParserIterator): MacroDeclarationNode {
    const startToken = iterator.popToken(); // consume 'function!'
    if (!startToken || startToken.type !== TokenType.Keyword || startToken.value !== KeywordType.Macro) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected 'function!' keyword",
            startToken
        );
    }
    
    // Get macro name
    const nameToken = iterator.popToken();
    if (!nameToken || nameToken.type !== TokenType.Identifier) {
        throw new ParserError(
            ParserErrorType.ExpectedIdentifier,
            "Expected macro name",
            nameToken
        );
    }
    
    const name = nameToken.value;
    
    // Parse parameters and modifiers
    const { params, modifiers } = parseMacroParams(iterator);
    
    // Parse macro body
    const body = iterator.getContext().context(new ParserMacroBodyContext(), () => {
        return parseBlockStatement(iterator, {
            allowDialogue: false,
            depth: 0,
            maxDepth: 100,
        });
    });
    
    return {
        type: NodeType.MacroDeclaration,
        trace: trace(startToken.start, body.trace.end),
        name,
        params,
        modifiers,
        body: body.body,
    };
}

/**
 * Parse cleanup block: cleanup { statements }
 */
export function parseCleanupDeclaration(iterator: ParserIterator): CleanupDeclarationNode {
    const startToken = iterator.popToken(); // consume 'cleanup'
    if (!startToken || startToken.type !== TokenType.Keyword || startToken.value !== KeywordType.Cleanup) {
        throw new ParserError(
            ParserErrorType.UnexpectedToken,
            "Expected 'cleanup' keyword",
            startToken
        );
    }
    
    // Parse cleanup body
    const body = iterator.getContext().context(new ParserCleanupContext(), () => {
        return parseBlockStatement(iterator, {
            allowDialogue: false,
            depth: 0,
            maxDepth: 100,
        });
    });
    
    return {
        type: NodeType.CleanupDeclaration,
        trace: trace(startToken.start, body.trace.end),
        body: body.body,
    };
}
