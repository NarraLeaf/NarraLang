// import esbuild from 'esbuild';
const esbuild = require('esbuild');

const isDev = process.argv.includes('--dev');

if (isDev) {
  console.log("Building in dev mode");
} else {
  console.log("Building in production mode");
}

const external = [];

const alias = {
  '@': './src',
  '@core': './src/core',
};

const common = {
  alias,
  bundle: true,
  loader: {
    ".ejs": "text",
  },
  logLevel: 'info',
  platform: 'node',
}

Promise.all([
  esbuild.build({
    ...common,
    entryPoints: ['src/index.ts'],
    external,
    format: 'esm',
    outfile: 'dist/index.mjs',
    target: 'node22',
    sourcemap: isDev,
  }),
  esbuild.build({
    ...common,
    entryPoints: ['src/index.ts'],
    external,
    format: 'cjs',
    outfile: 'dist/index.cjs',
    sourcemap: isDev,
    target: 'node22'
  }),
]).catch(() => process.exit(1));
