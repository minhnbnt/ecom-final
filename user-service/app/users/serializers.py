from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'phone', 'address')
        read_only_fields = ('id',)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', User.Role.CUSTOMER),
            phone=validated_data.get('phone', ''),
            address=validated_data.get('address', ''),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user listing and detail."""

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone', 'address',
                  'is_active', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class LoginSerializer(serializers.Serializer):
    """Serializer for login (returns JWT tokens)."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
