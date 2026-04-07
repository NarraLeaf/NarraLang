import type { FunctionDeclarationNode, FunctionExpressionNode, MacroDeclarationNode } from "@narralang/core";
import { ModuleMetadata } from "./Module";
import { SceneMetadata } from "./SceneRuntime";

export type AtomDataType = null | boolean | number | string;
export enum DataTypeKind {
    Null,
    Boolean,
    Number,
    String,
    Object,
    Array,
    Function,
    Macro,
    Module,
    Scene,
}
// Type mapping from DataTypeKind to actual value types
export type DataTypeValue<T extends DataTypeKind> = T extends DataTypeKind.Null
    ? null
    : T extends DataTypeKind.Boolean
    ? boolean
    : T extends DataTypeKind.Number
    ? number
    : T extends DataTypeKind.String
    ? string
    : T extends DataTypeKind.Object
    ? Record<string, object>
    : T extends DataTypeKind.Array
    ? Array<DataType>
    : T extends DataTypeKind.Function
    ? (FunctionDeclarationNode | FunctionExpressionNode)
    : T extends DataTypeKind.Macro
    ? MacroDeclarationNode
    : T extends DataTypeKind.Module
    ? ModuleMetadata
    : T extends DataTypeKind.Scene
    ? SceneMetadata
    : never;

export type DataType = {
    type: DataTypeKind.Null;
    value: DataTypeValue<DataTypeKind.Null>;
} | {
    type: DataTypeKind.Boolean;
    value: DataTypeValue<DataTypeKind.Boolean>;
} | {
    type: DataTypeKind.Number;
    value: DataTypeValue<DataTypeKind.Number>;
} | {
    type: DataTypeKind.String;
    value: DataTypeValue<DataTypeKind.String>;
} | {
    type: DataTypeKind.Object;
    value: DataTypeValue<DataTypeKind.Object>;
} | {
    type: DataTypeKind.Array;
    value: DataTypeValue<DataTypeKind.Array>;
} | {
    type: DataTypeKind.Function;
    value: DataTypeValue<DataTypeKind.Function>;
} | {
    type: DataTypeKind.Macro;
    value: DataTypeValue<DataTypeKind.Macro>;
} | {
    type: DataTypeKind.Module;
    value: DataTypeValue<DataTypeKind.Module>;
} | {
    type: DataTypeKind.Scene;
    value: DataTypeValue<DataTypeKind.Scene>;
};
