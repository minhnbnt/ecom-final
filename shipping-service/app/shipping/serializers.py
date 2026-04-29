from rest_framework import serializers
from .models import Shipment


class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = ('id', 'order_id', 'address', 'status', 'tracking_number',
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'tracking_number', 'created_at', 'updated_at')


class CreateShipmentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    address = serializers.CharField()
