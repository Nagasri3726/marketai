from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Sum
from decimal import Decimal

from .models import (
    PayrollStream, Milestone, Payment, AuditLog,
    SalaryWallet, AutoSplitRule, MicroInvestment, CreditLine, FinancialGoal
)
from .serializers import (
    PayrollStreamSerializer, CreateStreamSerializer,
    PaymentSerializer, AuditLogSerializer, MilestoneSerializer,
    SalaryWalletSerializer, AutoSplitRuleSerializer,
    MicroInvestmentSerializer, CreditLineSerializer, FinancialGoalSerializer
)


class IsEmployer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'employer'


class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'employee'


# ======================== STREAM VIEWS ========================


class StreamListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateStreamSerializer
        return PayrollStreamSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'employer':
            return PayrollStream.objects.filter(employer=user)
        return PayrollStream.objects.filter(employee=user)

    def perform_create(self, serializer):
        stream = serializer.save(employer=self.request.user)
        AuditLog.objects.create(
            user=self.request.user, action='stream_created',
            details={'stream_id': stream.id, 'employee': stream.employee.username,
                     'amount': str(stream.total_amount), 'type': stream.payment_type}
        )


class StreamDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PayrollStreamSerializer

    def get_queryset(self):
        user = self.request.user
        return PayrollStream.objects.filter(Q(employer=user) | Q(employee=user))


class StreamActivateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmployer]

    def post(self, request, pk):
        try:
            stream = PayrollStream.objects.get(pk=pk, employer=request.user)
        except PayrollStream.DoesNotExist:
            return Response({'error': 'Stream not found'}, status=404)
        if stream.status != 'pending':
            return Response({'error': 'Can only activate pending streams'}, status=400)
        stream.status = 'active'
        if not stream.start_time:
            stream.start_time = timezone.now()
        stream.save()
        AuditLog.objects.create(user=request.user, action='stream_started',
                                details={'stream_id': stream.id})
        return Response(PayrollStreamSerializer(stream).data)


class StreamCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmployer]

    def post(self, request, pk):
        try:
            stream = PayrollStream.objects.get(pk=pk, employer=request.user)
        except PayrollStream.DoesNotExist:
            return Response({'error': 'Stream not found'}, status=404)
        stream.status = 'cancelled'
        stream.save()
        AuditLog.objects.create(user=request.user, action='stream_cancelled',
                                details={'stream_id': stream.id})
        return Response(PayrollStreamSerializer(stream).data)


class WithdrawView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmployee]

    def post(self, request, pk):
        try:
            stream = PayrollStream.objects.get(pk=pk, employee=request.user, status='active')
        except PayrollStream.DoesNotExist:
            return Response({'error': 'Active stream not found'}, status=404)

        now = timezone.now()
        elapsed = (now - stream.start_time).total_seconds()
        accrued = Decimal(str(float(stream.rate_per_second) * elapsed))
        available = min(accrued, stream.total_amount) - stream.withdrawn_amount

        if available <= 0:
            return Response({'error': 'No funds available to withdraw'}, status=400)

        withdraw_amount = Decimal(request.data.get('amount', str(available)))
        if withdraw_amount > available:
            withdraw_amount = available

        payment = Payment.objects.create(
            stream=stream, amount=withdraw_amount, payment_type='withdrawal',
            sender=stream.employer, recipient=stream.employee,
            tx_hash=f"tx_{timezone.now().timestamp()}"
        )

        stream.withdrawn_amount += withdraw_amount
        if stream.withdrawn_amount >= stream.total_amount:
            stream.status = 'completed'
        stream.save()

        # Update salary wallet
        wallet, _ = SalaryWallet.objects.get_or_create(user=request.user)
        wallet.available_balance += withdraw_amount
        wallet.total_earned += withdraw_amount
        wallet.save()

        AuditLog.objects.create(
            user=request.user, action='withdrawal',
            details={'stream_id': stream.id, 'amount': str(withdraw_amount),
                     'tx_hash': payment.tx_hash}
        )

        # WebSocket notification
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'user_{stream.employer.id}',
                {'type': 'payment_notification', 'message': {
                    'event': 'withdrawal', 'stream_id': stream.id,
                    'amount': str(withdraw_amount), 'employee': stream.employee.username}}
            )
        except Exception:
            pass

        return Response({
            'payment': PaymentSerializer(payment).data,
            'stream': PayrollStreamSerializer(stream).data,
        })


class MilestoneApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEmployer]

    def post(self, request, pk):
        try:
            milestone = Milestone.objects.get(pk=pk, stream__employer=request.user)
        except Milestone.DoesNotExist:
            return Response({'error': 'Milestone not found'}, status=404)
        if milestone.status != 'pending':
            return Response({'error': 'Milestone already processed'}, status=400)

        milestone.status = 'paid'
        milestone.completed_at = timezone.now()
        milestone.tx_hash = f"tx_ms_{timezone.now().timestamp()}"
        milestone.save()

        Payment.objects.create(
            stream=milestone.stream, amount=milestone.amount,
            payment_type='milestone', sender=milestone.stream.employer,
            recipient=milestone.stream.employee, tx_hash=milestone.tx_hash
        )
        milestone.stream.withdrawn_amount += milestone.amount
        milestone.stream.save()

        AuditLog.objects.create(
            user=request.user, action='milestone_paid',
            details={'milestone_id': milestone.id, 'amount': str(milestone.amount)}
        )
        return Response(MilestoneSerializer(milestone).data)


class PaymentHistoryView(generics.ListAPIView):
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        return Payment.objects.filter(Q(sender=user) | Q(recipient=user))


class AuditLogView(generics.ListAPIView):
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        return AuditLog.objects.filter(user=self.request.user)


# ======================== SALARY WALLET ========================


class SalaryWalletView(APIView):
    """Get or initialize salary wallet."""

    def get(self, request):
        wallet, _ = SalaryWallet.objects.get_or_create(user=request.user)
        return Response(SalaryWalletSerializer(wallet).data)

    def post(self, request):
        """Transfer between wallet segments."""
        wallet, _ = SalaryWallet.objects.get_or_create(user=request.user)
        action = request.data.get('action')  # 'lock', 'unlock', 'invest', 'withdraw'
        amount = Decimal(str(request.data.get('amount', 0)))

        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=400)

        if action == 'lock' and wallet.available_balance >= amount:
            wallet.available_balance -= amount
            wallet.locked_balance += amount
        elif action == 'unlock' and wallet.locked_balance >= amount:
            wallet.locked_balance -= amount
            wallet.available_balance += amount
        elif action == 'invest' and wallet.available_balance >= amount:
            wallet.available_balance -= amount
            wallet.invested_balance += amount
        elif action == 'withdraw' and wallet.available_balance >= amount:
            wallet.available_balance -= amount
            wallet.total_withdrawn += amount
        else:
            return Response({'error': 'Insufficient balance or invalid action'}, status=400)

        wallet.save()
        return Response(SalaryWalletSerializer(wallet).data)


# ======================== AUTO-SPLIT ========================


class AutoSplitRuleListCreateView(generics.ListCreateAPIView):
    serializer_class = AutoSplitRuleSerializer

    def get_queryset(self):
        return AutoSplitRule.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        AuditLog.objects.create(user=self.request.user, action='split_updated',
                                details={'rule': serializer.data.get('name', '')})


class AutoSplitRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AutoSplitRuleSerializer

    def get_queryset(self):
        return AutoSplitRule.objects.filter(user=self.request.user)


# ======================== MICRO-INVESTMENT ========================


class MicroInvestmentListCreateView(generics.ListCreateAPIView):
    serializer_class = MicroInvestmentSerializer

    def get_queryset(self):
        return MicroInvestment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        investment = serializer.save(
            user=self.request.user,
            current_value=serializer.validated_data['amount'],
            roi_percentage=Decimal('0')
        )
        # Deduct from wallet
        wallet, _ = SalaryWallet.objects.get_or_create(user=self.request.user)
        if wallet.available_balance >= investment.amount:
            wallet.available_balance -= investment.amount
            wallet.invested_balance += investment.amount
            wallet.save()

        AuditLog.objects.create(user=self.request.user, action='investment_created',
                                details={'name': investment.name, 'amount': str(investment.amount)})


# ======================== CREDIT LINE ========================


