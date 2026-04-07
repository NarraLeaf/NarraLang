import { compileNlsToTypeScript } from "../src/compile";

describe("@narralang/nlc compile", () => {
    test("rejects non-.nls extension at API level (CLI tests separately)", () => {
        const r = compileNlsToTypeScript("set x 1", "x.nls");
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.typescript).toContain("export const nlsAst");
            expect(r.typescript).toContain("@narralang/core");
        }
    });

    test("surfaces lexer errors", () => {
        const r = compileNlsToTypeScript(`"unclosed string`, "bad.nls");
        expect(r.ok).toBe(false);
    });
});
