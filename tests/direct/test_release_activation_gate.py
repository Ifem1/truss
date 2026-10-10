"""Adversarial consumer tests; the registry call hook simulates LATEST_FINAL only."""
import json
import pytest

CONTRACT = "contracts/release_activation_gate.py"
REGISTRY = "0x" + "ab" * 20
OPERATOR = "0x" + "11" * 20
OTHER = "0x" + "22" * 20


def make_gate(direct_vm, direct_deploy):
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
    snapshot = {"get_admitted_head": "release-one", "get_candidate_json": json.dumps(candidate), "get_policy_json": json.dumps(policy)}
    calls = []

    def registry_view(vm, request):
        call = request.get("CallContract")
        if call is None:
            return None
        calls.append(call)
        assert str(call["address"]).lower() == REGISTRY
        assert call["state"] == 1  # StorageType.LATEST_FINAL
        method = call["calldata"]["method"]
        value = snapshot[method]
        if value is None:
            return None
        return bytes([0]) + calldata.encode(value)

    direct_vm._gl_call_hook = registry_view
    return gate, snapshot, calls


def assert_rejected_without_mutation(direct_vm, gate, reason):
    with direct_vm.expect_revert(reason):
        gate.activate_release("release-one")
    assert gate.get_active_candidate() == ""
    assert json.loads(gate.get_activation_history_json()) == []


@pytest.mark.parametrize("field,value,reason", [
    ("get_admitted_head", "newer-release", "authoritative admitted head"),
    ("get_candidate_json", "", "candidate not found"),
    ("get_candidate_json", "{malformed", None),
    ("get_policy_json", "", "candidate policy not found"),
    ("get_policy_json", json.dumps({"policy_digest":"e"*64,"lineage_key":"lineage-main","repository_owner":"Ifem1","repository_name":"truss"}), "frozen activation authority"),
])
def test_cross_contract_adversarial_registry_states_fail_closed(direct_vm, direct_deploy, field, value, reason):
    gate, snapshot, calls = make_gate(direct_vm, direct_deploy)
    snapshot[field] = value
    if reason is None:
        with direct_vm.expect_revert():
            gate.activate_release("release-one")
        assert gate.get_active_candidate() == ""
        assert json.loads(gate.get_activation_history_json()) == []
    else:
        assert_rejected_without_mutation(direct_vm, gate, reason)
    assert calls


@pytest.mark.parametrize("candidate_field,value,reason", [
    ("status", "REJECTED", "frozen activation authority"),
    ("lineage_key", "other-lineage", "frozen activation authority"),
    ("policy_digest", "e" * 64, "frozen activation authority"),
    ("repository_owner", "attacker", "frozen activation authority"),
    ("repository_name", "other-repository", "frozen activation authority"),
    ("assessment_attempts", [], "candidate has no admitted assessment"),
    ("assessment_attempts", [{"verdict":"ADMITTED"},{"verdict":"REJECTED"}], "candidate has no admitted assessment"),
])
def test_cross_contract_adversarial_candidate_fields_fail_closed(direct_vm, direct_deploy, candidate_field, value, reason):
    gate, snapshot, calls = make_gate(direct_vm, direct_deploy)
    candidate = json.loads(snapshot["get_candidate_json"])
    candidate[candidate_field] = value
    snapshot["get_candidate_json"] = json.dumps(candidate)
    assert_rejected_without_mutation(direct_vm, gate, reason)
    assert calls


def test_wrong_operator_and_unavailable_registry_do_not_activate(direct_vm, direct_deploy):
    gate, snapshot, calls = make_gate(direct_vm, direct_deploy)
    direct_vm.sender = bytes.fromhex("22" * 20)
    with direct_vm.expect_revert("only configured operator"):
        gate.activate_release("release-one")
    assert gate.get_active_candidate() == ""
    assert json.loads(gate.get_activation_history_json()) == []
    direct_vm.sender = bytes.fromhex("11" * 20)
    snapshot["get_admitted_head"] = None
    with direct_vm.expect_revert():
        gate.activate_release("release-one")
    assert gate.get_active_candidate() == ""
    assert json.loads(gate.get_activation_history_json()) == []
    assert calls


def test_finalized_head_activation_records_exact_candidate_and_replay_fails(direct_vm, direct_deploy):
    gate, snapshot, calls = make_gate(direct_vm, direct_deploy)
    assert gate.activate_release("release-one") == "release-one"
    assert gate.get_active_candidate() == "release-one"
    history = json.loads(gate.get_activation_history_json())
    assert history == [{"candidate_key":"release-one", "policy_digest":"d"*64,
                        "commit_sha":"a"*40, "assessment_digest":"f"*64}]
    with direct_vm.expect_revert("already active"):
        gate.activate_release("release-one")
    assert gate.get_active_candidate() == "release-one"
    assert len(json.loads(gate.get_activation_history_json())) == 1
    assert calls
