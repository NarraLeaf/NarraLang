// Export main statement parser
export { parseStatement, type ParseStatementOptions } from "./ParseStatement";

// Export all statement parsers
export { parseVariableDeclaration } from "./VariableDeclaration";
export { 
    parseFunctionDeclaration, 
    parseMacroDeclaration, 
    parseCleanupDeclaration 
} from "./FunctionDeclaration";

export { parseLocalDeclaration } from "./LocalDeclaration";
export { parseIfStatement } from "./IfStatement";
export { parseWhileStatement } from "./WhileStatement";
export { parseLoopStatement } from "./LoopStatement";
export { parseForStatement } from "./ForStatement";
export { parseBreakStatement } from "./BreakStatement";
export { parseContinueStatement } from "./ContinueStatement";
export { parseReturnStatement } from "./ReturnStatement";
export { parseAwaitStatement } from "./AwaitStatement";
export { parseBlockStatement, parseStatementBlock } from "./BlockStatement";
export { createDialogueStatement } from "./DialogueStatement";
export { parseSugarOrExpressionStatement, parseExpressionStatement } from "./ExpressionStatement";
export { parseSugarCallStatement, couldBeSugarCall } from "./SugarCallStatement";

// Export statement types
export * from "./Statement";
