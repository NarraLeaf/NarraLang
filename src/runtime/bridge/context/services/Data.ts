
export type BaseDataType = null | boolean | number | string | object | Array<unknown> | Map<string, unknown>;
export type DataType = BaseDataType | Array<DataType>;