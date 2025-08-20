import { RawStringTag } from "@/core/lexer/String";
import { ExpressionNode, NodeType } from "../Node";
import { BlockStatementNode } from "../statement";
import { BinaryOperator } from "./BinaryExpression";

interface CallExpressionNode extends ExpressionNode {
    type: NodeType.CallExpression;
    callee: ExpressionNode;
    args: ExpressionNode[];
}

interface MemberExpressionNode extends ExpressionNode {
    type: NodeType.MemberExpression;
    target: ExpressionNode;
    property: ExpressionNode;
    computed: boolean; // true for obj[key], false/undefined for obj.key
}

interface BinaryExpressionNode extends ExpressionNode {
    type: NodeType.BinaryExpression;
    operator: BinaryOperator;   
    left: ExpressionNode;
    right: ExpressionNode;
}

interface UnaryExpressionNode extends ExpressionNode {
    type: NodeType.UnaryExpression;
    condition: ExpressionNode;
}

interface TernaryExpressionNode extends ExpressionNode {
    type: NodeType.TernaryExpression;
    condition: ExpressionNode;
    trueValue: ExpressionNode;
    falseValue: ExpressionNode;
}

interface IdentifierNode extends ExpressionNode {
    type: NodeType.Identifier;
    name: string;
}

interface LiteralNode extends ExpressionNode {
    type: NodeType.Literal;
    value: number | boolean | null;
}

interface ArrayExpressionNode extends ExpressionNode {
    type: NodeType.ArrayExpression;
    elements: ExpressionNode[];
}

interface ObjectExpressionNode extends ExpressionNode {
    type: NodeType.ObjectExpression;
    properties: (TupleExpressionNode | RestExpressionNode)[];
}

interface TupleExpressionNode extends ExpressionNode {
    type: NodeType.TupleExpression;
    elements: ExpressionNode[];
}

export type StringTag = {
    tag: RawStringTag;
    properties: Record<string, string | number> | null;
    children: (string | StringTag | ExpressionNode)[];
};
interface StringExpressionNode extends ExpressionNode {
    type: NodeType.StringExpression;
    value: (string | StringTag | ExpressionNode)[];
}

interface RestExpressionNode extends ExpressionNode {
    type: NodeType.RestExpression;
    value: ExpressionNode;
}

interface FunctionExpressionNode extends ExpressionNode {
    type: NodeType.FunctionExpression;
    params: { name: string; defaultValue: ExpressionNode | null }[];
    rest: string | null;
    name: string | null;
    body: ExpressionNode | BlockStatementNode; // Single expression for lambda, statements for anonymous function
}

interface MacroExpressionNode extends ExpressionNode {
    type: NodeType.MacroExpression;
    params: { name: string; defaultValue: null }[];
    modifiers: { name: string; defaultValue: ExpressionNode | null }[];
    body: ExpressionNode[];
}

export {
    ArrayExpressionNode, BinaryExpressionNode, CallExpressionNode, FunctionExpressionNode, IdentifierNode,
    LiteralNode, MacroExpressionNode, MemberExpressionNode, ObjectExpressionNode, RestExpressionNode, StringExpressionNode, TernaryExpressionNode, TupleExpressionNode, UnaryExpressionNode
};

