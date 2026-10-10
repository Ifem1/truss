import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

for (const path of ["contracts/truss_registry.py", "contracts/release_activation_gate.py"]) {
  const source = await readFile(new URL(`../${path}`, import.meta.url));
  console.log(`${path} ${createHash("sha256").update(source).digest("hex")}`);
}
