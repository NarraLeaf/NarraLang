import { Service, ServiceHandlerCtx } from "narraleaf-react";
import { BaseDataType } from "./services/Data";
import { ModuleScope } from "./services/ModuleScope";
import { ProcedureScope } from "./services/ProcedureScope";

export enum ContextActionType {
    SugarCall = "sugarCall",
    DefineScene = "defineScene",
    SetVariable = "setVariable",
}

export interface RuntimeContext {
    rootScope: ModuleScope;
}

export type ContextActionProps = {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    [ContextActionType.SugarCall]: {
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    [ContextActionType.DefineScene]: {
    };
    [ContextActionType.SetVariable]: {
        sceneName: string;
        name: string;
        value: BaseDataType;
    };
};


export class ContextActionsService extends Service {
    private sceneCtx: Map<string, ProcedureScope>;

    constructor() {
        super();

        this.sceneCtx = new Map();
        this.initActions();
    }

    private initActions(): void {
        // this.on(ContextActionType.SugarCall, (action: ContextAction) => {
        // });
        // this.on(ContextActionType.DefineScene, (action: ContextAction) => {
        // });
        this.on(ContextActionType.SetVariable, callback<ContextActionType.SetVariable>((ctx, { sceneName, name, value }) => {
            const scope = this.sceneCtx.get(sceneName);
            if (!scope) {
                throw new Error(`Scene ${sceneName} not found`);
            }
            scope.setVar(name, value);
        }));
    }

    public setVariable(sceneName: string, name: string, value: BaseDataType) {
        return this.trigger(ContextActionType.SetVariable, { sceneName, name, value });
    }

    init(): void {
        // Deprecated
    }

    serialize(): Record<string, unknown> | null {
        return null;
    }
 
    deserialize(): void {
    }
}

function callback<T extends ContextActionType>(cb: (ctx: ServiceHandlerCtx, ...args: [ContextActionProps[T]]) => void) {
    return (ctx: ServiceHandlerCtx, ...args: [ContextActionProps[T]]) => {
        cb(ctx, ...args);
    };
}
