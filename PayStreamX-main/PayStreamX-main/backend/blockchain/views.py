from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from .services import create_wallet, get_account_balance, get_transaction_history
from payroll.models import AuditLog


class CreateWalletView(APIView):
    """Generate a new Algorand wallet for the authenticated user."""

    def post(self, request):
        user = request.user
        if user.wallet_address:
            return Response({
                'address': user.wallet_address,
                'message': 'Wallet already exists'
            })

        wallet = create_wallet()
        user.wallet_address = wallet['address']
        user.encrypted_private_key = wallet['encrypted_private_key']
        user.save()

        AuditLog.objects.create(
            user=user,
            action='wallet_created',
            details={'address': wallet['address']}
        )

        return Response({
            'address': wallet['address'],
            'mnemonic': wallet['mnemonic'],
            'message': 'Save your mnemonic phrase securely. It will not be shown again.'
        }, status=status.HTTP_201_CREATED)


class WalletBalanceView(APIView):
    """Get wallet balance for the authenticated user."""

    def get(self, request):
        user = request.user
        if not user.wallet_address:
            return Response({'error': 'No wallet found'}, status=400)

        balance = get_account_balance(user.wallet_address)
        return Response({
            'address': user.wallet_address,
            'balance_algo': str(balance),
        })


class TransactionHistoryView(APIView):
    """Get blockchain transaction history for the user's wallet."""

    def get(self, request):
        user = request.user
        if not user.wallet_address:
            return Response({'error': 'No wallet found'}, status=400)

        transactions = get_transaction_history(user.wallet_address)
        return Response({'transactions': transactions})
