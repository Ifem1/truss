# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


def _address(value) -> str:
    if hasattr(value, "as_hex"):
        return value.as_hex.lower()
    return Address(value).as_hex.lower()


class FinalizedMessageProbeSender(gl.Contract):
    owner: str
    last_nonce: u256
    last_payload: str
    last_receiver: str

    def __init__(self):
        self.owner = _address(gl.message.sender_address)
        self.last_nonce = u256(0)
        self.last_payload = ""
        self.last_receiver = ""

    @gl.public.write
    def emit_finalized(self, receiver_address: Address, payload: str) -> u256:
        if _address(gl.message.sender_address) != self.owner:
            raise gl.vm.UserError("only probe owner may emit")
        nonce = self.last_nonce + u256(1)
        receiver = gl.get_contract_at(receiver_address)
        receiver.emit(on="finalized").receive_finalized(nonce, payload)
        self.last_nonce = nonce
        self.last_payload = payload
        self.last_receiver = _address(receiver_address)
        return nonce

    @gl.public.view
    def get_emitted_state(self) -> dict:
        return {
            "nonce": self.last_nonce,
            "payload": self.last_payload,
            "receiver": self.last_receiver,
            "owner": self.owner,
        }
