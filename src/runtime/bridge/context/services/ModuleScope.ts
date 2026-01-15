import { LiveGame, Namespace } from "narraleaf-react";
import { ModuleRuntime } from "./Module";
import { SceneRuntime } from "./SceneRuntime";
import { Scope, ScopeType, Variable, VariableType, VariableSearchResult } from "./Variables";


export class ModuleScope extends Scope {
    private moduleName: string;
    private modules: Map<string, ModuleRuntime>;
    private scenes: Map<string, SceneRuntime>;
    private liveGame: LiveGame;

    constructor(moduleName: string, liveGame: LiveGame) {
        super(ScopeType.Module, null);
        this.moduleName = moduleName;
        this.modules = new Map();
        this.scenes = new Map();
        this.liveGame = liveGame;

        this.initialize();
    }

    public getName(): string {
        return this.moduleName;
    }

    public addModule(name: string, module: ModuleRuntime) {
        this.modules.set(name, module);
    }

    public addScene(name: string, scene: SceneRuntime) {
        this.scenes.set(name, scene);
    }

    public getModule(name: string): ModuleRuntime | null {
        return this.modules.get(name) ?? null;
    }

    public getScene(name: string): SceneRuntime | null {
        return this.scenes.get(name) ?? null;
    }

    protected readVar(name: string, variable: Variable): unknown {
        if (variable.type === VariableType.Module) {
            return this.getModule(name) ?? null;
        }
        if (variable.type === VariableType.Scene) {
            return this.getScene(name) ?? null;
        }
        return this.getNamespace().get(this.prefix(name));
    }

    protected writeVar(name: string, variable: Variable, value: unknown): void {
        if (!this.isVarMutable(variable)) {
            throw new Error(`Variable ${name} is not mutable`);
        }
        this.getNamespace().set(this.prefix(name), value);
    }

    protected createVar(name: string, variable: Variable): void {
        if (this.variables.has(name)) {
            throw new Error(`Variable ${name} already declared`);
        }
        this.variables.set(name, variable);
    }

    protected findVar(name: string): VariableSearchResult | null {
        if (this.variables.has(name)) {
            return { variable: this.variables.get(name)!, scope: this };
        }
        if (this.modules.has(name)) {
            return { variable: { type: VariableType.Module }, scope: this };
        }
        if (this.scenes.has(name)) {
            return { variable: { type: VariableType.Scene }, scope: this };
        }
        return super.findVar(name);
    }

    private initialize() {
        const storable = this.liveGame.getStorable();
        if (!storable.hasNamespace(this.prefix(this.moduleName))) {
            const namespace = new Namespace<Record<string, unknown>>(this.prefix(this.moduleName), {});
            storable.addNamespace(namespace);
        }
    }

    private getNamespace(): Namespace<Record<string, unknown>> {
        const storable = this.liveGame.getStorable();
        const namespace = storable.getNamespace<Record<string, unknown>>(this.prefix(this.moduleName));
        return namespace;
    }
}
