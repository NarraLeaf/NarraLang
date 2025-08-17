// Export all statement parsers
export { parseVariableDeclaration } from "./VariableDeclaration";
export { 
    parseFunctionDeclaration, 
    parseMacroDeclaration, 
    parseCleanupDeclaration 
} from "./FunctionDeclaration";

// Export statement types
export * from "./Statement";
