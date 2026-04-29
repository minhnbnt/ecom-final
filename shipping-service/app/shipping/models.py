from django.db import models


class Shipment(models.Model):
    """Shipment record — references order_id from order-service.

    Status flow: processing → shipping → delivered
    """

    class Status(models.TextChoices):
        PROCESSING = 'processing', 'Processing'
        SHIPPING = 'shipping', 'Shipping'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'

    order_id = models.PositiveBigIntegerField(unique=True)
    address = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PROCESSING,
    )
    tracking_number = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'

    def __str__(self):
        return f"Shipment(order={self.order_id}, {self.status})"
