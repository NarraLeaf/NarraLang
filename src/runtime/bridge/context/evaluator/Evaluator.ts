import { IdentifierNode, LiteralNode } from "@/core/parser/expression/Expression";
import { ExpressionNode } from "@/core/parser/Node";
import { ContextActionsService } from "../ContextActions";
import { DataType, DataTypeKind } from "../services/Data";
import { ScopeType } from "../services/Variables";


export class Evaluator {
    protected type: ScopeType;
    protected ctx: ContextActionsService;

    constructor(type: ScopeType, ctx: ContextActionsService) {
        this.type = type;
        this.ctx = ctx;
    }

    public evaluateExpression(node: ExpressionNode): DataType {}

    public evaluateLiteral(node: LiteralNode): DataType {
        if (typeof node.value === "number") {
            return { type: DataTypeKind.Number, value: node.value };
        } else if (typeof node.value === "boolean") {
            return { type: DataTypeKind.Boolean, value: node.value };
        } else if (typeof node.value === "string") {
            return { type: DataTypeKind.String, value: node.value };
        } else if (node.value === null) {
            return { type: DataTypeKind.Null, value: null };
        }

        throw new Error(`Invalid literal value: ${node.value}`);
    }

    // Expressions
    public evaluateIdentifier(node: IdentifierNode): string {
        return node.name;
    }
}
