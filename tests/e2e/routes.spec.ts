import { expect, test, type Page } from "@playwright/test";

const walletAddress = "0x1234567890abcdef1234567890abcdef12345678";
async function installWallet(page: Page, initialChain = "0xf22f") {
  await page.addInitScript(({ initialChain, walletAddress }) => {
    const listeners: Record<string, Array<(value: unknown) => void>> = {};
    let chainId = initialChain;
    let accounts: string[] = [];
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
    } });
  }, { initialChain, walletAddress });
}

test("landing explains release lineage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Software changes.")).toBeVisible();
  await expect(page.getByRole("link", { name: /create admission policy/i })).toBeVisible();
});

test("policy form is reachable", async ({ page }) => {
  await page.goto("/policy/new");
  await expect(page.getByRole("heading", { name: /Define what a release must prove/i })).toBeVisible();
});

test("release form asks for exact commit", async ({ page }) => {
  await page.goto("/release/new");
  await expect(page.getByText("Exact commit SHA")).toBeVisible();
});

test("wallet connects, disconnects, and hard-gates a wrong network", async ({ page }) => {
  await installWallet(page);
  await page.goto("/");
  await page.getByRole("button", { name: /connect wallet/i }).click();
  await expect(page.getByRole("button", { name: /disconnect/i })).toBeVisible();
  await page.evaluate(() => (window as unknown as { __walletTest: { setChain(v: string): void } }).__walletTest.setChain("0x1"));
  await expect(page.getByText("wrong network · 1")).toBeVisible();
  await page.getByRole("button", { name: /disconnect/i }).click();
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
  await expect(page.getByRole("button", { name: /disconnect/i })).toBeVisible();
  await expect(page.getByText("Studionet · 61999")).toBeVisible();
});

test("account and chain changes update the wallet state", async ({ page }) => {
  await installWallet(page);
  await page.goto("/");
  await page.getByRole("button", { name: /connect wallet/i }).click();
  await page.evaluate(() => (window as unknown as { __walletTest: { setAccounts(v: string[]): void; setChain(v: string): void } }).__walletTest.setAccounts(["0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"]));
  await expect(page.getByRole("button", { name: /0xabcd…abcd · disconnect/i })).toBeVisible();
  await page.evaluate(() => (window as unknown as { __walletTest: { setChain(v: string): void } }).__walletTest.setChain("0x1"));
  await expect(page.getByText("wrong network · 1")).toBeVisible();
  await page.evaluate(() => (window as unknown as { __walletTest: { setAccounts(v: string[]): void } }).__walletTest.setAccounts([]));
  await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
});
