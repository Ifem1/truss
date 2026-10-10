"""Local harness checks for the exact three Studionet cross-contract operations."""

SOURCE = "0x" + "ab" * 20
PROBE = "contracts/cross_contract_view_probe.py"
MARKER = "TRUSS-STUDIONET-XCALL-MARKER-20261010"


def make_probe(direct_vm, direct_deploy):
    from genlayer.py import calldata

    probe = direct_deploy(PROBE, SOURCE)
    states = []

    def source_view(vm, request):
        call = request.get("CallContract")
        if call is None:
            return None
        assert str(call["address"]).lower() == SOURCE
        states.append(call["state"])
        return bytes([0]) + calldata.encode(MARKER)

    direct_vm._gl_call_hook = source_view
    return probe, states


def test_default_and_latest_final_cross_views_are_distinct_calls(direct_vm, direct_deploy):
    probe, states = make_probe(direct_vm, direct_deploy)

    assert probe.read_default_view() == MARKER
    assert states[-1] == 2  # GenVM's default state selector in the current runner.

    assert probe.read_latest_final_view() == MARKER
    assert states[-1] == 1


def test_onchain_write_consumes_latest_final_cross_view(direct_vm, direct_deploy):
    probe, states = make_probe(direct_vm, direct_deploy)

    assert probe.consume_latest_final_view() == MARKER
    assert states == [1]
    assert probe.get_consumed_marker() == MARKER
