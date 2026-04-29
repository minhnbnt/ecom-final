from django.contrib import admin
from .models import Shipment

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_id', 'status', 'tracking_number', 'created_at')
    list_filter = ('status',)
