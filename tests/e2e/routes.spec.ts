import { expect, test, type Page } from "@playwright/test";
import { abi, decodeInputData } from "genlayer-js";

const walletAddress = "0x1234567890abcdef1234567890abcdef12345678";
const contractAddress = "0xEf2aF888D4e764678d97a1EC38e7519047440fFb";
const txHash = `0x${"1".repeat(64)}` as const;
const fixturePolicy = {
  policy_key: "policy-e2e", lineage_key: "lineage-e2e", owner: walletAddress,
  software_name: "TRUSS browser fixture", repository_owner: "Ifem1", repository_name: "truss",
  usage_context: "Browser proof fixture only; not a real release decision.",
  admission_policy: "Admit only the exact candidate bound to this fixture policy and frozen commit.",
  criteria: [{ id: "VERSION_MATCH", title: "Version matches", rule: "The package version must match the release label." }],
  required_roles: ["RELEASE_IDENTITY"],
  evidence_authorities: { RELEASE_IDENTITY: [{ host: "api.github.com", path_prefix: "/repos/Ifem1/truss/commits/" }] },
  predecessor_policy_key: "", version: 1, policy_digest: "fixture-policy-digest",
};

async function installWallet(page: Page, initialChain = "0xf22f") {
  await page.addInitScript(({ initialChain, walletAddress }) => {
    const listeners: Record<string, Array<(value: unknown) => void>> = {};
    let chainId = initialChain;
    let accounts: string[] = [];
    let rejectTransaction = false;
    const provider = {
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        if (method === "eth_chainId") return chainId;
        if (method === "eth_accounts") return accounts;
        if (method === "eth_requestAccounts") {
          if ((window as Window & { __rejectNextSignature?: boolean }).__rejectNextSignature) {
            (window as Window & { __rejectNextSignature?: boolean }).__rejectNextSignature = false;
            throw Object.assign(new Error("User rejected the request."), { code: 4001 });
          }
          accounts = [walletAddress];
          return accounts;
        }
        if (method === "eth_sendTransaction") {
          if (rejectTransaction) { rejectTransaction = false; throw Object.assign(new Error("User rejected the transaction."), { code: 4001 }); }
          (window as Window & { __trussSubmitted?: boolean }).__trussSubmitted = true;
          return `0x${"1".repeat(64)}`;
        }
        if (method === "wallet_switchEthereumChain") {
          chainId = (params?.[0] as { chainId: string }).chainId;
          return null;
        }
        if (method === "wallet_addEthereumChain") return null;
        throw Object.assign(new Error(`Unexpected wallet method: ${method}`), { code: -32601 });
      },
      on: (event: string, listener: (value: unknown) => void) => { (listeners[event] ??= []).push(listener); },
      removeListener: (event: string, listener: (value: unknown) => void) => { listeners[event] = (listeners[event] ?? []).filter((item) => item !== listener); },
    };
    Object.defineProperty(window, "ethereum", { configurable: true, value: provider });
    Object.defineProperty(window, "__walletTest", { configurable: true, value: {
      emit(event: string, value: unknown) { for (const listener of listeners[event] ?? []) listener(value); },
      setChain(value: string) { chainId = value; this.emit("chainChanged", value); },
      setAccounts(value: string[]) { accounts = value; this.emit("accountsChanged", value); },
      rejectNextSignature() { (window as Window & { __rejectNextSignature?: boolean }).__rejectNextSignature = true; },
      rejectNextTransactionSignature() { rejectTransaction = true; },
    } });
  }, { initialChain, walletAddress });
}

