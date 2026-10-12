import { constants, createHash, createPrivateKey, createPublicKey, sign } from "node:crypto";
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPOSITORY = "Ifem1/truss";
const REPOSITORY_URL = "https://github.com/Ifem1/truss";
const WORKFLOW = "Ifem1/truss/.github/workflows/ci.yml";
const tag = process.env.TRUSS_RELEASE_TAG ?? "";
const output = process.env.TRUSS_RELEASE_OUTPUT ?? "release-output";
const privateKeyValue = process.env.TRUSS_RELEASE_SIGNING_KEY_B64 ?? "";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function ghJson(...args) {
  return JSON.parse(execFileSync("gh", ["api", ...args], { encoding: "utf8" }));
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

if (!/^[A-Za-z0-9][A-Za-z0-9._+-]{0,119}$/.test(tag)) throw new Error("Invalid release tag");
if (!privateKeyValue) throw new Error("TRUSS_RELEASE_SIGNING_KEY_B64 is required");

const commit = git("rev-parse", `refs/tags/${tag}^{commit}`).toLowerCase();
const tagObject = git("rev-parse", `refs/tags/${tag}`).toLowerCase();
if (git("cat-file", "-t", `refs/tags/${tag}`) !== "tag") {
  throw new Error("Release provenance requires an annotated Git tag object");
}
if (!/^[0-9a-f]{40}$/.test(commit) || !/^[0-9a-f]{40}$/.test(tagObject)) {
  throw new Error("Tag or commit object has an unexpected encoding");
}
try {
  git("merge-base", "--is-ancestor", commit, "origin/master");
} catch {
  throw new Error("Release tag must resolve to a commit already reachable from master");
}

const repo = ghJson(`repos/${REPOSITORY}`);
if (`${repo.full_name}` !== REPOSITORY || `${repo.id}` !== "1407596595") {
  throw new Error("GitHub repository identity does not match the frozen TRUSS identity");
}

const runs = ghJson(`repos/${REPOSITORY}/actions/workflows/ci.yml/runs?head_sha=${commit}&per_page=100`);
const run = (runs.workflow_runs ?? []).find((item) =>
  item.head_sha?.toLowerCase() === commit
  && item.head_branch === tag
  && item.event === "push"
  && item.conclusion === "success"
  && item.path === ".github/workflows/ci.yml",
);
if (!run) throw new Error("No successful CI push run was found for this exact annotated tag commit");

const privateKey = createPrivateKey(Buffer.from(privateKeyValue, "base64").toString("utf8"));
const publicJwk = createPublicKey(privateKey).export({ format: "jwk" });
const modulusHex = Buffer.from(publicJwk.n, "base64url").toString("hex");
const exponentHex = Buffer.from(publicJwk.e, "base64url").toString("hex");
const modulusBits = Buffer.from(publicJwk.n, "base64url")[0].toString(2).length
  + (Buffer.from(publicJwk.n, "base64url").length - 1) * 8;
if (modulusBits < 2048 || modulusBits > 4096 || exponentHex !== "010001") {
  throw new Error("Release signing key must be RSA 2048-4096 bits with exponent 65537");
}
const signerKeyId = `sha256:${createHash("sha256").update(canonical({ e: exponentHex, n: modulusHex })).digest("hex")}`;

// git archive is binary; use spawnSync so no text conversion can alter its bytes.
const { spawnSync } = await import("node:child_process");
const archiveResult = spawnSync("git", ["archive", "--format=tar", `--prefix=truss-${tag}/`, commit], { encoding: "buffer" });
if (archiveResult.status !== 0) throw new Error("Could not create source archive");
const exactArchive = gzipSync(archiveResult.stdout, { mtime: 0 });
if (!exactArchive.length) throw new Error("Source archive is empty");
const artifactSha256 = createHash("sha256").update(exactArchive).digest("hex");
const payload = {
  schema: "truss-release-manifest-v1",
  repository: REPOSITORY_URL,
  repository_id: `${repo.id}`,
  commit_sha: commit,
  release_tag: tag,
  tag_object_sha: tagObject,
  artifact_sha256: artifactSha256,
  ci_run_url: `https://api.github.com/repos/${REPOSITORY}/actions/runs/${run.id}`,
  ci_run_id: `${run.id}`,
  ci_workflow: `${WORKFLOW}@refs/tags/${tag}`,
  ci_event: "push",
  ci_conclusion: "success",
  signer_key_id: signerKeyId,
};
const signatureHex = sign("sha256", Buffer.from(canonical(payload), "utf8"), {
  key: privateKey,
  padding: constants.RSA_PKCS1_PADDING,
}).toString("hex");
const envelope = canonical({ payload, signature_hex: signatureHex });

mkdirSync(output, { recursive: true });
writeFileSync(join(output, "truss-source.tar.gz"), exactArchive);
writeFileSync(join(output, "release-manifest.json"), envelope, { encoding: "utf8" });
writeFileSync(join(output, "signer-public-key.json"), canonical({
  modulus_hex: modulusHex, exponent_hex: exponentHex, key_id: signerKeyId,
}));
console.log(JSON.stringify({ tag, commit, tagObject, artifactSha256, signerKeyId, ciRunId: `${run.id}` }));
