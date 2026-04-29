import logging
import uuid

import requests
from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment
from .serializers import PaymentSerializer, PaySerializer

logger = logging.getLogger(__name__)


class PayView(APIView):
    """POST /api/payment/pay/ — Initiate payment for an order.

    Simulates payment processing:
    1. Create payment record (pending)
    2. Simulate processing (always succeeds for demo)
    3. Update order status via order-service
    4. Create shipment via shipping-service
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = PaySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order_id']

        # Check if payment already exists
        existing = Payment.objects.filter(order_id=order_id).first()
        if existing and existing.status == Payment.Status.SUCCESS:
            return Response(
                PaymentSerializer(existing).data,
                status=status.HTTP_200_OK,
            )

        # Create or update payment
        payment, _ = Payment.objects.update_or_create(
            order_id=order_id,
            defaults={
                'amount': serializer.validated_data['amount'],
                'method': serializer.validated_data.get('method', 'credit_card'),
                'status': Payment.Status.PENDING,
            },
        )

        # Simulate payment processing (always success for demo)
        payment.status = Payment.Status.SUCCESS
        payment.transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        payment.save()

        token = request.META.get('HTTP_AUTHORIZATION', '')

        # Notify shipping-service to create shipment
        try:
            requests.post(
                f"{settings.SHIPPING_SERVICE_URL}/api/shipping/create/",
                json={
                    'order_id': order_id,
                    'address': 'Default shipping address',
                },
                headers={'Authorization': token},
                timeout=5,
            )
        except Exception as e:
            logger.warning(f"Shipping creation failed: {e}")

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class PaymentStatusView(APIView):
    """GET /api/payment/status/?order_id=<id> — Check payment status."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        order_id = request.query_params.get('order_id')
        if not order_id:
            return Response(
                {'error': 'order_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment = Payment.objects.get(order_id=order_id)
            return Response(PaymentSerializer(payment).data)
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
