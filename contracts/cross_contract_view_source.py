# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


class CrossContractViewSource(gl.Contract):
    marker: str

    def __init__(self):
        self.marker = "TRUSS-STUDIONET-XCALL-MARKER-20261010"

    @gl.public.view
    def get_marker(self) -> str:
        return self.marker
