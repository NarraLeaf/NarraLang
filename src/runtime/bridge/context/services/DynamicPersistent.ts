import { Persistent } from "narraleaf-react";

type DynamicPersistentData = {
    [K in string]: unknown;
};

export class DynamicPersistent extends Persistent<DynamicPersistentData> {
    declare protected namespace: string;
    declare protected readonly defaultContent: DynamicPersistentData;
    declare protected prefix: (c: string, prefix: string) => string;

    constructor(namespace: string) {
        super(namespace, {});
        this.namespace = this.prefix(namespace, "nlang");
    }
}
