import { spawnSync } from "node:child_process";

const executable = process.platform === "win32" ? "genvm-lint.exe" : "genvm-lint";
const result = spawnSync(executable, ["check", "contracts/truss_registry.py"], {
  cwd: process.cwd(), stdio: "inherit", shell: process.platform === "win32",
  env: { ...process.env, PYTHONIOENCODING: "utf-8", GENVM_VERSION: "v0.3.0-rc7" },
});
if (result.error) {
  console.error("Install the pinned requirements from requirements.txt before checking the contract.");
  process.exit(2);
}
process.exit(result.status ?? 1);
