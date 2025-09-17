import * as fs from 'node:fs/promises'
import * as path from "node:path"
import * as process from 'node:process'
import * as esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: false,
  sourcemap: false,
  outfile: 'dist/cjs/index.cjs',
  platform: 'neutral',
  target: ['es2020'],
  format: 'cjs',
})
  .catch(() => process.exit(1))

esbuild.build({
  entryPoints: ['src/**/*.ts'],
  outdir: 'dist/es',
  platform: 'neutral',
  target: ['es2020'],
  format: 'esm',
})
  .catch(() => process.exit(1))

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  outfile: 'dist/index.min.js',
  platform: 'browser',
  target: ['es2020'],
  format: 'esm',
})
  .catch(() => process.exit(1))

const denoBuild = async () => {
  const SRC_DIR = path.resolve("src");
  const OUT_DIR = path.resolve("dist", "deno");

  const patterns = [
    {
      re: /(from\s+)(['"])(\.{1,2}\/[^'"]+)\.js\2/g,
      replace: (_m, from, q, rel) => `${from}${q}${rel}.ts${q}`,
    }
  ]

  const cleanDir = async (dir) => {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch { }
    await fs.mkdir(dir, { recursive: true });
  }

  async function* walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) yield* walk(p);
      else yield p;
    }
  }

  const rewrite = (content) => {
    let out = content;
    for (const { re, replace } of patterns) out = out.replace(re, replace);
    return out;
  }

  await cleanDir(OUT_DIR);

  for await (const file of walk(SRC_DIR)) {
    const rel = path.relative(SRC_DIR, file);
    const dest = path.join(OUT_DIR, rel);

    await fs.mkdir(path.dirname(dest), { recursive: true });

    if (/\.(ts|mts|tsx|cts|json|md|txt)$/i.test(file)) {
      const txt = await fs.readFile(file, "utf8");
      const rewritten = file.endsWith(".ts") ? rewrite(txt) : txt;
      await fs.writeFile(dest, rewritten);
    } else {
      // copy other assets as-is
      await fs.copyFile(file, dest);
    }
  }
}

denoBuild().catch(console.error);
