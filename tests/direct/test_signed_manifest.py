"""Direct Mode tests for policy-bound, signed release-manifest verification."""

import hashlib
import json


N = (
    "b7774f97b59337506dc21598f714fff7908d7548129ed6eaa7d4ca5bb91199c2b4f735569cb0ea76b0c4662aa641195e750403ae3e7dbc37d806371873b158198d3075907e583c597c016fb369557b4555b078c26667aa29eaeac18544b0441e449039f29436eb2406455fb5ab4a542aa8cf89faab11693759e9b49684253df113a0662b7f3a47d2096330bb10eef59ddfa16c4146998b3eadf249dbdfe1a31d5b84426917bebb2f9fb5a3c3b4becd1a8886ca8c77ad6a56698af978df3145ea712b60ba0de934d6087ceb07caa5a26864d3e1b6fa7361fe4e179a00590fbabb8365fba8298cfb72304e0b45eb2299d33499621c31380ff5b097dfb045e74d59"
)
E = "010001"
KEY_ID = "sha256:516d0d0f0cc66609a345dab9b6a60a893e1125453c02d5c1de69d9da04b1b866"
SIGNATURE = (
    "4d194fd4d2ba3ab0183d62f2714c8856a0f33a797d7f73b889dd800419768507c6b8786cd4c03792349baf1d7b9029c4214c492aae64c0fb2dfb12dacc5cd2f23c1201cae92785b6183e8dbfaa380755932823e629676d215a17be4c9fa14cbe5f4e65749cd2e39821c7841c522d20cca7080050cae7c94a1e2a45c068845ff8fbcc4f4cf2fa3f0c790649a6ab2ff327c985d3fc3e19e33275ad0b61359a2fc4bc3aea3792d13d77a2e6b153e8d6ca9de7ab20cfff5e529e6d85038475b98110a2180e300c7184fc3ee0d2a5eb81cf70fe8c06b96e62fa49410713e08c447b05b6b400ca8f908ef108420ec11b45c74d19571f44e9157f28f72e515b1e14bb29"
)
MANIFEST_URL = "https://github.com/Ifem1/truss/releases/download/v1.2.3/release-manifest.json"
RELEASE_URL = "https://github.com/Ifem1/truss/releases/tag/v1.2.3"
COMMIT = "a" * 40


def payload():
    return {
        "schema": "truss-release-manifest-v1",
        "repository": "https://github.com/Ifem1/truss",
        "repository_id": "1407596595",
        "commit_sha": COMMIT,
        "release_tag": "v1.2.3",
        "tag_object_sha": "d" * 40,
        "artifact_sha256": "b" * 64,
        "ci_run_url": "https://api.github.com/repos/Ifem1/truss/actions/runs/123456789",
        "ci_run_id": "123456789",
        "ci_workflow": "Ifem1/truss/.github/workflows/ci.yml@refs/tags/v1.2.3",
        "ci_event": "push",
        "ci_conclusion": "success",
        "signer_key_id": KEY_ID,
    }


def envelope(data=None, signature=SIGNATURE):
    return json.dumps({"payload": data or payload(), "signature_hex": signature},
                      sort_keys=True, separators=(",", ":"))


def _policy(direct_vm, direct_deploy, policy_key="manifest-policy", modulus=N):
    contract = direct_deploy("contracts/truss_registry.py")
    owner, publisher, issuer = "0x" + "11" * 20, "0x" + "22" * 20, "0x" + "33" * 20
    direct_vm.sender = bytes.fromhex("11" * 20)
    contract.create_policy_with_signed_manifest(
        policy_key, "manifest-lineage-" + policy_key, "TRUSS", "Ifem1", "truss",
        "A fixture policy for cryptographic release provenance tests in Direct Mode.",
        "Admission requires an authorized RSA signer to attest the exact repository, release tag, commit, artifact digest, and CI metadata.",
        json.dumps([{"id": "SIGNED_RELEASE", "title": "Signed release", "rule": "The authorized key must sign the exact frozen candidate and its release artifact."}]),
        json.dumps(["RELEASE_IDENTITY", "PROVENANCE"]),
        json.dumps({
            "RELEASE_IDENTITY": ["github.com|/Ifem1/truss/releases/tag/"],
            "PROVENANCE": ["github.com|/Ifem1/truss/releases/download/"],
        }), "", publisher,
        json.dumps({"RELEASE_IDENTITY": issuer, "PROVENANCE": issuer}),
        json.dumps({"modulus_hex": modulus, "exponent_hex": E}),
        "1407596595",
    )
    policy = json.loads(contract.get_policy_json(policy_key))
    candidate = {
        "candidate_key": "manifest-candidate", "policy_key": policy_key,
        "policy_digest": policy["policy_digest"], "repository_owner": "Ifem1",
        "repository_name": "truss", "release_label": "v1.2.3", "commit_sha": COMMIT,
    }
    evidence = [{"role": "PROVENANCE", "url": MANIFEST_URL}]
    return contract, policy, candidate, evidence


