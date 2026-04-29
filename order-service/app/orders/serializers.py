from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product_id', 'product_name', 'quantity', 'unit_price', 'subtotal')
        read_only_fields = ('id',)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'user_id', 'total_price', 'status', 'shipping_address',
                  'items', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user_id', 'total_price', 'created_at', 'updated_at')


class CreateOrderSerializer(serializers.Serializer):
    """Create order from cart — fetches cart items from cart-service."""
    shipping_address = serializers.CharField()
