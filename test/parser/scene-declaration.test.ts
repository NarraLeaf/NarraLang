import { lexer, parse } from "../../src";
import { LexerError } from "../../src/core/lexer/LexerError";
import { NodeType } from "../../src/core/parser/Node";
import { SceneDeclarationNode } from "../../src/core/parser/statement/Statement";

describe('Scene Declaration Tests', () => {
    describe('Basic scene syntax', () => {
        test('should parse simple scene without modifiers', () => {
            const code = `
scene IntroScene {
    set x 1
}
            `;
            
            const tokens = lexer(code);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error: ${tokens.message}`);
            }
            
            const result = parse(tokens);
            
            expect(result.nodes).toHaveLength(1);
            expect(result.nodes[0].type).toBe(NodeType.SceneDeclaration);
            
            const scene = result.nodes[0] as SceneDeclarationNode;
            expect(scene.name).toBe('IntroScene');
            expect(Object.keys(scene.modifiers)).toHaveLength(0);
            expect(scene.body).toHaveLength(1);
        });

        test('should parse scene with single modifier', () => {
            const code = `
scene DialogueScene(bg "room.png") {
    set y 2
}
            `;
            
            const tokens = lexer(code);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error: ${tokens.message}`);
            }
            
            const result = parse(tokens);
            
            expect(result.nodes).toHaveLength(1);
            expect(result.nodes[0].type).toBe(NodeType.SceneDeclaration);
            
            const scene = result.nodes[0] as SceneDeclarationNode;
            expect(scene.name).toBe('DialogueScene');
            expect(Object.keys(scene.modifiers)).toHaveLength(1);
            expect(scene.modifiers.bg).toBeDefined();
            expect(scene.modifiers.bg.type).toBe(NodeType.StringExpression);
        });

        test('should parse scene with multiple modifiers', () => {
            const code = `
scene ComplexScene(
    bg "sunset.png",
    music "bgm.mp3",
    transition "fade"
) {
    set z 3
}
            `;
            
            const tokens = lexer(code);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error: ${tokens.message}`);
            }
            
            const result = parse(tokens);
            
            expect(result.nodes).toHaveLength(1);
            expect(result.nodes[0].type).toBe(NodeType.SceneDeclaration);
            
            const scene = result.nodes[0] as SceneDeclarationNode;
            expect(scene.name).toBe('ComplexScene');
            expect(Object.keys(scene.modifiers)).toHaveLength(3);
            expect(scene.modifiers.bg).toBeDefined();
            expect(scene.modifiers.music).toBeDefined();
            expect(scene.modifiers.transition).toBeDefined();
        });
    });

    describe('Scene with dialogue and statements', () => {
        test('should parse scene with variable declarations', () => {
            const code = `
scene TestScene {
    set name "Alice"
    const age 25
}
            `;
            
            const tokens = lexer(code);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error: ${tokens.message}`);
            }
            
            const result = parse(tokens);
            
            expect(result.nodes).toHaveLength(1);
            const scene = result.nodes[0] as SceneDeclarationNode;
            expect(scene.name).toBe('TestScene');
            expect(scene.body).toHaveLength(2);
        });

        test('should parse scene with control flow', () => {
            const code = `
scene ControlScene {
    set x 10
    
    if x is greater than 5 {
        set y 20
    }
    
    loop 3 times {
        set counter 1
    }
}
            `;
            
            const tokens = lexer(code);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error: ${tokens.message}`);
            }
            
            const result = parse(tokens);
            
            expect(result.nodes).toHaveLength(1);
            const scene = result.nodes[0] as SceneDeclarationNode;
            expect(scene.name).toBe('ControlScene');
            expect(scene.body.length).toBeGreaterThan(0);
        });
    });

    describe('Scene modifier expressions', () => {
        test('should parse scene with expression modifiers', () => {
            const code = `
scene ExprScene(
    bg "assets/" + "bg.png",
    volume 0.5 * 2
) {
    set ready true
}
            `;
            
            const tokens = lexer(code);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error: ${tokens.message}`);
            }
            
            const result = parse(tokens);
            
            expect(result.nodes).toHaveLength(1);
            const scene = result.nodes[0] as SceneDeclarationNode;
            expect(scene.name).toBe('ExprScene');
            expect(Object.keys(scene.modifiers)).toHaveLength(2);
            expect(scene.modifiers.bg.type).toBe(NodeType.BinaryExpression);
            expect(scene.modifiers.volume.type).toBe(NodeType.BinaryExpression);
        });

        test('should parse scene with variable reference modifiers', () => {
            const code = `
set bgImage "background.png"
set bgMusic "music.mp3"

scene VarScene(
    bg bgImage,
    music bgMusic
) {
    set started true
}
            `;
            
            const tokens = lexer(code);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error: ${tokens.message}`);
            }
            
            const result = parse(tokens);
            
            expect(result.nodes).toHaveLength(3);
            expect(result.nodes[2].type).toBe(NodeType.SceneDeclaration);
            
            const scene = result.nodes[2] as SceneDeclarationNode;
            expect(scene.name).toBe('VarScene');
            expect(scene.modifiers.bg.type).toBe(NodeType.Identifier);
            expect(scene.modifiers.music.type).toBe(NodeType.Identifier);
        });
    });

    describe('Multiple scenes', () => {
        test('should parse multiple scene declarations', () => {
            const code = `
scene Scene1 {
    set a 1
}

scene Scene2(bg "test.png") {
    set b 2
}

scene Scene3 {
    set c 3
}
            `;
            
            const tokens = lexer(code);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error: ${tokens.message}`);
            }
            
            const result = parse(tokens);
            
            expect(result.nodes).toHaveLength(3);
            expect(result.nodes[0].type).toBe(NodeType.SceneDeclaration);
            expect(result.nodes[1].type).toBe(NodeType.SceneDeclaration);
            expect(result.nodes[2].type).toBe(NodeType.SceneDeclaration);
            
            const scene1 = result.nodes[0] as SceneDeclarationNode;
            const scene2 = result.nodes[1] as SceneDeclarationNode;
            const scene3 = result.nodes[2] as SceneDeclarationNode;
            
            expect(scene1.name).toBe('Scene1');
            expect(scene2.name).toBe('Scene2');
            expect(scene3.name).toBe('Scene3');
        });
    });

    describe('Edge cases', () => {
        test('should parse scene with empty body', () => {
            const code = `
scene EmptyScene {
}
            `;
            
            const tokens = lexer(code);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error: ${tokens.message}`);
            }
            
            const result = parse(tokens);
            
            expect(result.nodes).toHaveLength(1);
            const scene = result.nodes[0] as SceneDeclarationNode;
            expect(scene.name).toBe('EmptyScene');
            expect(scene.body).toHaveLength(0);
        });

        test('should parse scene with trailing comma in modifiers', () => {
            const code = `
scene TrailingScene(
    bg "test.png",
    music "test.mp3",
) {
    set done true
}
            `;
            
            const tokens = lexer(code);
            if (LexerError.isLexerError(tokens)) {
                throw new Error(`Lexer error: ${tokens.message}`);
            }
            
            const result = parse(tokens);
            
            expect(result.nodes).toHaveLength(1);
            const scene = result.nodes[0] as SceneDeclarationNode;
            expect(scene.name).toBe('TrailingScene');
            expect(Object.keys(scene.modifiers)).toHaveLength(2);
        });
    });
});
