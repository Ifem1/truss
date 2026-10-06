"""Real Direct Mode setup for genlayer-testing-suite 0.29.2."""
import os
import tempfile
from pathlib import Path
import pytest
import sys
from gltest.direct import loader
from gltest.direct.loader import deploy_contract

@pytest.fixture(autouse=True)
def _direct_mode_compatibility(direct_vm, monkeypatch):
    direct_vm.check_pickling = True
    original_warp = direct_vm.warp
    def warp_and_refresh(timestamp):
        original_warp(timestamp)
        import sys
        gl = sys.modules.get("genlayer.gl")
        if gl is not None and isinstance(getattr(gl, "message_raw", None), dict):
            gl.message_raw["datetime"] = timestamp
    monkeypatch.setattr(direct_vm, "warp", warp_and_refresh)
    # Reset the SDK's one-contract-per-module guard before each deployment.
    genvm_contracts = sys.modules.get("genlayer.gl.genvm_contracts")
    if genvm_contracts is not None:
        genvm_contracts.__known_contract__ = None
    gltest_wasi = sys.modules.get("gltest.direct.wasi_mock")
    if gltest_wasi is not None:
        gltest_wasi.set_vm(direct_vm)
    # GenLayer Test's Windows loader unlinks its stdin message while the fd is open.
    if os.name == "nt":
        pending = []
        original_unlink = os.unlink
        def windows_safe_unlink(path, *args, **kwargs):
            remaining = []
            for item in pending:
                try: original_unlink(item)
                except FileNotFoundError: pass
                except PermissionError: remaining.append(item)
            pending[:] = remaining
            try: return original_unlink(path, *args, **kwargs)
            except PermissionError as exc:
                if getattr(exc, "winerror", None) != 32: raise
                pending.append(os.fspath(path))
        monkeypatch.setattr(os, "unlink", windows_safe_unlink)
    yield
    gl_module = sys.modules.get("genlayer.gl.genvm_contracts")
    if gl_module is not None:
        gl_module.__known_contract__ = None

@pytest.fixture
def direct_deploy(direct_vm, monkeypatch):
    from gltest.direct import sdk_loader
    from gltest.direct import loader as direct_loader
    sdk_loader.setup_sdk_paths(Path("contracts/truss_registry.py").resolve(), "v0.2.16")
    from genlayer.py import calldata
    from genlayer.py.types import Address
    import gltest.direct.wasi_mock as wasi_mock
    original_gl_call = wasi_mock.gl_call
    def sdk_abi_gl_call(raw_data):
        from genlayer.py import calldata as sdk_calldata
        from genlayer.py.types import Lazy
        request = sdk_calldata.decode(raw_data)
        response = original_gl_call(raw_data)
        vm = wasi_mock.get_vm()
        vm._truss_last_request = request
        if not isinstance(request, dict) or "WebRequest" not in request or response == 2**32 - 1:
            return response
        fd_buffers = wasi_mock._local.fd_buffers
        buf = fd_buffers.pop(response)
        vm._truss_web_mock_result = sdk_calldata.decode(buf.read())
        result = vm._truss_web_mock_result
        payload = result.get("ok", {}).get("response", {})
        vm = wasi_mock.get_vm()
        vm._truss_http_responses = getattr(vm, "_truss_http_responses", []) + [payload]
        encoded = sdk_calldata.encode({"ok": {"response": payload}})
        fd = wasi_mock._local.fd_counter
        wasi_mock._local.fd_counter += 1
        fd_buffers[fd] = __import__("io").BytesIO(encoded)
        return fd
    monkeypatch.setattr(wasi_mock, "gl_call", sdk_abi_gl_call)
    monkeypatch.setattr(sdk_loader, "get_latest_version", lambda: "v0.2.16")
    def deploy(path, *args, **kwargs):
        import sys
        genvm_contracts = sys.modules.get("genlayer.gl.genvm_contracts")
        if genvm_contracts is not None:
            genvm_contracts.__known_contract__ = None
        if os.name == "nt":
            import tempfile
            def windows_safe_inject(vm):
                sender = Address(vm.sender) if isinstance(vm.sender, bytes) else vm.sender
                contract = Address(vm._contract_address) if isinstance(vm._contract_address, bytes) else vm._contract_address
                origin = Address(vm.origin) if isinstance(vm.origin, bytes) else vm.origin
                message = {"contract_address":contract,"sender_address":sender,"origin_address":origin,"stack":[],"value":vm._value,"datetime":vm._datetime,"is_init":False,"chain_id":vm._chain_id,"entry_kind":0,"entry_data":b"","entry_stage_data":None}
                encoded = calldata.encode(message)
                fd, temp_path = tempfile.mkstemp()
                os.write(fd, encoded); os.lseek(fd, 0, os.SEEK_SET)
                vm._original_stdin_fd = os.dup(0); os.dup2(fd, 0); os.close(fd)
                vm._truss_stdin_path = temp_path
            direct_loader._inject_message_to_fd0 = windows_safe_inject
        original = getattr(direct_vm, "_original_stdin_fd", None)
        try:
            import sys
            genvm_contracts = sys.modules.get("genlayer.gl.genvm_contracts")
            if genvm_contracts is not None:
                genvm_contracts.__known_contract__ = None
            return deploy_contract(Path(path), direct_vm, *args, sdk_version="v0.2.16", **kwargs)
        finally:
            if original is not None:
                os.dup2(original, 0)
                os.close(original)
                del direct_vm._original_stdin_fd
            temp_path = getattr(direct_vm, "_truss_stdin_path", None)
            if temp_path is not None:
                os.unlink(temp_path)
                del direct_vm._truss_stdin_path
    return deploy
