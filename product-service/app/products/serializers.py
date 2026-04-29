from rest_framework import serializers
from .models import Category, Product, Book, Electronics, Fashion


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'product_count')


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ('author', 'publisher', 'isbn', 'pages')


class ElectronicsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Electronics
        fields = ('brand', 'warranty_months', 'specifications')


class FashionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fashion
        fields = ('size', 'color', 'material')


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    book = BookSerializer(read_only=True)
    electronics = ElectronicsSerializer(read_only=True)
    fashion = FashionSerializer(read_only=True)

    class Meta:
        model = Product
        fields = ('id', 'name', 'description', 'price', 'stock', 'image_url',
                  'category', 'category_name', 'is_active', 'created_at',
                  'updated_at', 'book', 'electronics', 'fashion')


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating products."""

    class Meta:
        model = Product
        fields = ('id', 'name', 'description', 'price', 'stock', 'image_url',
                  'category', 'is_active')
