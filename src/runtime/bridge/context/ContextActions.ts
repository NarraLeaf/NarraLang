import { Scope, Variables } from "./services/Variables";

export enum ContextActionType {
    SugarCall = "sugarCall",
    DefineScene = "defineScene",
}

export interface RuntimeContext {
    rootScope: Scope;
}
