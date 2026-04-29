from django.contrib import admin
from .models import Category, Product, Book, Electronics, Fashion


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')


class BookInline(admin.StackedInline):
    model = Book
    extra = 0


class ElectronicsInline(admin.StackedInline):
    model = Electronics
    extra = 0


class FashionInline(admin.StackedInline):
    model = Fashion
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name',)
    inlines = [BookInline, ElectronicsInline, FashionInline]
