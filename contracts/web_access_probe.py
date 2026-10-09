# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import hashlib
import genlayer.gl.vm as glvm
from genlayer import *


class WebAccessProbe(gl.Contract):
    def __init__(self):
        pass

    @gl.public.write
    def probe_release_hosts(self) -> dict:
        urls = [
            "https://api.github.com/repos/genlayerlabs/genlayer-js/git/ref/tags/v1.1.8",
            "https://raw.githubusercontent.com/genlayerlabs/genlayer-js/4303db00c428d57c6d8e5b04a75043ea42d4b0e7/package.json",
            "https://cdn.jsdelivr.net/gh/genlayerlabs/genlayer-js@4303db00c428d57c6d8e5b04a75043ea42d4b0e7/package.json",
            "https://github.com/genlayerlabs/genlayer-js/info/refs?service=git-upload-pack",
            "https://api.github.com/repos/Ifem1/truss/actions/runs/37909059777",
            "https://github.com/Ifem1/truss/actions/runs/37909059777",
        ]

        def inspect() -> dict:
            findings = []
            for url in urls:
                try:
                    response = gl.nondet.web.get(url, headers={"User-Agent": "TRUSS-GenVM-Probe/1.0", "Accept": "application/vnd.github+json"})
                    body = response.body or b""
                    findings.append({"url": url, "status": int(response.status),
                                     "bytes": len(body), "sha256": hashlib.sha256(body).hexdigest(),
                                     "excerpt": body[:240].decode("utf-8", errors="replace")})
                except Exception as exc:
                    findings.append({"url": url, "status": 0, "bytes": 0, "sha256": "",
                                     "excerpt": type(exc).__name__[:80]})
            return {"findings": findings}

        def validate(result) -> bool:
            if not isinstance(result, glvm.Return):
                return False
            own = inspect()
            claimed = result.calldata
            if not isinstance(claimed, dict):
                return False
            return [x["status"] for x in own["findings"]] == [x.get("status") for x in claimed.get("findings", [])]

        return gl.vm.run_nondet_unsafe(inspect, validate)
