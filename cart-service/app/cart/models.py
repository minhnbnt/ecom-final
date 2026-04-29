from django.db import models


class Cart(models.Model):
    """Shopping cart for a user (identified by user_id from user-service)."""

    user_id = models.PositiveBigIntegerField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'

    def __str__(self):
        return f"Cart(user={self.user_id})"


class CartItem(models.Model):
    """Item in a cart — references product_id from product-service."""

    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product_id = models.PositiveBigIntegerField()
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cart_items'
        unique_together = ('cart', 'product_id')

    def __str__(self):
        return f"CartItem(product={self.product_id}, qty={self.quantity})"
