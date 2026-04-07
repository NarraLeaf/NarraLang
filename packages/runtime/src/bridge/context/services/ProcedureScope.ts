import { Namespace } from "narraleaf-react";
import { Scope, ScopeType, Variable, VariableSearchResult, VariableType } from "./Variables";
import { DataType, DataTypeKind } from "./Data";
import { mapToObject } from "@narralang/share";

export class ProcedureScope extends Scope {
    private namespace: Namespace<Record<string, DataType>>;

    constructor(sceneLocal: Namespace<Record<string, DataType>>, parent: Scope) {
        super(ScopeType.Procedure, parent);
        this.namespace = sceneLocal;
    }

    protected readVar(name: string): DataType | null {
        return this.namespace.get(name) ?? null;
    }

    protected writeVar(name: string, variable: Variable, value: DataType): void {
        if (!this.isVarMutable(variable)) {
            throw new Error(`Variable ${name} is not mutable`);
        }
        this.asserts(name, variable, [VariableType.Const, VariableType.Set]);

        this.namespace.set(name, value);
    }

    protected createVar(name: string, variable: Variable): void {
        if (this.variables.has(name)) {
            throw new Error(`Variable ${name} already declared`);
        }
        this.asserts(name, variable, [VariableType.Const, VariableType.Set]);

        this.variables.set(name, variable);
    }

    public findVar(name: string): VariableSearchResult | null {
        if (this.variables.has(name)) {
            return { variable: this.variables.get(name)!, scope: this };
        }
        return super.findVar(name);
    }

    protected override writeDeclare(): void {
        this.namespace.set("[[variables]]", { type: DataTypeKind.Object, value: mapToObject<Variable>(this.variables) });
    }

    protected override readDeclare(): void {
        const variables = this.namespace.get("[[variables]]") as { type: DataTypeKind.Object, value: Record<string, Variable> };
        if (!variables) {
            return;
        }
        for (const [name, variable] of Object.entries(variables.value)) {
            this.variables.set(name, variable);
        }
    }
}
