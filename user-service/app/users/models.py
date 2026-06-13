from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model with role-based access control (RBAC).

    Roles:
        - admin: Full system access
        - staff: Process orders, manage shipping
        - customer: Browse products, place orders
    """

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        STAFF = 'staff', 'Staff'
        CUSTOMER = 'customer', 'Customer'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN


class WishlistItem(models.Model):
    """Saved product for a user (wishlist/favorites)."""

    user_id = models.PositiveBigIntegerField()
    product_id = models.PositiveBigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wishlist_items'
        unique_together = [['user_id', 'product_id']]
        ordering = ['-created_at']

    def __str__(self):
        return f"WishlistItem(user={self.user_id}, product={self.product_id})"

    @property
    def is_staff_role(self):
        return self.role == self.Role.STAFF

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER
