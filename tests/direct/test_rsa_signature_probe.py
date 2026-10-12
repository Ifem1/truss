"""Real GenVM Direct Mode tests for the isolated RFC 8017 verifier."""

import time


MESSAGE = "TRUSS-RSA-SHA256-DIRECT-MODE-V1"
EXPONENT = "010001"
MODULUS_A = (
    "c2c9c0f586cc1e6b944c0067a5076c94f7e379584aaa1833e25e06dfd597604e"
    "9c826770b2ce5b71dfec14b18d59269ff74c44bdcb57811cdfe8e9b3167247a0"
    "08635564a18d9fbadd46eb8b02af0572cf53a279a487c3f7811b25e3280a50b0"
    "3c2818947dac48cd8d5bc8f2c985485fbeab50e2d664aad077085b7d95869267"
    "42b15cd5f3bb9b840b31145d6f04e3046bc31c4e290f0af1c3e22262d0ae8dc6"
    "e19d539a73c80923951567501108276d35b59c49636111f8d66e3d8faa34a742"
    "75f99b0329100b0c02f277eae8fb105e7762ee71a948e6828fa938e4c5e68a9c"
    "5b667526ffbe151a7c11555c4eb2b497e8032d05671438d05da08f8639613b29"
)
SIGNATURE_A = (
    "908e990fa46892f941c7fe2dc79fcbc3e486f1a56a990e58b554f5f56680d660"
    "1533d28b191f6c8c8e743417d7e18eac76aae9c74ff41d6a8f5886fe67a966d"
    "6a2decb32820bae4fdffc1f8bc26c1a80b531bf6b28fdd5dfc85407dad4ddb246"
    "3d2f1e688bf459e7ee598898863857afbd73cc573d181030adc90ab69ecdcbfad"
    "11d3c6be58d713887ad9d2d584d7c30e2416caa8ec6a8771f75de1dda6ab4ba8"
    "e9fc0b98a83479c660411acc43bc6d73c08e36aa142f0c3fa86994cc09866cf4"
    "4278e9dc4d0cf049253e79969993b413c4bd4f7a2fb2acee94bd1eeec2be759d"
    "33a5572adfc0eabed9b0d1d767dd9983ca5424524e824776243ccf801f4adf9"
)
MODULUS_B = (
    "cf28cc3306871d93d766cc54457fe054bd5cc8e95ce19b7dc316659403e52cbee"
    "3e30d1d3657ce1e6e9aeb717f9e2530b34dc84311ed28eaf8529e57052de91ed"
    "1f297ae23aeeec57e3f48fb3e8f446a926329e71f84807d92a0c03aa201f8f15"
    "ff5834813d5bab57d90cf2a2ce4114ebeb2453f61a07d574cab03c34019079be"
    "ee16f3fed451ebff4f88909a146755c48e7b343bf2a2d8e4e15d980f00d019664"
    "7ea2f34cf36979890af575c89aa666258a7046374a00f19776b8183e53740f97"
    "b6c4158477eb52f45fe062da87b69bc478f394dc0156cc06f772a99a93549c615"
    "3fb1149d45a6b04f07fb4ef41f75af151ec3d1a7cb07488c15c284936be63"
)
SIGNATURE_B = (
    "bb8c453a7343855545c121d2485ce69679ced10ace7eb538b980daea0429c259"
    "d75312169478eda902360771c57102fa76ca5b032054c974629ff3d510682c5e"
    "6d3f1f54d7bb364b3e9eb0ee4b623e073096d1baa0ee0aa7007dfa3c1cc2c44d"
    "21180ed4d11ce9e035201c21ee1f30f6d7524d2ec6067efd14ea65bf1552d698"
    "92788fa43bd67ddf402c82914c9be6fb95277c53a0508393473d58fcad8ad753"
    "f14c06318dedf20b9fb4d872c57e78f7d08a2f80427a16ede0328842b89f373"
    "1446a4df5eb31ae90e139fb218d3f5989b7bf3e06c7d13506cf236f9a5725e7c"
    "957bcd7d5226a2865a7f76339bf52a803858053aeb63d7d1b2d2e3dcc44c54472"
)


def test_rfc8017_rsa_sha256_in_pinned_genvm_direct_mode(direct_deploy):
    probe = direct_deploy("contracts/rsa_signature_probe.py")

    start = time.perf_counter()
    assert probe.verify(MESSAGE, SIGNATURE_A, MODULUS_A, EXPONENT) is True
    valid_elapsed = time.perf_counter() - start

    altered_message = MESSAGE + "-altered"
    assert probe.verify(altered_message, SIGNATURE_A, MODULUS_A, EXPONENT) is False
    assert probe.verify(MESSAGE, "00" + SIGNATURE_A[2:], MODULUS_A, EXPONENT) is False
    assert probe.verify(MESSAGE, SIGNATURE_B, MODULUS_A, EXPONENT) is False
    assert probe.verify(MESSAGE, SIGNATURE_A, MODULUS_B, EXPONENT) is False
    assert probe.verify(MESSAGE, "not-hex", MODULUS_A, EXPONENT) is False
    assert probe.verify(MESSAGE, SIGNATURE_A, MODULUS_A, "02") is False

    # Keep the observed result visible in CI for runtime-cost comparisons.
    print(f"GenVM RSA-2048 verify view latency: {valid_elapsed:.6f}s")
