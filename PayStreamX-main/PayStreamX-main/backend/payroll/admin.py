from django.contrib import admin
from .models import (
    PayrollStream, Milestone, Payment, AuditLog,
    SalaryWallet, AutoSplitRule, MicroInvestment, CreditLine, FinancialGoal
)


@admin.register(PayrollStream)
class PayrollStreamAdmin(admin.ModelAdmin):
    list_display = ('title', 'employer', 'employee', 'total_amount', 'status', 'payment_type')
    list_filter = ('status', 'payment_type')


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ('title', 'stream', 'amount', 'status')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('amount', 'payment_type', 'sender', 'recipient', 'created_at')
    list_filter = ('payment_type',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'created_at')
    list_filter = ('action',)


@admin.register(SalaryWallet)
class SalaryWalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'available_balance', 'locked_balance', 'invested_balance')


@admin.register(AutoSplitRule)
class AutoSplitRuleAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'category', 'percentage', 'is_active')


@admin.register(MicroInvestment)
class MicroInvestmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'amount', 'current_value', 'roi_percentage', 'status')


@admin.register(CreditLine)
class CreditLineAdmin(admin.ModelAdmin):
    list_display = ('user', 'credit_limit', 'borrowed_amount', 'repaid_amount', 'status')


@admin.register(FinancialGoal)
class FinancialGoalAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'target_amount', 'current_amount', 'is_completed')
