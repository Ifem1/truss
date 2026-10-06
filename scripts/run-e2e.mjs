import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const baseUrl = process.env.TRUSS_E2E_BASE_URL ?? "http://127.0.0.1:3000";
let server;
let ownsServer = false;

async function waitForServer(url, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The production server is still starting.
    }
    await delay(300);
  }
  throw new Error(`Next.js production server did not become ready at ${url}`);
}

async function stopServer() {
  if (!ownsServer || !server || server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    delay(5_000),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

try {
  if (process.env.TRUSS_E2E_BASE_URL) {
    await waitForServer(baseUrl);
  } else {
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1"], {
      stdio: "inherit",
      env: process.env,
    });
    ownsServer = true;
    server.once("error", (error) => { throw error; });
    await waitForServer(baseUrl);
  }

  const runner = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test"], {
    stdio: "inherit",
    env: { ...process.env, TRUSS_E2E_BASE_URL: baseUrl },
  });
  const code = await new Promise((resolve, reject) => {
    runner.once("error", reject);
    runner.once("exit", (exitCode, signal) => {
      if (signal) reject(new Error(`Playwright exited from ${signal}`));
      else resolve(exitCode ?? 1);
    });
  });
  process.exitCode = code;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await stopServer();
}
