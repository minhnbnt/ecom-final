from django.db import models


class Order(models.Model):
    """Order model — references user_id from user-service."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        PAID = 'paid', 'Paid'
        SHIPPING = 'shipping', 'Shipping'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'

    user_id = models.PositiveBigIntegerField()
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    shipping_address = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"Order#{self.id}(user={self.user_id}, status={self.status})"


class OrderItem(models.Model):
    """Order item — references product_id from product-service."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product_id = models.PositiveBigIntegerField()
    product_name = models.CharField(max_length=255, default='')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = 'order_items'

    def __str__(self):
        return f"OrderItem(product={self.product_id}, qty={self.quantity})"

    @property
    def subtotal(self):
        return self.unit_price * self.quantity
