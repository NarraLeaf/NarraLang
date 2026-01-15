import { Storable } from "narraleaf-react";

export enum VariableType {
    Const = "const",
    Set = "set",
    Var = "var",
    Module = "module",
    Scene = "scene",
}
export enum ScopeType {
    Module = "MODULE",
    Procedure = "PROCEDURE",
    Function = "FUNCTION",
}

export type Variable = {
    type: VariableType;
};
export type Variables = Map<string, Variable>;
export type VariableSearchResult = {
    variable: Variable;
    scope: Scope;
};
export type VariableData = {
    variable: Variable;
    scope: Scope;
    data: unknown;
};

export abstract class Scope {
    public readonly type: ScopeType;
    protected parent: Scope | null;
    protected variables: Variables;

    constructor(type: ScopeType, parent: Scope | null) {
        this.type = type;
        this.parent = parent;
        this.variables = new Map();
    }

    public getParent(): Scope | null {
        return this.parent;
    }

    /**
     * Checks if a variable exists within this scope or any of its parent scopes.
     *
     * @param name - The name of the variable to search for
     * @returns The scope containing the variable, or null if not found
     */
    public hasVar(name: string): Scope | null {
        const variable = this.findVar(name);
        if (!variable) {
            return null;
        }
        return variable.scope;
    }

    /**
     * Determines whether a variable can be modified after declaration.
     *
     * @param variable - The variable to check for mutability
     * @returns True if the variable can be modified, false otherwise
     */
    public isVarMutable(variable: Variable): boolean {
        return variable.type === VariableType.Set || variable.type === VariableType.Var;
    }

    /**
     * Retrieves the current value and metadata for a variable.
     *
     * This method searches for the variable through the scope hierarchy and
     * returns comprehensive information including the variable definition,
     * its containing scope, and the current stored value. The value is
     * retrieved from the appropriate storage mechanism based on the scope type.
     *
     * @param name - The name of the variable to retrieve
     * @returns An object containing the variable, its scope, and current value,
     *          or null if the variable is not found
     */
    public getVar(name: string): VariableData | null {
        const variable = this.findVar(name);
        if (!variable) {
            return null;
        }

        const data = variable.scope.readVar(name, variable.variable);
        return { variable: variable.variable, scope: variable.scope, data: data };
    }

    /**
     * Assigns a new value to an existing variable.
     *
     * This method updates the value of a variable that has been previously
     * declared. The variable must exist and be mutable (not declared as 'const').
     * The value is stored using the appropriate mechanism for the variable's
     * containing scope.
     *
     * @param name - The name of the variable to update
     * @param value - The new value to assign to the variable
     * @throws Error if the variable does not exist or is immutable
     */
    public setVar(name: string, value: unknown): void {
        const variable = this.findVar(name);
        if (!variable) {
            throw new Error(`Variable ${name} not found`);
        }
        variable.scope.writeVar(name, variable.variable, value);
    }

    /**
     * Declares a new variable within this scope.
     *
     * This method creates a variable definition and registers it in the current
     * scope. The variable becomes available for use within this scope and any
     * nested scopes. If a variable with the same name already exists in this
     * scope, an error will be thrown.
     *
     * @param name - The name of the variable to declare
     * @param varDefinition - The variable definition containing type and other metadata
     * @throws Error if a variable with the same name already exists in this scope
     */
    public declareVar(name: string, varDefinition: Variable): void {
        this.createVar(name, varDefinition);
    }

    protected abstract readVar(name: string, variable: Variable): unknown;

    protected abstract writeVar(name: string, variable: Variable, value: unknown): void;

    protected abstract createVar(name: string, variable: Variable): void;

    protected findVar(name: string): VariableSearchResult | null {
        if (this.variables.has(name)) {
            return { variable: this.variables.get(name)!, scope: this };
        }
        if (this.parent) {
            return this.parent.findVar(name);
        }
        return null;
    };

    protected prefix(name: string): string {
        return `_[${this.type}]_${name}`;
    }
}


