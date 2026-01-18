export type SceneMetadata = {
    name: string;
}

export class SceneRuntime {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    public getMetadata(): SceneMetadata {
        return {
            name: this.name,
        };
    }
}
