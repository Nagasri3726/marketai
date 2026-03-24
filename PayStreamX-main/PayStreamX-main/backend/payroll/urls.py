from django.urls import path
from . import views

urlpatterns = [
    # Streams
    path('streams/', views.StreamListCreateView.as_view(), name='stream-list-create'),
    path('streams/<int:pk>/', views.StreamDetailView.as_view(), name='stream-detail'),
    path('streams/<int:pk>/activate/', views.StreamActivateView.as_view(), name='stream-activate'),
    path('streams/<int:pk>/cancel/', views.StreamCancelView.as_view(), name='stream-cancel'),
    path('streams/<int:pk>/withdraw/', views.WithdrawView.as_view(), name='stream-withdraw'),
    path('milestones/<int:pk>/approve/', views.MilestoneApproveView.as_view(), name='milestone-approve'),
    # Payments & Audit
    path('payments/', views.PaymentHistoryView.as_view(), name='payment-history'),
    path('audit-logs/', views.AuditLogView.as_view(), name='audit-logs'),
    path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    # Salary Wallet
    path('wallet/', views.SalaryWalletView.as_view(), name='salary-wallet'),
    # Auto-Split
    path('splits/', views.AutoSplitRuleListCreateView.as_view(), name='split-list-create'),
    path('splits/<int:pk>/', views.AutoSplitRuleDetailView.as_view(), name='split-detail'),
    # Micro-Investment
    path('investments/', views.MicroInvestmentListCreateView.as_view(), name='investment-list-create'),
    # Credit
    path('credit/', views.CreditLineView.as_view(), name='credit-line'),
    # Financial Goals
    path('goals/', views.FinancialGoalListCreateView.as_view(), name='goal-list-create'),
    path('goals/<int:pk>/', views.FinancialGoalDetailView.as_view(), name='goal-detail'),
    path('goals/<int:pk>/fund/', views.FinancialGoalFundView.as_view(), name='goal-fund'),
]
