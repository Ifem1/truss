"""Adversarial activation tests for authenticated finalized registry messages."""
import json
import pytest

CONTRACT = "contracts/release_activation_gate.py"
REGISTRY = "0x" + "ab" * 20
OPERATOR = "0x" + "11" * 20
OTHER = "0x" + "22" * 20
LINEAGE = "lineage-main"
POLICY = "d" * 64
ASSESSMENT = "f" * 64
COMMIT = "a" * 40


def make_gate(direct_vm, direct_deploy):
    direct_vm.sender = bytes.fromhex("11" * 20)
    gate = direct_deploy(CONTRACT, REGISTRY, OPERATOR, LINEAGE, POLICY, "Ifem1", "truss")
    return gate


def deliver(direct_vm, gate, *, sequence=1, candidate="release-one", policy=POLICY,
            lineage=LINEAGE, predecessor="", commit=COMMIT, assessment=ASSESSMENT,
            owner="Ifem1", repo="truss", sender=REGISTRY):
    direct_vm.sender = bytes.fromhex(sender.removeprefix("0x"))
    return gate.receive_admission(lineage, sequence, candidate, policy, commit,
                                  predecessor, assessment, owner, repo)


def assert_unmodified(gate):
    assert gate.get_active_candidate() == ""
    assert json.loads(gate.get_activation_history_json()) == []
    assert json.loads(gate.get_pending_admission_json()) == {}


def test_forged_sender_wrong_policy_lineage_and_repository_are_rejected(direct_vm, direct_deploy):
    gate = make_gate(direct_vm, direct_deploy)
    with direct_vm.expect_revert("configured registry"):
        deliver(direct_vm, gate, sender=OTHER)
    with direct_vm.expect_revert("frozen gate authority"):
        deliver(direct_vm, gate, policy="e" * 64)
    with direct_vm.expect_revert("frozen gate authority"):
        deliver(direct_vm, gate, lineage="other-lineage")
    with direct_vm.expect_revert("frozen gate authority"):
        deliver(direct_vm, gate, owner="attacker")
    assert_unmodified(gate)


@pytest.mark.parametrize("sequence,predecessor,reason", [
    (0, "", "stale or skipped"), (2, "", "stale or skipped"),
    (1, "stale-parent", "predecessor is not the active release"),
])
def test_stale_skipped_and_wrong_predecessor_messages_fail_closed(direct_vm, direct_deploy, sequence, predecessor, reason):
    gate = make_gate(direct_vm, direct_deploy)
    with direct_vm.expect_revert(reason):
        deliver(direct_vm, gate, sequence=sequence, predecessor=predecessor)
    assert_unmodified(gate)


def test_duplicate_delivery_is_idempotent_and_other_pending_candidate_rejected(direct_vm, direct_deploy):
    gate = make_gate(direct_vm, direct_deploy)
    assert deliver(direct_vm, gate) == "STAGED"
    assert deliver(direct_vm, gate) == "DUPLICATE_PENDING"
    with direct_vm.expect_revert("another admission"):
        deliver(direct_vm, gate, candidate="release-two", assessment="1" * 64)
    pending = json.loads(gate.get_pending_admission_json())
    assert pending["candidate_key"] == "release-one" and pending["sequence"] == 1
    assert gate.get_active_candidate() == ""


def test_unauthorized_operator_and_invalid_candidate_do_not_activate(direct_vm, direct_deploy):
    gate = make_gate(direct_vm, direct_deploy)
    deliver(direct_vm, gate)
    direct_vm.sender = bytes.fromhex("22" * 20)
    with direct_vm.expect_revert("only configured operator"):
        gate.activate_release("release-one")
    direct_vm.sender = bytes.fromhex("11" * 20)
    with direct_vm.expect_revert("no matching finalized admission"):
        gate.activate_release("not-admitted")
    assert gate.get_active_candidate() == ""
    assert gate.get_activation_history_json() == "[]"
    assert json.loads(gate.get_pending_admission_json())["candidate_key"] == "release-one"


def test_authorized_activation_is_sequenced_and_duplicate_replay_fails(direct_vm, direct_deploy):
    gate = make_gate(direct_vm, direct_deploy)
    deliver(direct_vm, gate)
    direct_vm.sender = bytes.fromhex("11" * 20)
    assert gate.activate_release("release-one") == "release-one"
    history = json.loads(gate.get_activation_history_json())
    assert history == [{"sequence": 1, "candidate_key": "release-one", "policy_digest": POLICY,
                        "commit_sha": COMMIT, "assessment_digest": ASSESSMENT,
                        "predecessor_candidate_key": ""}]
    assert gate.get_active_candidate() == "release-one"
    assert json.loads(gate.get_pending_admission_json()) == {}
    assert json.loads(gate.get_pending_acknowledgment_json()) == {
        "sequence": 1, "candidate_key": "release-one", "policy_digest": POLICY,
        "assessment_digest": ASSESSMENT, "retry_count": 0,
    }
    with direct_vm.expect_revert("no matching finalized admission"):
        gate.activate_release("release-one")
    with direct_vm.expect_revert("stale or skipped"):
        deliver(direct_vm, gate, sequence=1, candidate="different-release", predecessor="release-one")
    assert gate.get_active_candidate() == "release-one"
    assert len(json.loads(gate.get_activation_history_json())) == 1
