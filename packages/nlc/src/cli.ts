#!/usr/bin/env node
/* eslint-disable no-console -- CLI entry writes to stderr/stdout */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { compileNlsToTypeScript } from "./compile";

function usage(): never {
    console.error("Usage: nlc <input.nls> [output.ts]");
    process.exit(1);
}

function main(): void {
    const argv = process.argv.slice(2);
    if (argv.length < 1 || argv[0] === "-h" || argv[0] === "--help") {
        usage();
    }
    const input = path.resolve(argv[0]);
    const outArg = argv[1];
    const ext = path.extname(input).toLowerCase();
    if (ext !== ".nls") {
        console.error(`Expected .nls input, got: ${ext || "(none)"}`);
        process.exit(1);
    }
    let source: string;
    try {
        source = fs.readFileSync(input, "utf8");
    } catch (e) {
        console.error(e instanceof Error ? e.message : String(e));
        process.exit(1);
    }
    const result = compileNlsToTypeScript(source, path.basename(input));
    if (!result.ok) {
        console.error(result.error.message);
        process.exit(1);
    }
    const outPath = outArg
        ? path.resolve(outArg)
        : path.join(path.dirname(input), `${path.basename(input, ".nls")}.generated.ts`);
    try {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, result.typescript, "utf8");
    } catch (e) {
        console.error(e instanceof Error ? e.message : String(e));
        process.exit(1);
    }
    console.log(outPath);
}

main();
