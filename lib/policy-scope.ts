export type EvidenceScope = { host: string; path_prefix: string };
export type EvidenceAuthorities = Record<string, Array<EvidenceScope | string>>;

export type GithubEvidencePreflight = {
  releaseTagRefUrl: string;
  annotatedTagObjectUrl: string;
  actionsRunUrl: string;
};

/** Mirrors the registry's HTTPS host/path-prefix scope check for policy preflight. */
export function validateGithubEvidenceScopes(
  authorities: EvidenceAuthorities,
  preflight: GithubEvidencePreflight,
  repositoryOwner: string,
  repositoryName: string,
): string[] {
  const issues: string[] = [];
  const repoPrefix = `/repos/${repositoryOwner}/${repositoryName}/`;
  const checks = [
    ["RELEASE_IDENTITY", "GitHub tag-reference URL", preflight.releaseTagRefUrl, `${repoPrefix}git/ref/tags/`],
    ["RELEASE_IDENTITY", "GitHub annotated-tag object URL", preflight.annotatedTagObjectUrl, `${repoPrefix}git/tags/`],
    ["TEST_STATUS", "canonical GitHub Actions run API URL", preflight.actionsRunUrl, `${repoPrefix}actions/runs/`],
  ] as const;

  for (const [role, label, raw, expectedPathPrefix] of checks) {
    const url = canonicalEvidenceUrl(raw);
    if (!url) {
      issues.push(`${label} must be a canonical HTTPS URL without query, fragment, encoding, or trailing slash.`);
      continue;
    }
    const parsed = new URL(url);
    if (parsed.hostname !== "api.github.com" || !parsed.pathname.toLowerCase().startsWith(expectedPathPrefix.toLowerCase())) {
      issues.push(`${label} must identify the configured GitHub repository ${repositoryOwner}/${repositoryName} under ${expectedPathPrefix}`);
      continue;
    }
    const scopes = authorities[role] ?? [];
    if (!scopes.some((scope) => scopeMatches(url, scope))) {
      issues.push(`${label}: ${role} is missing a scope for ${parsed.hostname}${parsed.pathname}`);
    }
    if (role === "TEST_STATUS" && parsed.hostname !== "api.github.com") {
      issues.push("TEST_STATUS must use the canonical api.github.com Actions API endpoint.");
    }
  }
  return issues;
}

function canonicalEvidenceUrl(raw: string): string | null {
  if (raw !== raw.trim() || !raw.startsWith("https://") || /[%\\?#\x00-\x20\x7f]/.test(raw)) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash) return null;
    const path = url.pathname;
    const rawPath = raw.slice(raw.indexOf("/", "https://".length));
    const parts = rawPath.slice(1).split("/");
    if (path.endsWith("/") || parts.some((part) => part === "." || part === ".." || part === "")) return null;
    return `https://${url.hostname.toLowerCase()}${path}`;
  } catch {
    return null;
  }
}

function scopeMatches(rawUrl: string, entry: EvidenceScope | string): boolean {
  let scope: EvidenceScope;
  if (typeof entry === "string") {
    const [host, ...pathParts] = entry.split("|");
    scope = { host, path_prefix: pathParts.join("|") || "/" };
  } else {
    scope = entry;
  }
  if (!scope || typeof scope.host !== "string" || typeof scope.path_prefix !== "string") return false;
  const url = new URL(rawUrl);
  const host = scope.host.toLowerCase();
  let prefix = scope.path_prefix;
  if (!prefix.startsWith("/") || /[\\%?#]/.test(prefix) || prefix.includes("//")) return false;
  prefix = `/${prefix.split("/").filter(Boolean).join("/")}`;
  if (!prefix.endsWith("/")) prefix += "/";
  return url.hostname.toLowerCase() === host && `${url.pathname}/`.startsWith(prefix);
}
