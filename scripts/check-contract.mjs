import { spawnSync } from "node:child_process";

const executable = process.platform === "win32" ? "genvm-lint.exe" : "genvm-lint";
for (const source of ["contracts/truss_registry.py", "contracts/release_activation_gate.py", "contracts/web_access_probe.py", "contracts/cross_contract_view_source.py", "contracts/cross_contract_view_probe.py"]) {
  const result = spawnSync(executable, ["check", source], {
    cwd: process.cwd(), stdio: "inherit", shell: process.platform === "win32",
    env: { ...process.env, PYTHONIOENCODING: "utf-8", GENVM_VERSION: "v0.3.0-rc7" },
  });
  if (result.error) {
    console.error("Install the pinned requirements from requirements.txt before checking the contracts.");
    process.exit(2);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
