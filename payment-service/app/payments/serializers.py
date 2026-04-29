from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('id', 'order_id', 'amount', 'method', 'status',
                  'transaction_id', 'created_at', 'updated_at')
        read_only_fields = ('id', 'status', 'transaction_id', 'created_at', 'updated_at')


class PaySerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    method = serializers.CharField(default='credit_card')
