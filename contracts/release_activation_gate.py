# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *


def _address(value) -> str:
    if hasattr(value, "as_hex"):
        return value.as_hex.lower()
    return Address(value).as_hex.lower()


class ReleaseActivationGate(gl.Contract):
    registry_address: str
    operator: str
    lineage_key: str
    policy_digest: str
    repository_owner: str
    repository_name: str
    active_candidate_key: str
    last_sequence: u256
    activation_history: str
    pending_admission: str
    pending_acknowledgment: str

    def __init__(self, registry_address: str, operator: str, lineage_key: str,
                 policy_digest: str, repository_owner: str, repository_name: str):
        self.registry_address = _address(registry_address)
        self.operator = _address(operator)
        self.lineage_key = lineage_key
        self.policy_digest = policy_digest
        self.repository_owner = repository_owner
        self.repository_name = repository_name
        self.active_candidate_key = ""
        self.last_sequence = u256(0)
        self.activation_history = "[]"
        self.pending_admission = ""
        self.pending_acknowledgment = ""

    @gl.public.write
    def receive_admission(self, lineage_key: str, sequence: u256, candidate_key: str,
                          policy_digest: str, commit_sha: str, predecessor_candidate_key: str,
                          assessment_digest: str, repository_owner: str, repository_name: str) -> str:
        if _address(gl.message.sender_address) != self.registry_address:
            raise gl.vm.UserError("only configured registry may deliver admission")
        if (lineage_key != self.lineage_key or policy_digest != self.policy_digest
                or repository_owner != self.repository_owner or repository_name != self.repository_name):
            raise gl.vm.UserError("admission does not match frozen gate authority")
        if not candidate_key or len(commit_sha) != 40 or len(assessment_digest) != 64:
            raise gl.vm.UserError("admission payload is incomplete")

        pending = json.loads(self.pending_admission) if self.pending_admission else {}
        if pending:
            if (sequence == pending.get("sequence") and candidate_key == pending.get("candidate_key")
                    and policy_digest == pending.get("policy_digest")
                    and commit_sha == pending.get("commit_sha")
                    and predecessor_candidate_key == pending.get("predecessor_candidate_key")
                    and assessment_digest == pending.get("assessment_digest")
                    and repository_owner == pending.get("repository_owner")
                    and repository_name == pending.get("repository_name")):
                return "DUPLICATE_PENDING"
            raise gl.vm.UserError("another admission is awaiting activation")
        if sequence == self.last_sequence and candidate_key == self.active_candidate_key:
            history = json.loads(self.activation_history)
            last = history[-1] if history else {}
            if (last.get("candidate_key") == candidate_key and last.get("policy_digest") == policy_digest
                    and last.get("commit_sha") == commit_sha
                    and last.get("assessment_digest") == assessment_digest
                    and last.get("predecessor_candidate_key") == predecessor_candidate_key):
                return "DUPLICATE_ACTIVE"
            raise gl.vm.UserError("replayed admission payload does not match finalized activation")
        if sequence != self.last_sequence + u256(1):
            raise gl.vm.UserError("stale or skipped admission sequence")
        if predecessor_candidate_key != self.active_candidate_key:
            raise gl.vm.UserError("admission predecessor is not the active release")

        admission = {
            "sequence": sequence,
            "candidate_key": candidate_key,
            "policy_digest": policy_digest,
            "commit_sha": commit_sha,
            "predecessor_candidate_key": predecessor_candidate_key,
            "assessment_digest": assessment_digest,
            "repository_owner": repository_owner,
            "repository_name": repository_name,
        }
        # A newer registry message can only exist after the registry finalized
        # this gate's prior activation acknowledgment and cleared its one-slot lock.
        self.pending_acknowledgment = ""
        self.pending_admission = json.dumps(admission, sort_keys=True)
        return "STAGED"

    @gl.public.write
    def activate_release(self, candidate_key: str) -> str:
        if _address(gl.message.sender_address) != self.operator:
            raise gl.vm.UserError("only configured operator may activate")
        pending = json.loads(self.pending_admission) if self.pending_admission else {}
        if not pending or candidate_key != pending.get("candidate_key"):
            raise gl.vm.UserError("candidate has no matching finalized admission")
        if pending.get("sequence") != self.last_sequence + u256(1):
            raise gl.vm.UserError("admission sequence is stale")
        if pending.get("predecessor_candidate_key") != self.active_candidate_key:
            raise gl.vm.UserError("admission predecessor is not the active release")

        record = {
            "sequence": pending["sequence"],
            "candidate_key": candidate_key,
            "policy_digest": self.policy_digest,
            "commit_sha": pending["commit_sha"],
            "assessment_digest": pending["assessment_digest"],
            "predecessor_candidate_key": pending["predecessor_candidate_key"],
        }
        history = json.loads(self.activation_history)
        if any(item.get("candidate_key") == candidate_key for item in history):
            raise gl.vm.UserError("candidate activation replay")
        history.append(record)
        self.activation_history = json.dumps(history, sort_keys=True)
        self.active_candidate_key = candidate_key
        self.last_sequence = pending["sequence"]
        self.pending_admission = ""

        acknowledgment = {
            "sequence": self.last_sequence,
            "candidate_key": candidate_key,
            "policy_digest": self.policy_digest,
            "assessment_digest": pending["assessment_digest"],
            "retry_count": 0,
        }
        self.pending_acknowledgment = json.dumps(acknowledgment, sort_keys=True)
        registry = gl.get_contract_at(Address(self.registry_address))
        registry.emit(on="finalized").acknowledge_activation(
            self.lineage_key, self.last_sequence, candidate_key,
            self.policy_digest, pending["assessment_digest"])
        return candidate_key

    @gl.public.write
    def retry_activation_acknowledgment(self) -> str:
        if not self.pending_acknowledgment:
            raise gl.vm.UserError("no activation acknowledgment is pending")
        acknowledgment = json.loads(self.pending_acknowledgment)
        retries = int(acknowledgment.get("retry_count", 0))
        if retries >= 3:
            raise gl.vm.UserError("activation acknowledgment retry limit exhausted")
        acknowledgment["retry_count"] = retries + 1
        self.pending_acknowledgment = json.dumps(acknowledgment, sort_keys=True)
        registry = gl.get_contract_at(Address(self.registry_address))
        registry.emit(on="finalized").acknowledge_activation(
            self.lineage_key, acknowledgment["sequence"], acknowledgment["candidate_key"],
            acknowledgment["policy_digest"], acknowledgment["assessment_digest"])
        return "ACKNOWLEDGMENT_RETRIED"

    @gl.public.view
    def get_active_candidate(self) -> str:
        return self.active_candidate_key

    @gl.public.view
    def get_activation_history_json(self) -> str:
        return self.activation_history

    @gl.public.view
    def get_pending_admission_json(self) -> str:
        return self.pending_admission or "{}"

    @gl.public.view
    def get_pending_acknowledgment_json(self) -> str:
        return self.pending_acknowledgment or "{}"

    @gl.public.view
    def get_configuration_json(self) -> str:
        return json.dumps({
            "registry_address": self.registry_address,
            "operator": self.operator,
            "lineage_key": self.lineage_key,
            "policy_digest": self.policy_digest,
            "repository_owner": self.repository_owner,
            "repository_name": self.repository_name,
        }, sort_keys=True)
