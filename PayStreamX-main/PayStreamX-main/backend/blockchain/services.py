"""
Algorand blockchain service layer.
Handles wallet creation, ASA management, and smart contract interactions.
"""
import os
import json
import base64
from decimal import Decimal

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod, indexer
from django.conf import settings

from cryptography.fernet import Fernet


# Lazy Fernet cipher — initialized on first use, not at import time
_cipher = None


def _get_cipher():
    global _cipher
    if _cipher is None:
        key = os.getenv('WALLET_ENCRYPTION_KEY', '')
        if not key:
            key = Fernet.generate_key().decode()
        # Ensure the key is valid base64-encoded 32-byte key
        try:
            _cipher = Fernet(key.encode() if isinstance(key, str) else key)
        except Exception:
            _cipher = Fernet(Fernet.generate_key())
    return _cipher


def get_algod_client():
    return algod.AlgodClient(
        settings.ALGORAND_API_TOKEN,
        settings.ALGORAND_API_URL
    )


def get_indexer_client():
    return indexer.IndexerClient(
        settings.ALGORAND_API_TOKEN,
        settings.ALGORAND_INDEXER_URL
    )


def create_wallet():
    """Generate a new Algorand wallet. Returns address and encrypted private key."""
    private_key, address = account.generate_account()
    encrypted_key = _get_cipher().encrypt(private_key.encode()).decode()
    passphrase = mnemonic.from_private_key(private_key)
    return {
        'address': address,
        'encrypted_private_key': encrypted_key,
        'mnemonic': passphrase,  # Only shown once to user
    }


def decrypt_private_key(encrypted_key):
    """Decrypt a stored private key."""
    return _get_cipher().decrypt(encrypted_key.encode()).decode()


def get_account_balance(address):
    """Get ALGO balance for an address."""
    try:
        client = get_algod_client()
        info = client.account_info(address)
        balance_microalgos = info.get('amount', 0)
        return Decimal(balance_microalgos) / Decimal(1_000_000)
    except Exception as e:
        return Decimal(0)


def create_asa(creator_private_key, asset_name, unit_name, total, decimals=6):
    """Create an Algorand Standard Asset (tokenized salary)."""
    try:
        client = get_algod_client()
        params = client.suggested_params()
        creator_address = account.address_from_private_key(creator_private_key)

        txn = transaction.AssetConfigTxn(
            sender=creator_address,
            sp=params,
            total=total,
            default_frozen=False,
            unit_name=unit_name,
            asset_name=asset_name,
            decimals=decimals,
            manager=creator_address,
            reserve=creator_address,
            freeze=creator_address,
            clawback=creator_address,
        )

        signed_txn = txn.sign(creator_private_key)
        tx_id = client.send_transaction(signed_txn)
        result = transaction.wait_for_confirmation(client, tx_id, 4)
        asset_id = result['asset-index']

        return {
            'asset_id': asset_id,
            'tx_id': tx_id,
            'asset_name': asset_name,
        }
    except Exception as e:
        return {'error': str(e)}


def send_payment(sender_private_key, receiver_address, amount_algo, note=''):
    """Send ALGO payment."""
    try:
        client = get_algod_client()
        params = client.suggested_params()
        sender_address = account.address_from_private_key(sender_private_key)

        amount_microalgos = int(Decimal(str(amount_algo)) * 1_000_000)

        txn = transaction.PaymentTxn(
            sender=sender_address,
            sp=params,
            receiver=receiver_address,
            amt=amount_microalgos,
            note=note.encode() if note else None,
        )

        signed_txn = txn.sign(sender_private_key)
        tx_id = client.send_transaction(signed_txn)
        transaction.wait_for_confirmation(client, tx_id, 4)

        return {'tx_id': tx_id, 'amount': str(amount_algo)}
    except Exception as e:
        return {'error': str(e)}


def get_transaction_history(address, limit=20):
    """Fetch recent transactions for an address."""
    try:
        indexer_client = get_indexer_client()
        response = indexer_client.search_transactions_by_address(
            address, limit=limit
        )
        return response.get('transactions', [])
    except Exception as e:
        return []
