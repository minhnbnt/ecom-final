import logging

import requests
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order, OrderItem
from .serializers import OrderSerializer, CreateOrderSerializer

logger = logging.getLogger(__name__)


class OrderListView(generics.ListAPIView):
    """GET /api/orders/ — List orders for current user."""
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user_id=self.request.user.id)


class OrderDetailView(generics.RetrieveAPIView):
    """GET /api/orders/<id>/ — Order detail."""
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user_id=self.request.user.id)


class CreateOrderView(APIView):
    """POST /api/orders/create/ — Create order from cart.

    Workflow:
    1. Fetch cart items from cart-service
    2. Fetch product details from product-service
    3. Create order + order items
    4. Call payment-service to initiate payment
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = request.user.id
        token = request.META.get('HTTP_AUTHORIZATION', '')

        # 1. Fetch cart from cart-service
        try:
            cart_resp = requests.get(
                f"{settings.CART_SERVICE_URL}/api/cart/",
                headers={'Authorization': token},
                timeout=5,
            )
            cart_data = cart_resp.json()
            cart_items = cart_data.get('items', [])
        except Exception as e:
            logger.error(f"Failed to fetch cart: {e}")
            return Response(
                {'error': 'Failed to fetch cart'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not cart_items:
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Create order
        order = Order.objects.create(
            user_id=user_id,
            shipping_address=serializer.validated_data['shipping_address'],
            status=Order.Status.PENDING,
        )

        total = 0
        for item in cart_items:
            # Fetch product price from product-service
            try:
                prod_resp = requests.get(
                    f"http://product-service:8000/api/products/{item['product_id']}/",
                    timeout=5,
                )
                prod_data = prod_resp.json()
                unit_price = float(prod_data.get('price', 0))
                product_name = prod_data.get('name', '')
            except Exception:
                unit_price = 0
                product_name = f"Product #{item['product_id']}"

            OrderItem.objects.create(
                order=order,
                product_id=item['product_id'],
                product_name=product_name,
                quantity=item['quantity'],
                unit_price=unit_price,
            )
            total += unit_price * item['quantity']

        order.total_price = total
        order.save()

        # 3. Initiate payment
        try:
            requests.post(
                f"{settings.PAYMENT_SERVICE_URL}/api/payment/pay/",
                json={
                    'order_id': order.id,
                    'amount': float(order.total_price),
                },
                headers={'Authorization': token},
                timeout=5,
            )
        except Exception as e:
            logger.warning(f"Payment initiation failed: {e}")

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )
