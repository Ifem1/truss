# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *
from genlayer.py.public_abi import StorageType


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
    activation_history: str

    def __init__(self, registry_address: str, operator: str, lineage_key: str,
                 policy_digest: str, repository_owner: str, repository_name: str):
        self.registry_address = _address(registry_address)
        self.operator = _address(operator)
        self.lineage_key = lineage_key
        self.policy_digest = policy_digest
        self.repository_owner = repository_owner
        self.repository_name = repository_name
        self.active_candidate_key = ""
        self.activation_history = "[]"

    @gl.public.write
    def activate_release(self, candidate_key: str) -> str:
        if _address(gl.message.sender_address) != self.operator:
            raise gl.vm.UserError("only configured operator may activate")
        if candidate_key == self.active_candidate_key:
            raise gl.vm.UserError("release is already active")
        registry = gl.get_contract_at(Address(self.registry_address))
        final_registry = registry.view(state=StorageType.LATEST_FINAL)
        if final_registry.get_admitted_head(self.lineage_key) != candidate_key:
            raise gl.vm.UserError("candidate is not the authoritative admitted head")
        raw = final_registry.get_candidate_json(candidate_key)
        if not raw:
            raise gl.vm.UserError("candidate not found in configured registry")
        candidate = json.loads(raw)
        if (candidate.get("status") != "ADMITTED"
                or candidate.get("lineage_key") != self.lineage_key
                or candidate.get("policy_digest") != self.policy_digest
                or candidate.get("repository_owner") != self.repository_owner
                or candidate.get("repository_name") != self.repository_name):
            raise gl.vm.UserError("candidate does not meet frozen activation authority")
        policy_raw = final_registry.get_policy_json(str(candidate.get("policy_key", "")))
        if not policy_raw:
            raise gl.vm.UserError("candidate policy not found")
        policy = json.loads(policy_raw)
        if (policy.get("policy_digest") != self.policy_digest
                or policy.get("lineage_key") != self.lineage_key
                or policy.get("repository_owner") != self.repository_owner
                or policy.get("repository_name") != self.repository_name):
            raise gl.vm.UserError("policy does not meet frozen activation authority")
        attempts = candidate.get("assessment_attempts", [])
        if not attempts or attempts[-1].get("verdict") != "ADMITTED":
            raise gl.vm.UserError("candidate has no admitted assessment")
        record = {
            "candidate_key": candidate_key,
            "policy_digest": self.policy_digest,
            "commit_sha": candidate.get("commit_sha", ""),
            "assessment_digest": attempts[-1].get("assessment_digest", ""),
        }
        history = json.loads(self.activation_history)
        if any(item.get("candidate_key") == candidate_key for item in history):
            raise gl.vm.UserError("candidate activation replay")
        history.append(record)
        self.activation_history = json.dumps(history, sort_keys=True)
        self.active_candidate_key = candidate_key
        return candidate_key

    @gl.public.view
    def get_active_candidate(self) -> str:
        return self.active_candidate_key

    @gl.public.view
    def get_activation_history_json(self) -> str:
        return self.activation_history

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