async function installContractRpc(page: Page, initialStatus: "ACCEPTED" | "FINALIZED" = "ACCEPTED", execution: "SUCCESS" | "ERROR" = "SUCCESS") {
  let status = initialStatus;
  const variants: string[] = [];
  const calls: string[] = [];
  await page.route("**/api", async (route) => {
    const request = route.request().postDataJSON() as { id: number; method: string; params?: unknown[] };
    if (request.method === "gen_call") {
      const params = request.params?.[0] as { data: string; transaction_hash_variant?: string };
      const decoded = decodeInputData(params.data as `0x${string}`, contractAddress as `0x${string}`);
      const data = decoded && "callData" in decoded ? decoded.callData as Map<string, unknown> : undefined;
      const method = String(data?.get("method") ?? "");
      const args = (data?.get("args") ?? []) as unknown[];
      calls.push(method);
      if (params.transaction_hash_variant) variants.push(params.transaction_hash_variant);
      let value = "";
      if (method === "get_policy_json") value = JSON.stringify(fixturePolicy);
      if (method === "get_candidate_json" && args[0] === "candidate-browser-e2e") value = JSON.stringify({
        candidate_key: "candidate-browser-e2e", policy_key: "policy-e2e", policy_digest: fixturePolicy.policy_digest,
        lineage_key: fixturePolicy.lineage_key, owner: walletAddress, repository_owner: "Ifem1", repository_name: "truss",
        release_label: "0.1.0", commit_sha: "c".repeat(40), predecessor_candidate_key: "", coordinate_digest: "fixture-coordinate",
        opened_at: 1, status: "OPEN", evidence_rounds: [{ round: 1, submitted_at: 1, evidence_round_digest: "fixture-round", evidence: [{ role: "RELEASE_IDENTITY", url: "https://api.github.com/repos/Ifem1/truss/commits/example" }] }], assessment_attempts: [],
      });
      const encoded = Buffer.from(abi.calldata.encode(value)).toString("hex");
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jsonrpc: "2.0", id: request.id, result: { data: encoded } }) });
    }
    if (request.method === "eth_getTransactionByHash") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jsonrpc: "2.0", id: request.id, result: {
        hash: txHash, from_address: walletAddress, to_address: contractAddress, data: { calldata: "" }, value: 0, type: 2,
        status, result: 6, result_name: "MAJORITY_AGREE",
        consensus_data: { leader_receipt: [{ mode: "leader", execution_result: execution, result: { status: execution === "SUCCESS" ? "return" : "rollback", payload: {} } }] },
      } }) });
    }
    const result = request.method === "eth_estimateGas" ? "0x2bf20" : request.method === "eth_gasPrice" || request.method === "eth_getTransactionCount" ? "0x1" : null;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jsonrpc: "2.0", id: request.id, result }) });
  });
  return { setStatus(next: "ACCEPTED" | "FINALIZED") { status = next; }, calls, variants };
}

async function fillCandidateForm(page: Page) {
  await page.goto("/release/new?policy=policy-e2e");
  await page.getByRole("button", { name: /connect wallet/i }).click();
  await page.getByLabel("Candidate key").fill("candidate-browser-e2e");
  await page.getByLabel("Release label").fill("0.1.0");
  await page.getByLabel("Exact commit SHA").fill("c".repeat(40));
  await page.locator('input[type="url"]').fill("https://api.github.com/repos/Ifem1/truss/commits/example");
}

test("landing explains release lineage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /every release has a lineage/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /create policy/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /progress has a source/i })).toBeVisible();
});

test("policy form is reachable", async ({ page }) => {
  await page.goto("/policy/new");
  await expect(page.getByRole("heading", { name: /set the standard before the release/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /add criterion/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /release identity/i })).toBeVisible();
});

test("release form asks for exact commit", async ({ page }) => {
  await page.goto("/release/new");
  await expect(page.getByText("Exact commit SHA")).toBeVisible();
});

test("wallet connects, disconnects, and hard-gates a wrong network", async ({ page }) => {
  await installWallet(page);
  await page.goto("/");
  await page.getByRole("button", { name: /connect wallet/i }).click();
  await expect(page.getByRole("button", { name: /0x1234…5678/i })).toBeVisible();
  await page.evaluate(() => (window as unknown as { __walletTest: { setChain(v: string): void } }).__walletTest.setChain("0x1"));
  await expect(page.getByText("Wrong network · 1")).toBeVisible();
  await page.getByRole("button", { name: /0x1234…5678/i }).click();
  await page.getByRole("menuitem", { name: /disconnect/i }).click();
  await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
});

test("connected wallet menu opens and closes with Escape and outside click", async ({ page }) => {
  await installWallet(page);
  await page.goto("/");
  await page.getByRole("button", { name: /connect wallet/i }).click();
  const trigger = page.getByRole("button", { name: /0x1234…5678/i });
  await trigger.click();
  await expect(page.getByRole("menu", { name: /connected wallet/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: /connected wallet/i })).toHaveCount(0);
  await trigger.click();
  await expect(page.getByRole("menu", { name: /connected wallet/i })).toBeVisible();
  await page.locator("h1").click();
  await expect(page.getByRole("menu", { name: /connected wallet/i })).toHaveCount(0);
  await trigger.click();
  await expect(page.getByRole("menu", { name: /connected wallet/i })).toBeVisible();
  await page.evaluate(() => (window as unknown as { __walletTest: { setAccounts(v: string[]): void } }).__walletTest.setAccounts(["0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"]));
  await expect(page.getByRole("menu", { name: /connected wallet/i })).toHaveCount(0);
});

test("wallet copy does not disconnect; separate Disconnect action does", async ({ page }) => {
  await installWallet(page);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: /connect wallet/i }).click();
  const trigger = page.getByRole("button", { name: /0x1234…5678/i });
  await trigger.click();
  await page.getByRole("menuitem", { name: /copy address/i }).click();
  await expect(page.getByRole("menuitem", { name: /copied/i })).toBeVisible();
  await expect(trigger).toBeVisible();
  await expect(page.getByRole("menu", { name: /connected wallet/i })).toBeVisible();
  await page.getByRole("menuitem", { name: /disconnect/i }).click();
  await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
});