def _verify(direct_vm, contract, policy, candidate, evidence, body):
    direct_vm.clear_mocks()
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    direct_vm.mock_web(r".*release-manifest\.json", {"status": 200, "body": body})
    return contract._signed_manifest_provenance(policy, candidate, evidence, {MANIFEST_URL: digest})


def test_policy_bound_signed_manifest_verifies_and_rejects_tampering(direct_vm, direct_deploy):
    contract, policy, candidate, evidence = _policy(direct_vm, direct_deploy)

    valid = _verify(direct_vm, contract, policy, candidate, evidence, envelope())
    assert valid["manifest_signature_verified"] is True
    assert valid["manifest_repository_matches"] is True
    assert valid["manifest_repository_id_matches"] is True
    assert valid["manifest_candidate_matches"] is True
    assert valid["manifest_artifact_digest_valid"] is True
    assert valid["manifest_ci_claim_valid"] is True
    assert valid["signed_content_substitution_blocked"] is True
    assert contract._provenance_satisfied(valid) is True

    forged_signature = ("00" if SIGNATURE[:2] != "00" else "01") + SIGNATURE[2:]
    assert contract._provenance_satisfied(_verify(
        direct_vm, contract, policy, candidate, evidence, envelope(signature=forged_signature))) is False

    altered = payload()
    altered["artifact_sha256"] = "c" * 64
    altered_manifest = _verify(direct_vm, contract, policy, candidate, evidence, envelope(altered))
    assert altered_manifest["manifest_signature_verified"] is False
    assert contract._provenance_satisfied(altered_manifest) is False

    wrong_repository = payload()
    wrong_repository["repository_id"] = "999999999"
    wrong_repo_manifest = _verify(direct_vm, contract, policy, candidate, evidence, envelope(wrong_repository))
    assert wrong_repo_manifest["manifest_signature_verified"] is False
    assert contract._provenance_satisfied(wrong_repo_manifest) is False

    wrong_candidate = dict(candidate, commit_sha="e" * 40)
    mismatch = _verify(direct_vm, contract, policy, wrong_candidate, evidence, envelope())
    assert mismatch["manifest_signature_verified"] is True
    assert mismatch["manifest_candidate_matches"] is False
    assert contract._provenance_satisfied(mismatch) is False

    _, wrong_key_policy, _, _ = _policy(direct_vm, direct_deploy, "wrong-key-policy", modulus=("c" + N[1:]))
    wrong_key = _verify(direct_vm, contract, wrong_key_policy, candidate, evidence, envelope())
    assert wrong_key["manifest_signature_verified"] is False
    assert wrong_key["manifest_signer_key_matches"] is False
    assert contract._provenance_satisfied(wrong_key) is False

    assert contract._provenance_satisfied(_verify(
        direct_vm, contract, policy, candidate, evidence, "{malformed")) is False


