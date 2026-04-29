from django.urls import path
from .views import PayView, PaymentStatusView

urlpatterns = [
    path('pay/', PayView.as_view(), name='payment-pay'),
    path('status/', PaymentStatusView.as_view(), name='payment-status'),
]
