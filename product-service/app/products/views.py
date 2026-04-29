from rest_framework import generics, permissions, filters
from .models import Category, Product
from .serializers import (
    CategorySerializer, ProductSerializer, ProductCreateSerializer
)


class CategoryListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/products/categories/"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class ProductListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/products/"""
    queryset = Product.objects.select_related(
        'category', 'book', 'electronics', 'fashion'
    ).filter(is_active=True)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'name']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE /api/products/<id>/"""
    queryset = Product.objects.select_related(
        'category', 'book', 'electronics', 'fashion'
    )
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
