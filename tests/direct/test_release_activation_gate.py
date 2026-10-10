"""Deterministic consumer checks with a Direct Mode cross-contract view hook."""
import json

CONTRACT = "contracts/release_activation_gate.py"
REGISTRY = "0x" + "ab" * 20
OPERATOR = "0x" + "11" * 20
OTHER = "0x" + "22" * 20


def test_activation_requires_final_registry_head_and_frozen_authority(direct_vm, direct_deploy):
    direct_vm.sender = bytes.fromhex("11" * 20)
    gate = direct_deploy(CONTRACT, REGISTRY, OPERATOR, "lineage-main", "d" * 64, "Ifem1", "truss")
    from genlayer.py import calldata

    candidate = {
        "candidate_key": "release-one", "status": "ADMITTED", "lineage_key": "lineage-main",
        "policy_key": "policy-one", "policy_digest": "d" * 64,
        "repository_owner": "Ifem1", "repository_name": "truss", "commit_sha": "a" * 40,
        "assessment_attempts": [{"verdict": "ADMITTED", "assessment_digest": "f" * 64}],
    }
    policy = {"policy_digest": "d" * 64, "lineage_key": "lineage-main", "repository_owner": "Ifem1", "repository_name": "truss"}
    snapshot = {"get_admitted_head": "", "get_candidate_json": json.dumps(candidate), "get_policy_json": json.dumps(policy)}
    calls = []

    def registry_view(vm, request):
        call = request.get("CallContract")
        if call is None:
            return None
        calls.append(call)
        assert str(call["address"]).lower() == REGISTRY
        assert call["state"] == 1  # StorageType.LATEST_FINAL
        return bytes([0]) + calldata.encode(snapshot[call["calldata"]["method"]])

    direct_vm._gl_call_hook = registry_view
    with direct_vm.expect_revert("authoritative admitted head"):
        gate.activate_release("release-one")
    assert gate.get_active_candidate() == ""

    snapshot["get_admitted_head"] = "release-one"
    direct_vm.sender = bytes.fromhex("22" * 20)
    with direct_vm.expect_revert("only configured operator"):
        gate.activate_release("release-one")
    direct_vm.sender = bytes.fromhex("11" * 20)
    candidate["status"] = "REJECTED"
    snapshot["get_candidate_json"] = json.dumps(candidate)
    with direct_vm.expect_revert("frozen activation authority"):
        gate.activate_release("release-one")
    candidate["status"] = "ADMITTED"
    candidate["repository_name"] = "other-repository"
    snapshot["get_candidate_json"] = json.dumps(candidate)
    with direct_vm.expect_revert("frozen activation authority"):
        gate.activate_release("release-one")
    candidate["repository_name"] = "truss"
    snapshot["get_candidate_json"] = json.dumps(candidate)
    candidate["policy_digest"] = "e" * 64
    snapshot["get_candidate_json"] = json.dumps(candidate)
    with direct_vm.expect_revert("frozen activation authority"):
        gate.activate_release("release-one")
    candidate["policy_digest"] = "d" * 64
    snapshot["get_candidate_json"] = json.dumps(candidate)
    snapshot["get_admitted_head"] = "newer-release"
    with direct_vm.expect_revert("authoritative admitted head"):
        gate.activate_release("release-one")
    snapshot["get_admitted_head"] = "release-one"
    assert gate.activate_release("release-one") == "release-one"
    assert gate.get_active_candidate() == "release-one"
    assert json.loads(gate.get_activation_history_json())[0]["assessment_digest"] == "f" * 64
    with direct_vm.expect_revert("already active"):
        gate.activate_release("release-one")
    assert calls
