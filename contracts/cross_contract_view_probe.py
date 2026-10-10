# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from genlayer.py.public_abi import StorageType


class CrossContractViewProbe(gl.Contract):
    source_address: str
    consumed_marker: str

    def __init__(self, source_address: Address):
        self.source_address = (
            source_address.as_hex.lower()
            if hasattr(source_address, "as_hex")
            else Address(source_address).as_hex.lower()
        )
        self.consumed_marker = ""

    @gl.public.view
    def read_default_view(self) -> str:
        source = gl.get_contract_at(Address(self.source_address))
        return source.view().get_marker()

    @gl.public.view
    def read_latest_final_view(self) -> str:
        source = gl.get_contract_at(Address(self.source_address))
        return source.view(state=StorageType.LATEST_FINAL).get_marker()

    @gl.public.write
    def consume_latest_final_view(self) -> str:
        source = gl.get_contract_at(Address(self.source_address))
        marker = source.view(state=StorageType.LATEST_FINAL).get_marker()
        self.consumed_marker = marker
        return marker

    @gl.public.view
    def get_consumed_marker(self) -> str:
        return self.consumed_marker
