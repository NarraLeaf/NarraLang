
export enum NodeType {
    // Variable declarations
    VariableDeclaration = "VariableDeclaration",   // set, const
    LocalDeclaration = "LocalDeclaration",         // local variable declarations
    
    // Function declarations
    FunctionDeclaration = "FunctionDeclaration",   // function
    MacroDeclaration = "MacroDeclaration",         // function! (macro)
    CleanupDeclaration = "CleanupDeclaration",     // cleanup

    FunctionExpression = "FunctionExpression",
    MacroExpression = "MacroExpression",
    
    // Control flow statements
    IfStatement = "IfStatement",                   // if-else if-else
    WhileStatement = "WhileStatement",             // while
    LoopStatement = "LoopStatement",               // loop N times
    ForEachStatement = "ForEachStatement",         // for each...in
    ForRangeStatement = "ForRangeStatement",       // for...from...to
    AwaitStatement = "AwaitStatement",             // await
    
    // Control flow directives
    BreakStatement = "BreakStatement",             // break
    ContinueStatement = "ContinueStatement",       // continue
    ReturnStatement = "ReturnStatement",           // return
    
    // Sugar syntax statements (DSL specific)
    SugarCallStatement = "SugarCallStatement",     // Custom sugar syntax like "image", "character"
    
    // Block statements
    BlockStatement = "BlockStatement",             // { ... }
    
    CallExpression = "CallExpression",             // function()
    MemberExpression = "MemberExpression",         // obj.prop
    BinaryExpression = "BinaryExpression",         // a + b
    UnaryExpression = "UnaryExpression",           // !a, not a
    TernaryExpression = "TernaryExpression",       // a ? b : c
    Identifier = "Identifier",                     // variable references
    Literal = "Literal",                           // literals
    ArrayExpression = "ArrayExpression",           // [1, 2, 3]
    ObjectExpression = "ObjectExpression",         // {key: value}
    TupleExpression = "TupleExpression",           // (1, 2, 3)
    StringExpression = "StringExpression",         // rich text
    
    RestExpression = "RestExpression",             // ...a

    Module = "Module",
}

export interface NodeTrace {
    start: number;
    end: number;
}

export interface BaseNode {
    type: NodeType;
    trace: NodeTrace;
    parent: BaseNode | null;
}

export interface ExpressionNode extends BaseNode {
}

export interface StatementNode extends BaseNode {
}

export type ParsedNode = ExpressionNode | StatementNode;
