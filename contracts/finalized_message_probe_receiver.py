# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *


def _address(value) -> str:
    if hasattr(value, "as_hex"):
        return value.as_hex.lower()
    return Address(value).as_hex.lower()


class FinalizedMessageProbeReceiver(gl.Contract):
    expected_sender: str
    received_nonce: u256
    received_payload: str
    received_sender: str

    def __init__(self, expected_sender: Address):
        self.expected_sender = _address(expected_sender)
        self.received_nonce = u256(0)
        self.received_payload = ""
        self.received_sender = ""

    @gl.public.write
    def receive_finalized(self, nonce: u256, payload: str) -> bool:
        sender = _address(gl.message.sender_address)
        if sender != self.expected_sender:
            raise gl.vm.UserError("unauthorized message sender")
        if nonce != self.received_nonce + u256(1):
            raise gl.vm.UserError("duplicate or stale message nonce")
        self.received_nonce = nonce
        self.received_payload = payload
        self.received_sender = sender
        return True

    @gl.public.view
    def get_received_state(self) -> dict:
        return {
            "nonce": self.received_nonce,
            "payload": self.received_payload,
            "sender": self.received_sender,
            "expected_sender": self.expected_sender,
        }
