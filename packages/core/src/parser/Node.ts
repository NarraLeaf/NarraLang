
export enum NodeType {
    // Statements //
    // Variable declarations
    VariableDeclaration = "VariableDeclaration",   // set, const
    LocalDeclaration = "LocalDeclaration",         // local variable declarations
    // Function declarations
    FunctionDeclaration = "FunctionDeclaration",   // function
    MacroDeclaration = "MacroDeclaration",         // function! (macro)
    CleanupDeclaration = "CleanupDeclaration",     // cleanup
    SceneDeclaration = "SceneDeclaration",         // scene
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
    // Expression statements
    ExpressionStatement = "ExpressionStatement",   // Expression as statement
    // Block statements
    BlockStatement = "BlockStatement",             // { ... }
    DialogueExpression = "DialogueExpression",     // character: "text"

    // Expressions //
    FunctionExpression = "FunctionExpression",
    MacroExpression = "MacroExpression",
    CallExpression = "CallExpression",             // myFunction()
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
    end: number | null;
}

export interface BaseNode {
    type: NodeType;
    trace: NodeTrace;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExpressionNode extends BaseNode {
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StatementNode extends BaseNode {
}

export type ParsedNode = ExpressionNode | StatementNode;


export function isExpressionNode(node: ParsedNode): node is ExpressionNode {
    switch (node.type) {
        case NodeType.CallExpression:
        case NodeType.MemberExpression:
        case NodeType.BinaryExpression:
        case NodeType.UnaryExpression:
        case NodeType.TernaryExpression:
        case NodeType.Identifier:
        case NodeType.Literal:
        case NodeType.ArrayExpression:
        case NodeType.ObjectExpression:
        case NodeType.TupleExpression:
        case NodeType.StringExpression:
        case NodeType.RestExpression:
        case NodeType.FunctionExpression:
        case NodeType.MacroExpression:
            return true;
        default:
            return false;
    }
}

export function isStatementNode(node: ParsedNode): node is StatementNode {
    switch (node.type) {
        case NodeType.VariableDeclaration:
        case NodeType.LocalDeclaration:
        case NodeType.FunctionDeclaration:
        case NodeType.MacroDeclaration:
        case NodeType.CleanupDeclaration:
        case NodeType.SceneDeclaration:
        case NodeType.IfStatement:
        case NodeType.WhileStatement:
        case NodeType.LoopStatement:
        case NodeType.ForEachStatement:
        case NodeType.ForRangeStatement:
        case NodeType.AwaitStatement:
        case NodeType.BreakStatement:
        case NodeType.ContinueStatement:
        case NodeType.ReturnStatement:
        case NodeType.SugarCallStatement:
        case NodeType.ExpressionStatement:
        case NodeType.BlockStatement:
        case NodeType.DialogueExpression:
            return true;
        default:
            return false;
    }
}

