from django.db import models
from django.conf import settings


class PayrollStream(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    PAYMENT_TYPE_CHOICES = (
        ('streaming', 'Continuous Streaming'),
        ('milestone', 'Milestone-Based'),
    )

    employer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='created_streams'
    )
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='received_streams'
    )
    title = models.CharField(max_length=200)
    token_asset_id = models.BigIntegerField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=20, decimal_places=6)
    rate_per_second = models.DecimalField(max_digits=20, decimal_places=10, default=0)
    withdrawn_amount = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPE_CHOICES, default='streaming')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    app_id = models.BigIntegerField(null=True, blank=True, help_text='Algorand smart contract app ID')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payroll_streams'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — {self.employer.username} → {self.employee.username}"


class Milestone(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
    )
    stream = models.ForeignKey(PayrollStream, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=20, decimal_places=6)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    tx_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'milestones'
        ordering = ['due_date']

    def __str__(self):
        return f"{self.title} — {self.amount} ALGO"


class Payment(models.Model):
    PAYMENT_TYPE_CHOICES = (
        ('withdrawal', 'Withdrawal'),
        ('milestone', 'Milestone Payment'),
        ('deposit', 'Deposit'),
        ('investment', 'Investment'),
        ('credit_borrow', 'Credit Borrow'),
        ('credit_repay', 'Credit Repay'),
        ('goal_allocation', 'Goal Allocation'),
    )
    stream = models.ForeignKey(PayrollStream, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    amount = models.DecimalField(max_digits=20, decimal_places=6)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    tx_hash = models.CharField(max_length=64, blank=True)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='sent_payments'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='received_payments'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.amount} — {self.payment_type}"


class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('stream_created', 'Stream Created'),
        ('stream_started', 'Stream Started'),
        ('stream_paused', 'Stream Paused'),
        ('stream_cancelled', 'Stream Cancelled'),
        ('withdrawal', 'Withdrawal'),
        ('milestone_approved', 'Milestone Approved'),
        ('milestone_paid', 'Milestone Paid'),
        ('wallet_created', 'Wallet Created'),
        ('asset_created', 'Asset Created'),
        ('investment_created', 'Investment Created'),
        ('credit_borrowed', 'Credit Borrowed'),
        ('credit_repaid', 'Credit Repaid'),
        ('goal_created', 'Goal Created'),
        ('goal_funded', 'Goal Funded'),
        ('split_updated', 'Split Updated'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=25, choices=ACTION_CHOICES)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    tx_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} by {self.user} at {self.created_at}"


# ======================== NEW MODELS ========================


class SalaryWallet(models.Model):
    """Wallet with segmented balance: available, locked, invested."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='salary_wallet'
    )
    available_balance = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    locked_balance = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    invested_balance = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    total_earned = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    total_withdrawn = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'salary_wallets'

    def __str__(self):
        return f"Wallet: {self.user.username} — {self.available_balance} available"

    @property
    def total_balance(self):
        return self.available_balance + self.locked_balance + self.invested_balance


class AutoSplitRule(models.Model):
    """Programmable salary distribution rules."""
    CATEGORY_CHOICES = (
        ('savings', 'Savings'),
        ('rent', 'Rent / Housing'),
        ('investment', 'Investment'),
        ('emergency', 'Emergency Fund'),
        ('spending', 'Spending'),
        ('custom', 'Custom'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='split_rules'
    )
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=15, choices=CATEGORY_CHOICES, default='custom')
    percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text='Percentage of salary')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'auto_split_rules'
        ordering = ['-percentage']

    def __str__(self):
        return f"{self.name} — {self.percentage}%"


class MicroInvestment(models.Model):
    """Small automated investments from salary."""
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('matured', 'Matured'),
        ('withdrawn', 'Withdrawn'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='investments'
    )
    name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=20, decimal_places=6)
    current_value = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    roi_percentage = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    auto_invest_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text='% of salary to auto-invest'
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    tx_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'micro_investments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} — {self.amount} ALGO ({self.roi_percentage}% ROI)"


class CreditLine(models.Model):
    """Salary-backed credit / borrowing."""
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('repaid', 'Fully Repaid'),
        ('defaulted', 'Defaulted'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='credit_lines'
    )
    credit_limit = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    borrowed_amount = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    repaid_amount = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.0, help_text='Annual %')
    auto_repay_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=10,
        help_text='% of salary for auto-repayment'
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    tx_hash = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'credit_lines'
        ordering = ['-created_at']

    def __str__(self):
        return f"Credit: {self.user.username} — {self.borrowed_amount}/{self.credit_limit}"

    @property
    def outstanding(self):
        return self.borrowed_amount - self.repaid_amount

    @property
    def available_credit(self):
        return self.credit_limit - self.outstanding


class FinancialGoal(models.Model):
    """Named savings goals with target amounts."""
    CATEGORY_CHOICES = (
        ('rent', 'Rent'),
        ('travel', 'Travel'),
        ('emergency', 'Emergency'),
        ('education', 'Education'),
        ('gadget', 'Gadget'),
        ('custom', 'Custom'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='financial_goals'
    )
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=15, choices=CATEGORY_CHOICES, default='custom')
    target_amount = models.DecimalField(max_digits=20, decimal_places=6)
    current_amount = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    auto_allocate_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text='% of salary to auto-allocate'
    )
    deadline = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'financial_goals'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} — {self.current_amount}/{self.target_amount}"

    @property
    def progress_percentage(self):
        if self.target_amount <= 0:
            return 0
        return min(float(self.current_amount / self.target_amount * 100), 100)