test("wallet signature rejection is visible and does not claim a submitted transaction", async ({ page }) => {
  await installWallet(page);
  await page.goto("/policy/new");
  await page.evaluate(() => (window as unknown as { __walletTest: { rejectNextSignature(): void } }).__walletTest.rejectNextSignature());
  await page.getByRole("button", { name: /connect wallet/i }).click();
  await expect(page.getByText(/user rejected the request/i)).toBeVisible();
  await expect(page.getByText(/submitted/i)).toHaveCount(0);
});

test("connecting from another chain requests Studionet and switches to chain 61999", async ({ page }) => {
  await installWallet(page, "0x1");
  await page.goto("/");
  await page.getByRole("button", { name: /connect wallet/i }).click();
  await expect(page.getByRole("button", { name: /0x1234…5678/i })).toBeVisible();
  await expect(page.getByText("Studionet · 61999")).toBeVisible();
});

test("account and chain changes update the wallet state", async ({ page }) => {
  await installWallet(page);
  await page.goto("/");
  await page.getByRole("button", { name: /connect wallet/i }).click();
  await page.evaluate(() => (window as unknown as { __walletTest: { setAccounts(v: string[]): void; setChain(v: string): void } }).__walletTest.setAccounts(["0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"]));
  await expect(page.getByRole("button", { name: /0xabcd…abcd/i })).toBeVisible();
  await page.evaluate(() => (window as unknown as { __walletTest: { setChain(v: string): void } }).__walletTest.setChain("0x1"));
  await expect(page.getByText("Wrong network · 1")).toBeVisible();
  await page.evaluate(() => (window as unknown as { __walletTest: { setAccounts(v: string[]): void } }).__walletTest.setAccounts([]));
  await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
});

test("a submitted candidate remains nonfinal until FINALIZED, then reloads authoritative contract state", async ({ page }) => {
  await installWallet(page);
  const rpc = await installContractRpc(page, "ACCEPTED", "SUCCESS");
  await fillCandidateForm(page);
  await page.getByRole("button", { name: /open release candidate/i }).click();
  await expect(page.getByText("submitted · waiting for FINALIZED")).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as Window & { __trussSubmitted?: boolean }).__trussSubmitted)).toBe(true);
  await expect(page).toHaveURL(/\/release\/new\?/);
  rpc.setStatus("FINALIZED");
  await expect(page).toHaveURL(/\/release\/candidate-browser-e2e/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: "0.1.0" })).toBeVisible();
  await expect(page.getByText("OPEN", { exact: true })).toBeVisible();
  expect(rpc.calls).toContain("get_candidate_json");
  expect(rpc.variants.length).toBeGreaterThan(0);
  expect(rpc.variants.every((variant) => variant === "latest-final")).toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "0.1.0" })).toBeVisible();
  await expect(page.getByText("OPEN", { exact: true })).toBeVisible();
});

test("a rejected transaction signature never enters submitted state", async ({ page }) => {
  await installWallet(page);
  await installContractRpc(page);
  await fillCandidateForm(page);
  await page.evaluate(() => (window as unknown as { __walletTest: { rejectNextTransactionSignature(): void } }).__walletTest.rejectNextTransactionSignature());
  await page.getByRole("button", { name: /open release candidate/i }).click();
  await expect(page.getByText("wallet signature rejected")).toBeVisible();
  await expect(page.getByText(/user rejected the transaction/i)).toBeVisible();
  await expect(page.getByText(/submitted · waiting/i)).toHaveCount(0);
});

test("a finalized contract rollback is shown as failure and does not navigate", async ({ page }) => {
  await installWallet(page);
  await installContractRpc(page, "FINALIZED", "ERROR");
  await fillCandidateForm(page);
  await page.getByRole("button", { name: /open release candidate/i }).click();
  await expect(page.getByText("transaction or consensus failed")).toBeVisible();
  await expect(page.getByText(/finalized without a successful contract return/i)).toBeVisible();
  await expect(page).toHaveURL(/\/release\/new\?/);
});

test("wrong network disables release submission", async ({ page }) => {
  await installWallet(page);
  await installContractRpc(page);
  await fillCandidateForm(page);
  await page.evaluate(() => (window as unknown as { __walletTest: { setChain(v: string): void } }).__walletTest.setChain("0x1"));
  await expect(page.getByText("Wrong network · 1")).toBeVisible();
  await expect(page.getByRole("button", { name: /open release candidate/i })).toBeDisabled();
});

test("mobile viewport has no page overflow and reduced motion stops the flow animation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /every release has a lineage/i })).toBeVisible();
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, animationDuration: getComputedStyle(document.querySelector(".flow-line")!).animationDuration }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  expect(Number.parseFloat(dimensions.animationDuration)).toBeLessThanOrEqual(0.001);
});
