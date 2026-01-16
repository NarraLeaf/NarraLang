import { Namespace } from "narraleaf-react";
import { Scope, ScopeType, Variable, VariableSearchResult, VariableType } from "./Variables";
import { BaseDataType } from "./Data";

export class ProcedureScope extends Scope {
    private namespace: Namespace<Record<string, BaseDataType>>;

    constructor(namespace: Namespace<Record<string, BaseDataType>>, parent: Scope) {
        super(ScopeType.Procedure, parent);
        this.namespace = namespace;
    }

    protected readVar(name: string): BaseDataType {
        return this.namespace.get(name);
    }

    protected writeVar(name: string, variable: Variable, value: BaseDataType): void {
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

    protected findVar(name: string): VariableSearchResult | null {
        if (this.variables.has(name)) {
            return { variable: this.variables.get(name)!, scope: this };
        }
        return super.findVar(name);
    }
}