def test_valid_signed_manifest_supports_actual_direct_mode_admission(direct_vm, direct_deploy):
    contract, policy, candidate, _ = _policy(direct_vm, direct_deploy)
    lineage = policy["lineage_key"]
    manifest_body = envelope()
    release_body = "TRUSS v1.2.3 release; signed manifest is the admission authority."
    evidence = json.dumps([
        {"role": "RELEASE_IDENTITY", "url": RELEASE_URL},
        {"role": "PROVENANCE", "url": MANIFEST_URL},
    ])
    contract.configure_activation_gate(policy["policy_key"], "0x" + "aa" * 20)
    direct_vm.sender = bytes.fromhex("22" * 20)
    contract.open_candidate(candidate["candidate_key"], policy["policy_key"], "v1.2.3",
                            COMMIT, "", evidence)
    direct_vm.sender = bytes.fromhex("33" * 20)
    contract.attest_evidence(candidate["candidate_key"], "RELEASE_IDENTITY", RELEASE_URL,
                             hashlib.sha256(release_body.encode()).hexdigest())
    contract.attest_evidence(candidate["candidate_key"], "PROVENANCE", MANIFEST_URL,
                             hashlib.sha256(manifest_body.encode()).hexdigest())
    direct_vm.sender = bytes.fromhex("44" * 20)
    contract.seal_candidate(candidate["candidate_key"])

    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*releases/tag/v1\.2\.3", {"status": 200, "body": release_body})
    direct_vm.mock_web(r".*release-manifest\.json", {"status": 200, "body": manifest_body})
    result = {
        "identity_match": "MATCH",
        "identity_finding": "The release manifest matches the candidate.",
        "criteria": [{"id": "SIGNED_RELEASE", "state": "SATISFIED", "finding": "Signed candidate fields match."}],
        "evidence_states": [
            {"url": RELEASE_URL, "state": "SUPPORTS", "finding": "Release identity evidence."},
            {"url": MANIFEST_URL, "state": "SUPPORTS", "finding": "RSA-signed release manifest."},
        ],
        "material_findings": [], "summary": "Signed release manifest matches frozen candidate.",
    }
    direct_vm.mock_llm(r"You are evaluating a software release for admission", json.dumps(result))
    direct_vm.mock_llm(r"Two assessments already match on all decision fields", json.dumps({"equivalent": True}))
    direct_vm.sender = bytes.fromhex("55" * 20)
    assessment = contract.assess_candidate(candidate["candidate_key"])
    assert assessment["identity_match"] == "MATCH"
    assert assessment["authenticated_admission"] is True
    assert assessment["provenance_checks"]["manifest_signature_verified"] is True
    assert assessment["verdict"] == "ADMITTED"
    assert contract.get_admitted_head(lineage) == candidate["candidate_key"]


def test_forged_signed_manifest_cannot_admit_even_when_model_claims_match(direct_vm, direct_deploy):
    contract, policy, candidate, _ = _policy(direct_vm, direct_deploy)
    lineage = policy["lineage_key"]
    forged = ("00" if SIGNATURE[:2] != "00" else "01") + SIGNATURE[2:]
    manifest_body = envelope(signature=forged)
    release_body = "TRUSS v1.2.3 release."
    evidence = json.dumps([
        {"role": "RELEASE_IDENTITY", "url": RELEASE_URL},
        {"role": "PROVENANCE", "url": MANIFEST_URL},
    ])
    contract.configure_activation_gate(policy["policy_key"], "0x" + "aa" * 20)
    direct_vm.sender = bytes.fromhex("22" * 20)
    contract.open_candidate(candidate["candidate_key"], policy["policy_key"], "v1.2.3",
                            COMMIT, "", evidence)
    direct_vm.sender = bytes.fromhex("33" * 20)
    contract.attest_evidence(candidate["candidate_key"], "RELEASE_IDENTITY", RELEASE_URL,
                             hashlib.sha256(release_body.encode()).hexdigest())
    contract.attest_evidence(candidate["candidate_key"], "PROVENANCE", MANIFEST_URL,
                             hashlib.sha256(manifest_body.encode()).hexdigest())
    direct_vm.sender = bytes.fromhex("44" * 20)
    contract.seal_candidate(candidate["candidate_key"])
    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*releases/tag/v1\.2\.3", {"status": 200, "body": release_body})
    direct_vm.mock_web(r".*release-manifest\.json", {"status": 200, "body": manifest_body})
    result = {
        "identity_match": "MATCH",
        "identity_finding": "Model claims the release matches.",
        "criteria": [{"id": "SIGNED_RELEASE", "state": "SATISFIED", "finding": "Model claims it passed."}],
        "evidence_states": [
            {"url": RELEASE_URL, "state": "SUPPORTS", "finding": "Release identity evidence."},
            {"url": MANIFEST_URL, "state": "SUPPORTS", "finding": "Claimed signed release manifest."},
        ],
        "material_findings": [], "summary": "Model says this is valid.",
    }
    direct_vm.mock_llm(r"You are evaluating a software release for admission", json.dumps(result))
    direct_vm.mock_llm(r"Two assessments already match on all decision fields", json.dumps({"equivalent": True}))
    assessment = contract.assess_candidate(candidate["candidate_key"])
    assert assessment["provenance_checks"]["manifest_signature_verified"] is False
    assert assessment["identity_match"] == "UNVERIFIED"
    assert assessment["authenticated_admission"] is False
    assert assessment["verdict"] == "INSUFFICIENT_EVIDENCE"
    assert contract.get_admitted_head(lineage) == ""
    assert json.loads(contract.get_pending_activation_json(lineage)) == {}
