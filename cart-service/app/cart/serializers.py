import os
import requests
from rest_framework import serializers
from .models import Cart, CartItem

PRODUCT_SERVICE_URL = os.getenv('PRODUCT_SERVICE_URL', 'http://product-service:8000')

_product_cache = {}


def _fetch_product(product_id):
    if product_id not in _product_cache:
        try:
            r = requests.get(f'{PRODUCT_SERVICE_URL}/api/products/{product_id}/', timeout=5)
            _product_cache[product_id] = r.json() if r.status_code == 200 else None
        except Exception:
            _product_cache[product_id] = None
    return _product_cache[product_id]


class CartItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'product_name', 'product_price',
                  'product_image', 'quantity', 'subtotal', 'added_at')
        read_only_fields = ('id', 'product', 'product_id', 'product_name',
                            'product_price', 'product_image', 'quantity',
                            'subtotal', 'added_at')

    def get_product(self, obj):
        return _fetch_product(obj.product_id)

    def get_product_name(self, obj):
        p = _fetch_product(obj.product_id)
        return p['name'] if p else ''

    def get_product_price(self, obj):
        p = _fetch_product(obj.product_id)
        return p['price'] if p else '0'

    def get_product_image(self, obj):
        p = _fetch_product(obj.product_id)
        return p.get('image_url', '') if p else ''

    def get_subtotal(self, obj):
        p = _fetch_product(obj.product_id)
        if p:
            return str(float(p['price']) * obj.quantity)
        return '0'


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'user_id', 'items', 'total_price', 'total_items',
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'user_id', 'created_at', 'updated_at')

    def get_total_price(self, obj):
        total = 0
        for item in obj.items.all():
            p = _fetch_product(item.product_id)
            if p:
                total += float(p['price']) * item.quantity
        return str(total)

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
