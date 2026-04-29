from django.db import models


class Category(models.Model):
    """Product category — 10 nhóm loại sản phẩm theo yêu cầu đề."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    """Base product model."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    image_url = models.URLField(blank=True, default='')
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='products',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class Book(models.Model):
    """Domain-specific product: Book (OneToOne with Product).

    Categories: Giáo trình, Tiểu thuyết, etc.
    """

    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='book',
    )
    author = models.CharField(max_length=255)
    publisher = models.CharField(max_length=255, blank=True, default='')
    isbn = models.CharField(max_length=20, blank=True, default='')
    pages = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = 'books'

    def __str__(self):
        return f"Book: {self.product.name} by {self.author}"


class Electronics(models.Model):
    """Domain-specific product: Electronics (OneToOne with Product).

    Categories: Mobile, Laptop, Tủ lạnh, Điều hòa, etc.
    """

    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='electronics',
    )
    brand = models.CharField(max_length=100)
    warranty_months = models.PositiveIntegerField(default=12)
    specifications = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'electronics'
        verbose_name_plural = 'Electronics'

    def __str__(self):
        return f"Electronics: {self.product.name} ({self.brand})"


class Fashion(models.Model):
    """Domain-specific product: Fashion (OneToOne with Product).

    Categories: Áo, Quần, Giày, etc.
    """

    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='fashion',
    )
    size = models.CharField(max_length=10)
    color = models.CharField(max_length=50)
    material = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        db_table = 'fashion'

    def __str__(self):
        return f"Fashion: {self.product.name} ({self.size}/{self.color})"
