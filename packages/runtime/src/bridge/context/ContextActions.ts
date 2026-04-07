import type { ExpressionNode } from "@narralang/core";
import { DevTools, LiveGame, Service, ServiceHandlerCtx, Story } from "narraleaf-react";
import { Evaluator } from "./evaluator/Evaluator";
import { DataType } from "./services/Data";
import { ModuleScope } from "./services/ModuleScope";
import { ProcedureScope } from "./services/ProcedureScope";
import { VariableType } from "./services/Variables";
import { createServiceHelperPlugin } from "./plugin/ServiceHelper";

type StoryConstructorConfig = ConstructorParameters<typeof Story>[1];

export enum ContextActionType {
    InitSceneScope = "initSceneScope",

    SugarCall = "sugarCall",
    DefineScene = "defineScene",
    DeclareVariable = "declareVariable",
    SetVariable = "setVariable",
}

export interface RuntimeContext {
    actionService: ContextActionsService;
    story: Story;
}

export type ContextActionProps = {
    [ContextActionType.InitSceneScope]: {
        sceneName: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    [ContextActionType.SugarCall]: {
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    [ContextActionType.DefineScene]: {
    };
    [ContextActionType.DeclareVariable]: {
        name: string;
        type: VariableType;
    };
    [ContextActionType.SetVariable]: {
        name: string;
        value: DataType | [evaluator: Evaluator, value: ExpressionNode];
    };
};

type ContextActionServiceContent = {
    [K in ContextActionType]: [ContextActionProps[K]];
};

export class ContextActionsService extends Service<ContextActionServiceContent> {
    public static CAS_SERVICE_NAME = "narralang:context-actions";

    public static createContext(liveGame: LiveGame, config?: StoryConstructorConfig): RuntimeContext {
        const story = new Story("narralang", config);
        const rootScope = new ModuleScope("[[narralang-runtime]]", liveGame);
        const service = new ContextActionsService(rootScope, liveGame);

        story.registerService(ContextActionsService.CAS_SERVICE_NAME, service);
        liveGame.game.use(createServiceHelperPlugin(story, service));

        return {
            actionService: service,
            story,
        };
    }

    private currentSceneScope: ProcedureScope | null;
    public rootScope: ModuleScope;
    public liveGame: LiveGame;

    constructor(rootScope: ModuleScope, liveGame: LiveGame) {
        super();

        this.currentSceneScope = null;
        this.rootScope = rootScope;
        this.liveGame = liveGame;
        this.initActions();
    }

    private initActions(): void {
        this.on(ContextActionType.InitSceneScope, callback<ContextActionType.InitSceneScope>((_ctx, { sceneName }) => {
            this.currentSceneScope = this.createSceneScope(sceneName);
        }));

        this.on(ContextActionType.DeclareVariable, callback<ContextActionType.DeclareVariable>((_ctx, { name, type }) => {
            const scope = this.currentSceneScope;
            if (!scope) {
                throw new Error("No current scene scope found when trying to declare variable");
            }
            scope.declareVar(name, { type });
        }));
        this.on(ContextActionType.SetVariable, callback<ContextActionType.SetVariable>((ctx, { name, value }) => {
            const scope = this.currentSceneScope;
            if (!scope) {
                throw new Error("No current scene scope found when trying to set variable");
            }

            if (Array.isArray(value)) {
                const [evaluator, node] = value;
                scope.setVar(name, evaluator.evaluateExpression(node));
            } else {
                scope.setVar(name, value);
            }
        }));
    }

    public $setVar(
        name: string,
        value: DataType | [evaluator: Evaluator, value: ExpressionNode],
    ): ReturnType<ContextActionsService["trigger"]> {
        return this.trigger(ContextActionType.SetVariable, { name, value });
    }

    public $declareVariable(name: string, type: VariableType): ReturnType<ContextActionsService["trigger"]> {
        return this.trigger(ContextActionType.DeclareVariable, { name, type });
    }

    init(): void {
        // Deprecated
    }

    serialize(): Record<string, unknown> | null {
        return null;
    }

    deserialize(): void {
        // this.currentSceneScope = this.createSceneScope(this.liveGame.getGameState()?.getCurrentSceneName() ?? "");
    }

    private createSceneScope(sceneName: string): ProcedureScope {
        const scene = this.liveGame.getGameState()?.getSceneByName(sceneName);
        if (!scene) {
            throw new Error(`Scene ${sceneName} not found`);
        }
        const sceneNamespace = this.liveGame.getStorable().getNamespace(DevTools.getNamespaceName(scene.local));
        if (!sceneNamespace) {
            throw new Error(`Scene namespace not found for scene ${sceneName}`);
        }
        
        return new ProcedureScope(sceneNamespace, this.rootScope);
    }
}

function callback<T extends ContextActionType>(cb: (ctx: ServiceHandlerCtx, ...args: [ContextActionProps[T]]) => void) {
    return (ctx: ServiceHandlerCtx, ...args: [ContextActionProps[T]]) => {
        cb(ctx, ...args);
    };
}
