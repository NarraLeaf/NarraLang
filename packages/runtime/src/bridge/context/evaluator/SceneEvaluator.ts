import {
    NodeType,
    type IdentifierNode,
    type LiteralNode,
    type StatementNode,
    type VariableDeclarationNode,
} from "@narralang/core";
import { ActionStatements, ChainedActions } from "narraleaf-react";
import { ContextActionsService } from "../ContextActions";
import { DataType } from "../services/Data";
import { ProcedureScope } from "../services/ProcedureScope";
import { ScopeType, VariableType } from "../services/Variables";
import { Evaluator } from "./Evaluator";

export class SceneEvaluator extends Evaluator {
    private scope: ProcedureScope;

    constructor(ctx: ContextActionsService, scope: ProcedureScope) {
        super(ScopeType.Procedure, ctx);
        this.scope = scope;
    }

    public constructSceneNodes() {}

    public constructNode(node: StatementNode): ActionStatements {
        switch (node.type) {
            case NodeType.VariableDeclaration:
                return this.constructVariableDeclaration(node as VariableDeclarationNode);
        }

        throw new Error(`Invalid node type: ${node.type}`);
    }

    public constructVariableDeclaration(node: VariableDeclarationNode): ActionStatements {
        if (node.varType !== "const" && node.varType !== "set") {
            throw new Error(`Invalid variable type: ${node.varType}`);
        }

        const actions: ChainedActions = [];
        const declarations = node.declarations;
        for (const {left, value} of declarations) {
            const identifier: string | null = left.type === NodeType.Identifier
                ? this.evaluateIdentifier(left as IdentifierNode)
                : null;
            if (!identifier) {
                throw new Error(`Invalid identifier: ${left.toString()}`);
            }

            if (value.type === NodeType.Literal) {
                const evaluatedValue: DataType = this.evaluateLiteral(value as LiteralNode);
                actions.push(this.ctx.$declareVariable(identifier, this.getVariableType(node)));
                actions.push(this.ctx.$setVar(identifier, evaluatedValue));
                continue;
            }

            // const evaluatedValue: DataType = this.evaluateExpression(value);
            actions.push(this.ctx.$declareVariable(identifier, this.getVariableType(node)));
            actions.push(this.ctx.$setVar(identifier, [this, value]));
        }

        return actions;
    }

    public getVariableType(node: VariableDeclarationNode): VariableType {
        if (node.varType === "const") {
            return VariableType.Const;
        } else if (node.varType === "set") {
            return VariableType.Set;
        } else if (node.varType === "var") {
            return VariableType.Var;
        }
        throw new Error(`Invalid variable type: ${node.varType}`);
    }
}
