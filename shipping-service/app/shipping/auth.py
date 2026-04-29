"""Stateless JWT authentication for microservices without local User table.

Decodes the JWT token and returns a minimal user object with just the id.
No database lookup required — works across service boundaries.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class MicroserviceUser:
    """Minimal user object from JWT claims — no DB lookup."""

    def __init__(self, user_id):
        self.id = user_id
        self.pk = user_id
        self.is_authenticated = True
        self.is_active = True

    def __str__(self):
        return f"User({self.id})"


class StatelessJWTAuthentication(JWTAuthentication):
    """JWT auth that skips User.objects.get() — returns MicroserviceUser."""

    def get_user(self, validated_token):
        try:
            user_id = validated_token.get('user_id')
            if user_id is None:
                raise InvalidToken('Token contains no user_id')
            return MicroserviceUser(int(user_id))
        except (ValueError, KeyError):
            raise InvalidToken('Invalid user_id in token')
