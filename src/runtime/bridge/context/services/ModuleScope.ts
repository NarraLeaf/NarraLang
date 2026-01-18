import { LiveGame, Namespace } from "narraleaf-react";
import { ModuleRuntime } from "./Module";
import { SceneRuntime } from "./SceneRuntime";
import { Scope, ScopeType, Variable, VariableType, VariableSearchResult } from "./Variables";
import { DataType, DataTypeKind } from "./Data";
import { mapToObject } from "@/runtime/utils/data";

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

    protected readVar(name: string, variable: Variable): DataType | null {
        if (variable.type === VariableType.Module) {
            const module = this.getModule(name);
            if (!module) {
                return { type: DataTypeKind.Null, value: null };
            }
            return { type: DataTypeKind.Module, value: module.getMetadata() };
        }
        if (variable.type === VariableType.Scene) {
            const scene = this.getScene(name);
            if (!scene) {
                return { type: DataTypeKind.Null, value: null };
            }
            return { type: DataTypeKind.Scene, value: scene.getMetadata() };
        }
        return this.getNamespace().get(this.prefixModule(name));
    }

    protected writeVar(name: string, variable: Variable, value: DataType): void {
        if (!this.isVarMutable(variable)) {
            throw new Error(`Variable ${name} is not mutable`);
        }
        this.getNamespace().set(this.prefixModule(name), value);
    }

    protected createVar(name: string, variable: Variable): void {
        if (this.variables.has(name)) {
            throw new Error(`Variable ${name} already declared`);
        }
        this.asserts(name, variable, [VariableType.Module, VariableType.Scene, VariableType.Const, VariableType.Set]);

        this.variables.set(name, variable);
    }

    public findVar(name: string): VariableSearchResult | null {
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

    protected override writeDeclare(): void {
        this.getNamespace().set(this.prefixModule("[[variables]]"), { type: DataTypeKind.Object, value: mapToObject<Variable>(this.variables) });
    }

    protected override readDeclare(): void {
        const variables = this.getNamespace().get(this.prefixModule("[[variables]]")) as { type: DataTypeKind.Object, value: Record<string, Variable> };
        if (!variables) {
            return;
        }
        for (const [name, variable] of Object.entries(variables.value)) {
            this.variables.set(name, variable);
        }
    }

    private initialize() {
        const storable = this.liveGame.getStorable();
        if (!storable.hasNamespace(this.prefixModule(this.moduleName))) {
            const namespace = new Namespace<Record<string, DataType>>(this.prefixModule(this.moduleName), {});
            storable.addNamespace(namespace);
        }
    }

    private getNamespace(): Namespace<Record<string, DataType>> {
        const storable = this.liveGame.getStorable();
        const namespace = storable.getNamespace<Record<string, DataType>>(this.prefixModule(this.moduleName));
        return namespace;
    }

    private prefixModule(name: string): string {
        return `_[${this.type}]_${name}`;
    }
}
