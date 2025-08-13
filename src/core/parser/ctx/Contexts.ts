import { ParserContext } from "./ParserContext";
import { ParserContextType } from "./ParserContextType";

export class ParserFunctionContext extends ParserContext {
    type = ParserContextType.Function;
}

export class ParserExpressionContext extends ParserContext {
    type = ParserContextType.Expression;
}

export class ParserProcedureContext extends ParserContext {
    type = ParserContextType.Procedure;
}

export class ParserMacroDeclarationContext extends ParserContext {
    type = ParserContextType.MacroDeclaration;

    constructor(public name: string) {
        super();
    }
}

export class ParserMacroBodyContext extends ParserContext {
    type = ParserContextType.MacroBody;
}

export class ParserLocalDeclarationContext extends ParserContext {
    type = ParserContextType.LocalDeclaration;
}
