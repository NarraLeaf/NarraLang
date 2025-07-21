
export enum KeywordType {
    Var,
    Set,
    Const,
    Local,
    Function,
    Macro,
    Cleanup,
    Overload,

    If,
    Else,
    While,
    For,
    Loop,
    Break,
    Continue,
    Return,
    ForEach,

    Debugger,
    As,
    Declare,
    Satisfy,
    Class,
    Private,
    Public,
    Throw,
}

export const Keywords: {
    [K in KeywordType]: string | string[];
} = {
    [KeywordType.Var]: "var",
    [KeywordType.Set]: "set",
    [KeywordType.Const]: "const",
    [KeywordType.Local]: "local",
    [KeywordType.Function]: "function",
    [KeywordType.Macro]: "function!",
    [KeywordType.Cleanup]: "cleanup",
    [KeywordType.Overload]: "overload",

    [KeywordType.If]: "if",
    [KeywordType.Else]: "else",
    [KeywordType.While]: "while",
    [KeywordType.For]: "for",
    [KeywordType.Loop]: "loop",
    [KeywordType.Break]: "break",
    [KeywordType.Continue]: "continue",
    [KeywordType.Return]: "return",
    [KeywordType.ForEach]: ["for", "each"],

    [KeywordType.Debugger]: "debugger",
    [KeywordType.As]: "as",
    [KeywordType.Declare]: "declare",
    [KeywordType.Satisfy]: "satisfy",
    [KeywordType.Class]: "class",
    [KeywordType.Private]: "private",
    [KeywordType.Public]: "public",
    [KeywordType.Throw]: "throw",
};
