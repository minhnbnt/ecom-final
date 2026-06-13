from django.contrib.auth import authenticate, get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import WishlistItem
from .serializers import RegisterSerializer, UserSerializer, LoginSerializer, WishlistItemSerializer

User = get_user_model()


class WishlistListView(APIView):
    """GET /api/wishlist/ — List current user's wishlist items."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        items = WishlistItem.objects.filter(user_id=request.user.id)
        return Response(WishlistItemSerializer(items, many=True).data)


class WishlistAddView(APIView):
    """POST /api/wishlist/add/ — Add a product to wishlist."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        item, created = WishlistItem.objects.get_or_create(
            user_id=request.user.id,
            product_id=int(product_id),
        )
        return Response(
            WishlistItemSerializer(item).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class WishlistRemoveView(APIView):
    """DELETE /api/wishlist/remove/<product_id>/ — Remove from wishlist."""
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request, product_id):
        deleted, _ = WishlistItem.objects.filter(
            user_id=request.user.id,
            product_id=product_id,
        ).delete()
        if not deleted:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register — Create a new user account."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST /api/auth/login — Authenticate and return JWT tokens."""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class UserListView(generics.ListAPIView):
    """GET /api/users/ — List all users (admin only)."""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)


class UserDetailView(generics.RetrieveUpdateAPIView):
    """GET/PUT /api/users/<id>/ — User detail."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)


class MeView(APIView):
    """GET/PUT /api/users/me/ — Current user profile."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
