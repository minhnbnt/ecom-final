from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import CartSerializer, AddToCartSerializer


class CartView(APIView):
    """GET /api/cart/ — Get current user's cart."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user_id = request.user.id
        cart, _ = Cart.objects.get_or_create(user_id=user_id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class AddToCartView(APIView):
    """POST /api/cart/add/ — Add item to cart."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = request.user.id
        cart, _ = Cart.objects.get_or_create(user_id=user_id)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=serializer.validated_data['product_id'],
            defaults={'quantity': serializer.validated_data['quantity']},
        )

        if not created:
            item.quantity += serializer.validated_data['quantity']
            item.save()

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class RemoveFromCartView(APIView):
    """DELETE /api/cart/remove/ — Remove item from cart."""
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = request.user.id
        try:
            cart = Cart.objects.get(user_id=user_id)
            CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        except Cart.DoesNotExist:
            pass

        cart, _ = Cart.objects.get_or_create(user_id=user_id)
        return Response(CartSerializer(cart).data)
