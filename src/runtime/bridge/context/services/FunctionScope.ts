import { BaseDataType } from "./Data";
import { Scope, ScopeType, Variable, VariableSearchResult, VariableType } from "./Variables";


export class FunctionScope extends Scope {
    private store: Map<string, BaseDataType>;
    
    constructor(parent: Scope) {
        super(ScopeType.Function, parent);
        this.store = new Map();
    }

    protected readVar(name: string): BaseDataType {
        return this.store.get(name) ?? null;
    }

    protected writeVar(name: string, variable: Variable, value: BaseDataType): void {
        if (!this.isVarMutable(variable)) {
            throw new Error(`Variable ${name} is not mutable`);
        }
        this.asserts(name, variable, [VariableType.Const, VariableType.Set, VariableType.Var]);

        this.store.set(name, value);
    }

    protected createVar(name: string, variable: Variable): void {
        if (this.variables.has(name)) {
            throw new Error(`Variable ${name} already declared`);
        }
        this.asserts(name, variable, [VariableType.Const, VariableType.Set, VariableType.Var]);

        this.variables.set(name, variable);
    }

    protected findVar(name: string): VariableSearchResult | null {
        if (this.variables.has(name)) {
            return { variable: this.variables.get(name)!, scope: this };
        }
        return super.findVar(name);
    }
}
