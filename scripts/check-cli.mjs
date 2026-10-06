import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const expected = "0.39.1";
const pkg = JSON.parse(await readFile("node_modules/genlayer/package.json", "utf8"));
const executable = process.platform === "win32" ? "node_modules/.bin/genlayer.cmd" : "node_modules/.bin/genlayer";
if (pkg.version !== expected || !existsSync(executable)) {
  console.error(`Repository-local GenLayer CLI ${expected} is not installed; refusing a global fallback.`);
  process.exit(2);
}
const result = spawnSync("npx", ["--no-install", "genlayer", "--version"], { encoding: "utf8", shell: process.platform === "win32" });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0 || result.stdout.trim() !== expected) process.exit(result.status ?? 1);