class CreditLineView(APIView):
    def get(self, request):
        credit, _ = CreditLine.objects.get_or_create(
            user=request.user,
            defaults={'credit_limit': Decimal('1000')}
        )
        return Response(CreditLineSerializer(credit).data)

    def post(self, request):
        """Borrow or repay."""
        credit, _ = CreditLine.objects.get_or_create(
            user=request.user,
            defaults={'credit_limit': Decimal('1000')}
        )
        action = request.data.get('action')  # 'borrow' or 'repay'
        amount = Decimal(str(request.data.get('amount', 0)))

        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=400)

        wallet, _ = SalaryWallet.objects.get_or_create(user=request.user)

        if action == 'borrow':
            if amount > credit.available_credit:
                return Response({'error': 'Exceeds credit limit'}, status=400)
            credit.borrowed_amount += amount
            wallet.available_balance += amount
            AuditLog.objects.create(user=request.user, action='credit_borrowed',
                                    details={'amount': str(amount)})
        elif action == 'repay':
            if amount > credit.outstanding:
                amount = credit.outstanding
            if wallet.available_balance < amount:
                return Response({'error': 'Insufficient wallet balance'}, status=400)
            credit.repaid_amount += amount
            wallet.available_balance -= amount
            if credit.outstanding <= 0:
                credit.status = 'repaid'
            AuditLog.objects.create(user=request.user, action='credit_repaid',
                                    details={'amount': str(amount)})
        else:
            return Response({'error': 'Invalid action'}, status=400)

        credit.save()
        wallet.save()
        return Response(CreditLineSerializer(credit).data)


# ======================== FINANCIAL GOALS ========================


class FinancialGoalListCreateView(generics.ListCreateAPIView):
    serializer_class = FinancialGoalSerializer

    def get_queryset(self):
        return FinancialGoal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        AuditLog.objects.create(user=self.request.user, action='goal_created',
                                details={'name': serializer.validated_data['name']})


class FinancialGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FinancialGoalSerializer

    def get_queryset(self):
        return FinancialGoal.objects.filter(user=self.request.user)


class FinancialGoalFundView(APIView):
    """Allocate funds to a financial goal."""

    def post(self, request, pk):
        try:
            goal = FinancialGoal.objects.get(pk=pk, user=request.user)
        except FinancialGoal.DoesNotExist:
            return Response({'error': 'Goal not found'}, status=404)

        amount = Decimal(str(request.data.get('amount', 0)))
        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=400)

        wallet, _ = SalaryWallet.objects.get_or_create(user=request.user)
        if wallet.available_balance < amount:
            return Response({'error': 'Insufficient wallet balance'}, status=400)

        wallet.available_balance -= amount
        wallet.locked_balance += amount
        wallet.save()

        goal.current_amount += amount
        if goal.current_amount >= goal.target_amount:
            goal.is_completed = True
        goal.save()

        AuditLog.objects.create(user=request.user, action='goal_funded',
                                details={'goal': goal.name, 'amount': str(amount)})

        return Response(FinancialGoalSerializer(goal).data)


# ======================== DASHBOARD ========================


class DashboardStatsView(APIView):
    def get(self, request):
        user = request.user
        wallet, _ = SalaryWallet.objects.get_or_create(user=user)

        if user.role == 'employer':
            streams = PayrollStream.objects.filter(employer=user)
            total_paid = Payment.objects.filter(sender=user).aggregate(
                total=Sum('amount'))['total'] or 0
            return Response({
                'total_streams': streams.count(),
                'active_streams': streams.filter(status='active').count(),
                'total_employees': streams.values('employee').distinct().count(),
                'total_paid': str(total_paid),
            })
        else:
            streams = PayrollStream.objects.filter(employee=user)
            total_earned = Payment.objects.filter(recipient=user).aggregate(
                total=Sum('amount'))['total'] or 0

            # Investment stats
            investments = MicroInvestment.objects.filter(user=user, status='active')
            total_invested = investments.aggregate(total=Sum('amount'))['total'] or 0
            total_inv_value = investments.aggregate(total=Sum('current_value'))['total'] or 0

            # Credit stats
            try:
                credit = CreditLine.objects.get(user=user)
                credit_data = {
                    'credit_limit': str(credit.credit_limit),
                    'outstanding': str(credit.outstanding),
                    'available_credit': str(credit.available_credit),
                }
            except CreditLine.DoesNotExist:
                credit_data = {'credit_limit': '1000', 'outstanding': '0', 'available_credit': '1000'}

            # Goals stats
            goals = FinancialGoal.objects.filter(user=user)
            active_goals = goals.filter(is_completed=False).count()

            return Response({
                'total_streams': streams.count(),
                'active_streams': streams.filter(status='active').count(),
                'total_earned': str(total_earned),
                'wallet': SalaryWalletSerializer(wallet).data,
                'total_invested': str(total_invested),
                'investment_value': str(total_inv_value),
                'credit': credit_data,
                'active_goals': active_goals,
                'total_goals': goals.count(),
            })
