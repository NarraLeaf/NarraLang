import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const isDev = process.argv.includes("--dev");

const specs = {
  share: {
    entry: "packages/share/src/index.ts",
    outdir: "packages/share/dist",
    external: [],
  },
  core: {
    entry: "packages/core/src/index.ts",
    outdir: "packages/core/dist",
    external: ["@narralang/share"],
  },
  runtime: {
    entry: "packages/runtime/src/index.ts",
    outdir: "packages/runtime/dist",
    external: ["@narralang/core", "@narralang/share", "narraleaf-react"],
  },
  nlc: {
    entries: [
      ["packages/nlc/src/index.ts", "index"],
      ["packages/nlc/src/cli.ts", "cli"],
    ],
    outdir: "packages/nlc/dist",
    external: ["@narralang/core", "@narralang/share"],
  },
};

const pkg = process.argv[2];
if (!pkg || !specs[pkg]) {
  console.error("Usage: node project/esbuild-package.mjs <share|core|runtime|nlc> [--dev]");
  process.exit(1);
}

const spec = specs[pkg];

async function buildOne(entry, baseName, outdir, external) {
  const common = {
    bundle: true,
    platform: "node",
    target: "node22",
    logLevel: "info",
    sourcemap: isDev,
    external,
  };
  await esbuild.build({
    ...common,
    entryPoints: [path.join(root, entry)],
    outfile: path.join(root, outdir, `${baseName}.mjs`),
    format: "esm",
  });
  await esbuild.build({
    ...common,
    entryPoints: [path.join(root, entry)],
    outfile: path.join(root, outdir, `${baseName}.cjs`),
    format: "cjs",
  });
}

try {
  if (spec.entries) {
    for (const [entry, base] of spec.entries) {
      await buildOne(entry, base, spec.outdir, spec.external);
    }
  } else {
    await buildOne(spec.entry, "index", spec.outdir, spec.external);
  }
} catch {
  process.exit(1);
}
