import { NodeTrace } from "./Node";


export function trace(start: number, end: number | null): NodeTrace {
    return { start, end };
}
