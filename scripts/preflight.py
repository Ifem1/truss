from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []
package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
if package.get("devDependencies", {}).get("genlayer") != "0.39.1":
    errors.append("repository-local genlayer must be exactly 0.39.1")
env = (ROOT / ".env.example").read_text(encoding="utf-8")
if "61999" not in env or "61997" in env:
    errors.append("network lock must target chain 61999 only")
if "https://studio.genlayer.com/api" not in env or "https://explorer-studio.genlayer.com" not in env:
    errors.append("canonical Studionet RPC and explorer are required")
if "NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS=" not in env:
    errors.append("frontend contract address must be configured from the real deployment")

contract = (ROOT / "contracts/truss_registry.py").read_text(encoding="utf-8")
for verdict in ("ADMITTED", "REJECTED", "INSUFFICIENT_EVIDENCE", "CONFLICTING_EVIDENCE"):
    if verdict not in contract:
        errors.append(f"missing verdict {verdict}")
if "gl.nondet.web.get(url)" not in contract:
    errors.append("contract must use the SDK-supported GenLayer web-fetch entry point")
if "run_nondet_unsafe" not in contract:
    errors.append("validator-independent assessment path is missing")
if "genlayer-test" not in (ROOT / "requirements.txt").read_text(encoding="utf-8"):
    errors.append("Direct Mode harness dependency is not pinned")
if "genlayer.config" in (ROOT / "gltest.config.yaml").read_text(encoding="utf-8"):
    errors.append("Direct Mode configuration must not imply an application/backend deployment")

direct = (ROOT / "tests/direct/test_truss_registry.py").read_text(encoding="utf-8")
if re.search(r"pytest\.(?:mark\.)?skip|unittest\.skip", direct):
    errors.append("Direct Mode suite contains skipped tests")
if not re.search(r"def test_", direct):
    errors.append("Direct Mode suite contains no executable test cases")

for forbidden in ("supabase", "firebase", "express", "walletconnect", "privy"):
    if forbidden in package.get("dependencies", {}) or forbidden in package.get("devDependencies", {}):
        errors.append(f"forbidden application dependency found: {forbidden}")

if errors:
    print("TRUSS PREFLIGHT FAILED")
    for error in errors:
        print("-", error)
    sys.exit(1)
print("TRUSS PREFLIGHT OK")
