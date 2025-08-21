import { Tokens } from "../lexer/TokenType";
import { ParsedNode, StatementNode } from "./Node";
import { createParserIterator } from "./ParserIterator";
import { parseStatement } from "./statement";


export function parse(tokens: Tokens[]): ParsedNode[] {
    const iterator = createParserIterator(tokens);
    const result: StatementNode[] = [];
    while (!iterator.isDone()) {
        const statement = parseStatement(iterator);
        if (statement) {
            result.push(statement);
        }
    }
    return result;
}
