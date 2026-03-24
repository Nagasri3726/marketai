from rest_framework import serializers
from .models import (
    PayrollStream, Milestone, Payment, AuditLog,
    SalaryWallet, AutoSplitRule, MicroInvestment, CreditLine, FinancialGoal
)
from accounts.serializers import UserSerializer


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = '__all__'
        read_only_fields = ('stream', 'completed_at', 'tx_hash', 'created_at')


class PayrollStreamSerializer(serializers.ModelSerializer):
    employer_detail = UserSerializer(source='employer', read_only=True)
    employee_detail = UserSerializer(source='employee', read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)
    accrued_amount = serializers.SerializerMethodField()

    class Meta:
        model = PayrollStream
        fields = '__all__'
        read_only_fields = ('employer', 'withdrawn_amount', 'rate_per_second',
                            'app_id', 'token_asset_id', 'created_at', 'updated_at')

    def get_accrued_amount(self, obj):
        if obj.status != 'active' or not obj.start_time:
            return str(obj.withdrawn_amount)
        from django.utils import timezone
        now = timezone.now()
        elapsed = (now - obj.start_time).total_seconds()
        accrued = float(obj.rate_per_second) * elapsed
        total = float(obj.total_amount)
        return str(min(accrued, total))


class CreateStreamSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, required=False)

    class Meta:
        model = PayrollStream
        fields = ('employee', 'title', 'total_amount', 'payment_type',
                  'start_time', 'end_time', 'milestones')

    def validate(self, attrs):
        if attrs.get('payment_type') == 'streaming':
            if not attrs.get('start_time') or not attrs.get('end_time'):
                raise serializers.ValidationError(
                    'Streaming payments require start_time and end_time.'
                )
            duration = (attrs['end_time'] - attrs['start_time']).total_seconds()
            if duration <= 0:
                raise serializers.ValidationError('end_time must be after start_time.')
            attrs['rate_per_second'] = float(attrs['total_amount']) / duration
        return attrs

    def create(self, validated_data):
        milestones_data = validated_data.pop('milestones', [])
        stream = PayrollStream.objects.create(**validated_data)
        for m_data in milestones_data:
            Milestone.objects.create(stream=stream, **m_data)
        return stream


class PaymentSerializer(serializers.ModelSerializer):
    sender_detail = UserSerializer(source='sender', read_only=True)
    recipient_detail = UserSerializer(source='recipient', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('stream', 'sender', 'recipient', 'tx_hash', 'created_at')


class AuditLogSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'


# ======================== NEW SERIALIZERS ========================


class SalaryWalletSerializer(serializers.ModelSerializer):
    total_balance = serializers.ReadOnlyField()

    class Meta:
        model = SalaryWallet
        fields = '__all__'
        read_only_fields = ('user', 'total_earned', 'total_withdrawn', 'updated_at')


class AutoSplitRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutoSplitRule
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class MicroInvestmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MicroInvestment
        fields = '__all__'
        read_only_fields = ('user', 'current_value', 'roi_percentage', 'tx_hash',
                            'created_at', 'updated_at')


class CreditLineSerializer(serializers.ModelSerializer):
    outstanding = serializers.ReadOnlyField()
    available_credit = serializers.ReadOnlyField()

    class Meta:
        model = CreditLine
        fields = '__all__'
        read_only_fields = ('user', 'borrowed_amount', 'repaid_amount', 'tx_hash',
                            'created_at', 'updated_at')


class FinancialGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = FinancialGoal
        fields = '__all__'
        read_only_fields = ('user', 'current_amount', 'is_completed',
                            'created_at', 'updated_at')
