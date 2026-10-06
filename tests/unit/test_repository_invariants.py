from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def test_network_lock_is_61999_only():
    package=(ROOT/'package.json').read_text(); env=(ROOT/'.env.example').read_text()
    assert '"genlayer": "0.39.1"' in package
    assert '61999' in env and '61997' not in env
def test_no_backend_dependencies_in_starter():
    package=(ROOT/'package.json').read_text().lower()
    for banned in ('supabase','firebase','express','walletconnect','privy'): assert banned not in package
