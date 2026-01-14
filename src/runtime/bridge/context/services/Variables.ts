
export enum VariableType {
    Const = "const",
    Set = "set",
    Var = "var",
}
export enum ScopeType {
    Module = "module",
    Procedure = "procedure",
    Function = "function",
}

export type Variable = {
    type: VariableType;
};
export type Variables = Map<string, Variable>;

export class Scope {
    public readonly type: ScopeType;
    private parent: Scope | null;
    private variables: Variables;

    constructor(type: ScopeType, parent: Scope | null) {
        this.type = type;
        this.parent = parent;
        this.variables = new Map();
    }

    public getParent(): Scope | null {
        return this.parent;
    }

    public getVar(name: string): Variable | null {
        let current: Scope | null = this;
        while (current) {
            const variable = current.variables.get(name);
            if (variable) {
                return variable;
            }
            current = current.getParent();
        }
        return null;
    }

    public initVar(name: string, variable: Variable) {
    }

}
