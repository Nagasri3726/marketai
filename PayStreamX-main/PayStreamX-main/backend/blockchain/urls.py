from django.urls import path
from . import views

urlpatterns = [
    path('create-wallet/', views.CreateWalletView.as_view(), name='create-wallet'),
    path('balance/', views.WalletBalanceView.as_view(), name='wallet-balance'),
    path('transactions/', views.TransactionHistoryView.as_view(), name='tx-history'),
]
