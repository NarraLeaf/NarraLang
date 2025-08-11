import { ExpressionNode, NodeType } from "../Node";
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
    properties: ExpressionNode[];
}

interface TupleExpressionNode extends ExpressionNode {
    type: NodeType.TupleExpression;
    elements: ExpressionNode[];
}

type StringTag = {
    name: string;
    properties: Record<string, string | number> | null;
    child: ExpressionNode | null;
};
interface StringExpressionNode extends ExpressionNode {
    type: NodeType.StringExpression;
    value: (string | StringTag | StringExpressionNode)[];
}

interface RestExpressionNode extends ExpressionNode {
    type: NodeType.RestExpression;
    value: ExpressionNode;
}

export {
    CallExpressionNode,
    MemberExpressionNode,
    BinaryExpressionNode,
    UnaryExpressionNode,
    IdentifierNode,
    LiteralNode,
    ArrayExpressionNode,
    ObjectExpressionNode,
    TupleExpressionNode,
    StringExpressionNode,
    RestExpressionNode,
};
