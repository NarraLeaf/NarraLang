export { lexer, toErrorMessage } from "./lexer/Lexer";
export { parse, type ParseOptions, type ParseResult } from "./parser/Parser";
export { ParserError, ParserErrorType } from "./parser/ParserError";
export { LexerError, LexerErrorType } from "./lexer/LexerError";

export type {
    BaseNode,
    ExpressionNode,
    NodeTrace,
    ParsedNode,
    StatementNode,
} from "./parser/Node";
export { NodeType, isExpressionNode, isStatementNode } from "./parser/Node";

export type {
    ArrayExpressionNode,
    BinaryExpressionNode,
    CallExpressionNode,
    FunctionExpressionNode,
    IdentifierNode,
    LiteralNode,
    MacroExpressionNode,
    MemberExpressionNode,
    ObjectExpressionNode,
    RestExpressionNode,
    StringExpressionNode,
    StringTag,
    TernaryExpressionNode,
    TupleExpressionNode,
    UnaryExpressionNode,
} from "./parser/expression/Expression";

export type {
    AwaitStatementNode,
    BlockStatementNode,
    BreakStatementNode,
    CleanupDeclarationNode,
    ContinueStatementNode,
    DialogueStatementNode,
    ExpressionStatementNode,
    ForEachStatementNode,
    ForRangeStatementNode,
    FunctionDeclarationNode,
    IfStatementNode,
    LocalDeclarationNode,
    LoopStatementNode,
    MacroDeclarationNode,
    ReturnStatementNode,
    SceneDeclarationNode,
    SugarCallStatementNode,
    VariableDeclaration,
    VariableDeclarationNode,
    WhileStatementNode,
} from "./parser/statement/Statement";
