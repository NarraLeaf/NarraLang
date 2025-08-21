import { ExpressionNode, NodeType, StatementNode } from "../Node";

export type VariableDeclaration = {
    left: ExpressionNode;
    value: ExpressionNode;
};
interface VariableDeclarationNode extends StatementNode {
    type: NodeType.VariableDeclaration;
    varType: "set" | "const" | "var";
    declarations: VariableDeclaration[];
}

interface LocalDeclarationNode extends StatementNode {
    type: NodeType.LocalDeclaration;
    declarations: VariableDeclaration[];
}

type FunctionParam<T = ExpressionNode | null> = {
    name: string;
    defaultValue: T;
};
interface FunctionDeclarationNode extends StatementNode {
    type: NodeType.FunctionDeclaration;
    name: string;
    params: FunctionParam[];
    rest: string | null;
    body: StatementNode[];
}

interface MacroDeclarationNode extends StatementNode {
    type: NodeType.MacroDeclaration;
    name: string;
    params: FunctionParam<null>[];
    modifiers: FunctionParam[];
    body: StatementNode[];
}

interface CleanupDeclarationNode extends StatementNode {
    type: NodeType.CleanupDeclaration;
    body: StatementNode[];
}

interface IfStatementNode extends StatementNode {
    type: NodeType.IfStatement;
    condition: ExpressionNode;
    body: StatementNode[];
}

interface WhileStatementNode extends StatementNode {
    type: NodeType.WhileStatement;
    condition: ExpressionNode;
    body: StatementNode[];
}

interface LoopStatementNode extends StatementNode {
    type: NodeType.LoopStatement;
    times: ExpressionNode;
    body: StatementNode[];
}

interface ForEachStatementNode extends StatementNode {
    type: NodeType.ForEachStatement;
    itemName: string;
    target: ExpressionNode;
    body: StatementNode[];
}

interface ForRangeStatementNode extends StatementNode {
    type: NodeType.ForRangeStatement;
    indexName: string;
    start: ExpressionNode;
    end: ExpressionNode;
    body: StatementNode[];
}

interface AwaitStatementNode extends StatementNode {
    type: NodeType.AwaitStatement;
    body: StatementNode;
}

interface BreakStatementNode extends StatementNode {
    type: NodeType.BreakStatement;
}

interface ContinueStatementNode extends StatementNode {
    type: NodeType.ContinueStatement;
}

interface ReturnStatementNode extends StatementNode {
    type: NodeType.ReturnStatement;
    value: ExpressionNode | null;
}

interface SugarCallStatementNode extends StatementNode {
    type: NodeType.SugarCallStatement;
    name: string;
    args: ExpressionNode[];
    modifiers: Record<string, ExpressionNode>;
}

interface BlockStatementNode extends StatementNode {
    type: NodeType.BlockStatement;
    body: StatementNode[];
}

interface DialogueStatementNode extends StatementNode {
    type: NodeType.DialogueExpression;
    character: string;
    dialogue: string;
}

export {
    VariableDeclarationNode,
    LocalDeclarationNode,
    FunctionDeclarationNode,
    MacroDeclarationNode,
    CleanupDeclarationNode,
    AwaitStatementNode,
    IfStatementNode,
    WhileStatementNode,
    LoopStatementNode,
    ForEachStatementNode,
    ForRangeStatementNode,
    BreakStatementNode,
    ContinueStatementNode,
    ReturnStatementNode,
    SugarCallStatementNode,
    BlockStatementNode,
};
