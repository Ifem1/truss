import { constants, createHash, createPublicKey, verify } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const directory = resolve(process.argv[2] ?? "docs/attestations/v0.1.4");
const expectedTag = process.argv[3] ?? "v0.1.4";
const expectedRepository = "https://github.com/Ifem1/truss";
const expectedRepositoryId = "1407596595";

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fail(message) {
  console.error(`RELEASE VERIFICATION FAILED: ${message}`);
  process.exitCode = 1;
}

try {
  const envelopeText = readFileSync(resolve(directory, "release-manifest.json"), "utf8");
  const keyText = readFileSync(resolve(directory, "signer-public-key.json"), "utf8");
  const archive = readFileSync(resolve(directory, "truss-source.tar.gz"));
  const envelope = JSON.parse(envelopeText);
  const key = JSON.parse(keyText);
  const expectedEnvelopeFields = ["payload", "signature_hex"];
  const expectedKeyFields = ["exponent_hex", "key_id", "modulus_hex"];
  if (Object.keys(envelope).sort().join(",") !== expectedEnvelopeFields.sort().join(",")
      || Object.keys(key).sort().join(",") !== expectedKeyFields.sort().join(",")) {
    throw new Error("unexpected envelope or public-key fields");
  }
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("manifest payload is not an object");
  const expectedPayloadFields = [
    "artifact_sha256", "ci_conclusion", "ci_event", "ci_run_id", "ci_run_url", "ci_workflow",
    "commit_sha", "release_tag", "repository", "repository_id", "schema", "signer_key_id", "tag_object_sha",
  ];
  if (Object.keys(payload).sort().join(",") !== expectedPayloadFields.sort().join(",")) {
    throw new Error("unexpected manifest payload fields");
  }
  const modulusHex = String(key.modulus_hex ?? "").toLowerCase();
  const exponentHex = String(key.exponent_hex ?? "").toLowerCase();
  if (!/^[0-9a-f]{512,1024}$/.test(modulusHex) || exponentHex !== "010001") throw new Error("unsupported RSA public key");
  const computedKeyId = `sha256:${createHash("sha256").update(canonical({ e: exponentHex, n: modulusHex })).digest("hex")}`;
  if (key.key_id !== computedKeyId || payload.signer_key_id !== computedKeyId) throw new Error("public-key fingerprint mismatch");

  const modulusBytes = Buffer.from(modulusHex, "hex");
  const exponentBytes = Buffer.from(exponentHex, "hex");
  const toBase64Url = (bytes) => bytes.toString("base64url");
  const publicKey = createPublicKey({
    key: { kty: "RSA", n: toBase64Url(modulusBytes), e: toBase64Url(exponentBytes) },
    format: "jwk",
  });
  const signatureHex = String(envelope.signature_hex ?? "");
  if (!new RegExp(`^[0-9a-fA-F]{${modulusBytes.length * 2}}$`).test(signatureHex)) throw new Error("malformed RSA signature encoding");
  const signatureValid = verify(
    "sha256",
    Buffer.from(canonical(payload), "utf8"),
    { key: publicKey, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(signatureHex, "hex"),
  );
  if (!signatureValid) throw new Error("RSA-SHA256 signature is invalid");

  const archiveSha256 = createHash("sha256").update(archive).digest("hex");
  if (payload.repository !== expectedRepository || String(payload.repository_id) !== expectedRepositoryId) {
    throw new Error("manifest is for a different GitHub repository identity");
  }
  if (payload.schema !== "truss-release-manifest-v1" || payload.release_tag !== expectedTag) {
    throw new Error("manifest schema or expected release tag does not match");
  }
  if (!/^[0-9a-f]{40}$/.test(String(payload.commit_sha)) || !/^[0-9a-f]{40}$/.test(String(payload.tag_object_sha))) {
    throw new Error("commit or annotated tag object is malformed");
  }
  if (payload.artifact_sha256 !== archiveSha256) throw new Error("source archive digest does not match the signed manifest");
  const expectedRun = `https://api.github.com/repos/Ifem1/truss/actions/runs/${payload.ci_run_id}`;
  if (!/^[0-9]{1,24}$/.test(String(payload.ci_run_id))
      || payload.ci_run_url !== expectedRun
      || payload.ci_workflow !== `Ifem1/truss/.github/workflows/ci.yml@refs/tags/${expectedTag}`
      || payload.ci_event !== "push"
      || payload.ci_conclusion !== "success") {
    throw new Error("signed CI claim is malformed or not bound to the expected tag");
  }

  try {
    const tagObject = execFileSync("git", ["-c", `safe.directory=${process.cwd()}`, "rev-parse", `refs/tags/${expectedTag}^{tag}`], { encoding: "utf8" }).trim().toLowerCase();
    const commit = execFileSync("git", ["-c", `safe.directory=${process.cwd()}`, "rev-parse", `refs/tags/${expectedTag}^{commit}`], { encoding: "utf8" }).trim().toLowerCase();
    if (tagObject !== payload.tag_object_sha || commit !== payload.commit_sha) throw new Error("annotated tag object does not resolve to the signed commit");
  } catch (error) {
    throw new Error(`local Git tag verification failed: ${error.message}`);
  }

  console.log(JSON.stringify({
    result: "VERIFIED",
    repository: payload.repository,
    repositoryId: payload.repository_id,
    tag: payload.release_tag,
    tagObjectSha: payload.tag_object_sha,
    commitSha: payload.commit_sha,
    archiveSha256,
    rsaSignatureValid: true,
    signerKeyId: computedKeyId,
    ciRunUrl: payload.ci_run_url,
    ciClaim: "signature-authenticated; underlying CI metadata is not independently verified by this script",
  }, null, 2));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
