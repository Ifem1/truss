import {createHash} from "node:crypto";import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../contracts/truss_registry.py",import.meta.url));console.log(createHash("sha256").update(source).digest("hex"));
