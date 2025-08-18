import { ParserContextType } from "./ParserContextType";

export interface ParserContextDefinition {
    type: ParserContextType;
}

export abstract class ParserContext implements ParserContextDefinition {
    abstract type: ParserContextType;
}

export class ParserRootContext extends ParserContext {
    type = ParserContextType.Root;
}

export class ParserContextStack {
    ctx: ParserContext[];
    root: ParserRootContext;

    constructor() {
        this.ctx = [];
        this.root = new ParserRootContext();
    }

    public push(ctx: ParserContext) {
        this.ctx.push(ctx);
    }

    public pop(): ParserContext | null {
        return this.ctx.pop() ?? null;
    }

    public dispose(ctx: ParserContext) {
        const index = this.ctx.lastIndexOf(ctx);
        if (index === -1) {
            return;
        }
        this.ctx.splice(index, 1);
    }

    public peek(): ParserContext {
        const ctx = this.ctx.at(-1);
        if (!ctx) {
            return this.root;
        }
        return ctx;
    }
    
    public getParent(ctx: ParserContext | null = null): ParserContext {
        if (!ctx) {
            return this.ctx.at(-1) ?? this.root;
        }

        const index = this.ctx.lastIndexOf(ctx);
        if (index === -1) {
            return this.root;
        }
        return this.ctx[index - 1];
    }

    public find(fn: (ctx: ParserContext) => boolean): ParserContext | null {
        for (const ctx of this.ctx) {
            if (fn(ctx)) {
                return ctx;
            }
        }
        return null;
    }

    public context<T>(ctx: ParserContext, fn: () => T): T {
        this.push(ctx);
        const result = fn();

        this.dispose(ctx);

        return result;
    }

    public has(type: ParserContextType): boolean {
        for (const ctx of this.ctx) {
            if (ctx.type === type) {
                return true;
            }
        }
        return false;
    }
}
